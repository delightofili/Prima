import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { User } from "@supabase/supabase-js";
import {
  AuthContext,
  type AuthState,
  type CreateFacilityInput,
} from "../hooks/useAuth";
import {
  checkAccess,
  clearNotice,
  eraseThisPhone,
  fetchMyFacility,
  foreignData,
  readLocal,
  readNotice,
  rpcCreateFacility,
  rpcJoinFacility,
  signOutThisPhone,
  writeLocal,
  type LocalAccount,
  type Mine,
} from "../lib/auth";
import { setCurrentFacility, type FacilityInfo } from "../lib/config";
import { startEngines } from "../lib/engines";
import { supabase } from "../lib/supabase";
import {
  AccessEndedScreen,
  FacilityChooser,
  ForeignDataDialog,
  Splash,
  WelcomeScreen,
} from "./AuthScreens";

import { setAuditActor } from "../lib/auditCore";
import { logAudit } from "../lib/audit";
import { SecurityGate } from "./SecurityGate";

const nameOf = (u: User) =>
  (u.user_metadata?.full_name as string | undefined) ??
  u.email?.split("@")[0] ??
  "Staff";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthState["status"]>("loading");
  const [account, setAccount] = useState<LocalAccount | null>(null);
  const [facility, setFacility] = useState<FacilityInfo | null>(null);
  const [cloudOk, setCloudOk] = useState(false);
  const [cloudUser, setCloudUser] = useState<User | null>(null);
  const [accessEnded, setAccessEnded] = useState(false);
  const [foreign, setForeign] = useState<{ unsynced: number } | null>(null);
  const [notice, setNotice] = useState<string | null>(readNotice);

  // Make this phone ready for a facility, unless it holds another facility's records
  const adopt = useCallback(async (user: User, mine: Mine) => {
    const check = await foreignData(mine.facility.id);
    if (check.foreign) {
      setForeign({ unsynced: check.unsynced });
      return;
    }
    const next: LocalAccount = {
      userId: user.id,
      email: user.email ?? "",
      name: nameOf(user),
      role: mine.role,
    };
    await writeLocal(next, mine.facility);
    setCurrentFacility(mine.facility);
    setAuditActor({ id: user.id, name: nameOf(user) });
    void logAudit("auth.sign_in", "user", user.id, "signed in");
    setAccount(next);
    setFacility(mine.facility);
    setStatus("ready");
  }, []);

  const resolveCloud = useCallback(
    async (user: User) => {
      const mine = await fetchMyFacility(user.id);
      if (!mine) {
        setCloudUser(user);
        setStatus("needsFacility");
        return;
      }
      await adopt(user, mine);
    },
    [adopt],
  );

  // 1. Opening the app: the record on the phone decides, never the network
  useEffect(() => {
    let alive = true;
    (async () => {
      const local = await readLocal();
      if (!alive) return;
      if (local) {
        setCurrentFacility(local.facility);
        setAccount(local.account);
        setFacility(local.facility);
        setStatus("ready");
        return;
      }
      try {
        const { data } = await supabase.auth.getSession();
        if (!alive) return;
        if (data.session) {
          await resolveCloud(data.session.user);
          return;
        }
      } catch {
        /* offline: fall through to the sign-in screen */
      }
      if (alive) setStatus("signedOut");
    })();
    return () => {
      alive = false;
    };
  }, [resolveCloud]);

  // 2. Is the cloud session alive? (Only needed for syncing.)
  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setCloudOk(!!session);
      setCloudUser(session?.user ?? null);
    });
    void supabase.auth
      .getSession()
      .then(({ data: s }) => setCloudOk(!!s.session));
    return () => data.subscription.unsubscribe();
  }, []);

  // 3. Background engines start only once a facility is signed in
  useEffect(() => {
    if (status === "ready") startEngines();
  }, [status]);

  // 4. Whenever we are online: is this person still on the team, and did their role or facility change?
  useEffect(() => {
    if (status !== "ready" || !account) return;
    let alive = true;
    const run = async () => {
      if (!navigator.onLine) return;
      const result = await checkAccess(account.userId);
      if (!alive) return;
      if (result.state === "removed") {
        setAccessEnded(true);
      } else if (result.state === "ok") {
        const changed =
          result.mine.role !== account.role ||
          JSON.stringify(result.mine.facility) !== JSON.stringify(facility);
        if (changed) {
          const next = { ...account, role: result.mine.role };
          await writeLocal(next, result.mine.facility);
          setCurrentFacility(result.mine.facility);
          setFacility(result.mine.facility);
          setAccount(next);
        }
      }
    };
    void run();
    window.addEventListener("online", run);
    return () => {
      alive = false;
      window.removeEventListener("online", run);
    };
  }, [status, account, facility]);

  useEffect(() => {
    setAuditActor(account ? { id: account.userId, name: account.name } : null);
  }, [account]);

  const signIn = useCallback(
    async (email: string, password: string) => {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) throw error;
      clearNotice();
      setNotice(null);
      await resolveCloud(data.user);
    },
    [resolveCloud],
  );

  const signUp = useCallback(
    async (name: string, email: string, password: string) => {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { data: { full_name: name.trim() } },
      });
      if (error) throw error;
      if (!data.session || !data.user) {
        throw new Error(
          "Email confirmation is switched on in Supabase. Turn it off under Authentication, then try again.",
        );
      }
      clearNotice();
      setNotice(null);
      setCloudUser(data.user);
      setStatus("needsFacility");
    },
    [],
  );

  const createFacility = useCallback(
    async (input: CreateFacilityInput) => {
      if (!cloudUser) throw new Error("Please sign in again.");
      const created = await rpcCreateFacility(input);
      await adopt(cloudUser, { facility: created, role: "admin" });
    },
    [cloudUser, adopt],
  );

  const joinFacility = useCallback(
    async (code: string) => {
      if (!cloudUser) throw new Error("Please sign in again.");
      await rpcJoinFacility(code);
      const mine = await fetchMyFacility(cloudUser.id);
      if (!mine)
        throw new Error("Could not join the facility. Please try again.");
      await adopt(cloudUser, mine);
    },
    [cloudUser, adopt],
  );

  const refreshFacility = useCallback(async () => {
    if (!account) return;
    const mine = await fetchMyFacility(account.userId);
    if (!mine) return;
    const next = { ...account, role: mine.role };
    await writeLocal(next, mine.facility);
    setCurrentFacility(mine.facility);
    setFacility(mine.facility);
    setAccount(next);
  }, [account]);

  const signOut = useCallback(() => signOutThisPhone(), []);
  const eraseAndSignOut = useCallback(() => eraseThisPhone(), []);

  const value = useMemo<AuthState>(
    () => ({
      status,
      account,
      facility,
      role: account?.role ?? null,
      pendingEmail: cloudUser?.email ?? null,
      cloudOk,
      notice,
      signIn,
      signUp,
      createFacility,
      joinFacility,
      refreshFacility,
      signOut,
      eraseAndSignOut,
    }),
    [
      status,
      account,
      facility,
      cloudUser,
      cloudOk,
      notice,
      signIn,
      signUp,
      createFacility,
      joinFacility,
      refreshFacility,
      signOut,
      eraseAndSignOut,
    ],
  );

  return (
    <AuthContext.Provider value={value}>
      {status === "loading" && <Splash />}
      {status === "signedOut" && <WelcomeScreen />}
      {status === "needsFacility" && <FacilityChooser />}
      {status === "ready" &&
        (accessEnded ? (
          <AccessEndedScreen />
        ) : (
          <SecurityGate>{children}</SecurityGate>
        ))}
      {foreign && <ForeignDataDialog unsynced={foreign.unsynced} />}
    </AuthContext.Provider>
  );
}
