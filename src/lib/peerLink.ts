// Connects two phones directly, with no server in between. The two QR codes (or pasted texts) are the whole
// introduction: the first phone's code carries its connection offer, the second phone's code carries its answer.
// No internet servers are used: both phones must be on the same Wi-Fi (or one phone's hotspot).
import {
  decodeSignal,
  encodeSignal,
  facilityTag,
  randomSid,
  sdpFingerprint,
  stripSdp,
} from "./peerCodec";
import { PeerError, type Link } from "./peerProtocol";

const CONNECT_MS = 40_000; // from the second scan to a working link
const WAIT_MS = 5 * 60_000; // how long a shown code stays usable
const BACKLOG = 1_000_000; // stop sending while this much is waiting to leave, so a slow link is not flooded

export interface Opened {
  link: Link;
  binding: string; // what the two codes agreed on, tied into the proof of the clinic key
}

export interface HostSession {
  code: string; // show this
  accept(answerText: string): Promise<Opened>; // then give it the other phone's code
  cancel(): void;
}

export interface GuestSession {
  code: string; // show this
  connected(): Promise<Opened>; // resolves once the first phone has scanned it
  cancel(): void;
}

function newConnection(): RTCPeerConnection {
  if (typeof RTCPeerConnection === "undefined")
    throw new PeerError("unsupported");
  // No internet servers on purpose: the phones find each other on the local network only
  return new RTCPeerConnection({ iceServers: [] });
}

async function gathered(pc: RTCPeerConnection): Promise<string> {
  await new Promise<void>((resolve) => {
    if (pc.iceGatheringState === "complete") return resolve();
    const check = () => {
      if (pc.iceGatheringState === "complete") {
        pc.removeEventListener("icegatheringstatechange", check);
        resolve();
      }
    };
    pc.addEventListener("icegatheringstatechange", check);
    setTimeout(resolve, 5000);
  });
  const sdp = stripSdp(pc.localDescription?.sdp ?? "");
  if (!/^a=candidate:/m.test(sdp)) throw new PeerError("link"); // no network address at all: Wi-Fi is off
  return sdp;
}

// Turns the browser's data channel into the Link the conversation needs
function wrap(channel: RTCDataChannel, pc: RTCPeerConnection): Link {
  const pending: string[] = [];
  let onMsg: ((t: string) => void) | null = null;
  let onClose: (() => void) | null = null;
  let closed = false;
  let fell: ReturnType<typeof setTimeout> | undefined;

  const finish = () => {
    if (closed) return;
    closed = true;
    clearTimeout(fell);
    onClose?.();
  };

  channel.onmessage = (e) => {
    if (typeof e.data !== "string") return; // only text is part of the conversation
    if (onMsg) onMsg(e.data);
    else pending.push(e.data);
  };
  channel.onclose = finish;
  channel.onerror = finish;
  pc.addEventListener("connectionstatechange", () => {
    if (pc.connectionState === "failed" || pc.connectionState === "closed")
      finish();
    // "disconnected" often comes back by itself; give it a few seconds
    else if (pc.connectionState === "disconnected")
      fell = setTimeout(finish, 8000);
    else clearTimeout(fell);
  });

  return {
    async send(text) {
      if (closed || channel.readyState !== "open")
        throw new PeerError("closed");
      channel.send(text);
      while (channel.bufferedAmount > BACKLOG && !closed) {
        channel.bufferedAmountLowThreshold = BACKLOG / 4;
        await new Promise<void>((resolve) => {
          const done = () => {
            clearTimeout(t);
            channel.removeEventListener("bufferedamountlow", done);
            resolve();
          };
          const t = setTimeout(done, 10_000);
          channel.addEventListener("bufferedamountlow", done);
        });
      }
    },
    onMessage(cb) {
      onMsg = cb;
      for (const m of pending.splice(0)) cb(m);
    },
    onClose(cb) {
      onClose = cb;
      if (closed) cb();
    },
    close() {
      try {
        channel.close();
        pc.close();
      } catch {
        /* already closed */
      }
      finish();
    },
  };
}

function whenOpen(
  channel: RTCDataChannel,
  pc: RTCPeerConnection,
  ms: number,
): Promise<void> {
  return new Promise((resolve, reject) => {
    if (channel.readyState === "open") return resolve();
    const timer = setTimeout(() => stop(new PeerError("link")), ms);
    const stop = (err?: PeerError) => {
      clearTimeout(timer);
      channel.removeEventListener("open", onOpen);
      pc.removeEventListener("connectionstatechange", onState);
      if (err) reject(err);
      else resolve();
    };
    const onOpen = () => stop();
    const onState = () => {
      if (pc.connectionState === "failed" || pc.connectionState === "closed")
        stop(new PeerError("link"));
    };
    channel.addEventListener("open", onOpen);
    pc.addEventListener("connectionstatechange", onState);
  });
}

const fingerprintOrFail = (sdp: string) => {
  const fp = sdpFingerprint(sdp);
  if (!fp) throw new PeerError("code");
  return fp;
};

// The first phone: makes the offer code, then takes the answer code
export async function startHost(facilityId: string): Promise<HostSession> {
  const pc = newConnection();
  const channel = pc.createDataChannel("prima", { ordered: true });
  let over = false;
  const cancel = () => {
    over = true;
    clearTimeout(expire);
    try {
      pc.close();
    } catch {
      /* already closed */
    }
  };
  const expire = setTimeout(cancel, WAIT_MS);
  try {
    await pc.setLocalDescription(await pc.createOffer());
    const sdp = await gathered(pc);
    const sid = randomSid();
    const fac = await facilityTag(facilityId);
    const code = await encodeSignal({ v: 1, kind: "offer", sid, fac, sdp });
    const fpHost = fingerprintOrFail(pc.localDescription?.sdp ?? "");

    return {
      code,
      cancel,
      async accept(answerText) {
        if (over) throw new PeerError("timeout");
        const answer = await decodeSignal(answerText).catch(() => {
          throw new PeerError("code");
        });
        if (answer.kind !== "answer" || answer.sid !== sid)
          throw new PeerError("code");
        if (answer.fac !== fac) throw new PeerError("facility");
        const fpGuest = fingerprintOrFail(answer.sdp);
        clearTimeout(expire);
        await pc.setRemoteDescription({ type: "answer", sdp: answer.sdp });
        await whenOpen(channel, pc, CONNECT_MS);
        return {
          link: wrap(channel, pc),
          binding: [sid, fpHost, fpGuest].join("|"),
        };
      },
    };
  } catch (e) {
    cancel();
    throw e;
  }
}

// The second phone: takes the offer code, makes the answer code, then waits for the first phone to scan it
export async function joinAsGuest(
  offerText: string,
  facilityId: string,
): Promise<GuestSession> {
  const offer = await decodeSignal(offerText).catch(() => {
    throw new PeerError("code");
  });
  if (offer.kind !== "offer") throw new PeerError("code");
  if (offer.fac !== (await facilityTag(facilityId)))
    throw new PeerError("facility");
  const fpHost = fingerprintOrFail(offer.sdp);

  const pc = newConnection();
  const cancel = () => {
    try {
      pc.close();
    } catch {
      /* already closed */
    }
  };
  try {
    const channelReady = new Promise<RTCDataChannel>((resolve) => {
      pc.ondatachannel = (e) => resolve(e.channel);
    });
    await pc.setRemoteDescription({ type: "offer", sdp: offer.sdp });
    await pc.setLocalDescription(await pc.createAnswer());
    const sdp = await gathered(pc);
    const code = await encodeSignal({
      v: 1,
      kind: "answer",
      sid: offer.sid,
      fac: offer.fac,
      sdp,
    });
    const fpGuest = fingerprintOrFail(pc.localDescription?.sdp ?? "");

    const opened = (async (): Promise<Opened> => {
      const channel = await Promise.race([
        channelReady,
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new PeerError("timeout")), WAIT_MS),
        ),
      ]);
      await whenOpen(channel, pc, CONNECT_MS);
      return {
        link: wrap(channel, pc),
        binding: [offer.sid, fpHost, fpGuest].join("|"),
      };
    })();
    opened.catch(() => undefined); // the screen asks for the result; this only keeps an unread failure from being reported twice

    return { code, connected: () => opened, cancel };
  } catch (e) {
    cancel();
    throw e;
  }
}
