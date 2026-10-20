import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useAuth } from "../hooks/useAuth";
import { LockContext, type LockState } from "../hooks/useLock";
import { logAudit } from "../lib/audit";
import {
  clearPin,
  readAutoLock,
  readPin,
  resetGuard,
  saveAutoLock,
  writePin,
  type PinRecord,
} from "../lib/pin";
import { hasAcknowledged } from "../lib/privacy";
import { Splash } from "./AuthScreens";
import {
  ForgotPinDialog,
  LockScreen,
  SetupScreen,
  StaffAckScreen,
} from "./LockScreens";

type Phase = "loading" | "setup" | "locked" | "ack" | "open";

export function SecurityGate({ children }: { children: ReactNode }) {
  const { account } = useAuth();
  const userId = account?.userId;
  const [phase, setPhase] = useState<Phase>("loading");
  const [pin, setPin] = useState<PinRecord | null>(null);
  const [minutes, setMinutesState] = useState(readAutoLock);
  const [forgot, setForgot] = useState(false);
  const appRef = useRef<HTMLDivElement>(null);
  const lastActive = useRef(0);

  // Every time the app opens it starts locked (or asks for a PIN if there is none yet)
  useEffect(() => {
    if (!userId) return;
    let alive = true;
    (async () => {
      const rec = await readPin();
      if (!alive) return;
      const mine = rec && rec.userId === userId ? rec : null;
      setPin(mine);
      setPhase(mine ? "locked" : "setup");
    })();
    return () => {
      alive = false;
    };
  }, [userId]);

  // While locked, the app behind stays mounted (so a half-filled form survives) but cannot be reached
  useEffect(() => {
    if (appRef.current) appRef.current.inert = phase !== "open";
  }, [phase]);

  const proceed = useCallback(async () => {
    lastActive.current = Date.now();
    setPhase((await hasAcknowledged(userId ?? "")) ? "open" : "ack");
  }, [userId]);

  // Auto-lock after a quiet spell, and when coming back to the app after a while away
  useEffect(() => {
    if (phase !== "open") return;
    const touch = () => {
      lastActive.current = Date.now();
    };
    const check = () => {
      if (Date.now() - lastActive.current > minutes * 60_000)
        setPhase("locked");
    };
    const onVisible = () => {
      if (document.visibilityState === "visible") check();
    };
    const events = ["pointerdown", "keydown", "touchstart", "scroll"];
    events.forEach((e) => window.addEventListener(e, touch, { passive: true }));
    document.addEventListener("visibilitychange", onVisible);
    const timer = setInterval(check, 10_000);
    return () => {
      events.forEach((e) => window.removeEventListener(e, touch));
      document.removeEventListener("visibilitychange", onVisible);
      clearInterval(timer);
    };
  }, [phase, minutes]);

  const savePin = useCallback(async (rec: PinRecord) => {
    await writePin(rec);
    setPin(rec);
    resetGuard();
    void logAudit(
      "security.pin_changed",
      "user",
      rec.userId,
      "PIN set or changed",
    );
  }, []);

  const value = useMemo<LockState>(
    () => ({
      lockNow: () => setPhase("locked"),
      minutes,
      setMinutes: (m) => {
        saveAutoLock(m);
        setMinutesState(m);
      },
      pin,
      savePin,
    }),
    [minutes, pin, savePin],
  );

  return (
    <LockContext.Provider value={value}>
      <div ref={appRef}>{children}</div>

      {phase !== "open" && (
        <div className="fixed inset-0 z-[70] overflow-y-auto bg-page">
          {phase === "loading" && <Splash />}
          {phase === "setup" && userId && (
            <SetupScreen
              userId={userId}
              onDone={async (rec) => {
                await savePin(rec);
                await proceed();
              }}
            />
          )}
          {phase === "locked" && pin && (
            <LockScreen
              pin={pin}
              onUnlock={() => void proceed()}
              onForgot={() => setForgot(true)}
            />
          )}
          {phase === "ack" && (
            <StaffAckScreen
              onDone={() => {
                lastActive.current = Date.now();
                setPhase("open");
              }}
            />
          )}
        </div>
      )}

      {forgot && account && (
        <ForgotPinDialog
          email={account.email}
          onClose={() => setForgot(false)}
          onVerified={async () => {
            setForgot(false);
            await clearPin();
            resetGuard();
            setPin(null);
            setPhase("setup");
          }}
        />
      )}
    </LockContext.Provider>
  );
}
