import { NavLink, Outlet } from "react-router-dom";
import { ChartColumn, House, UserPlus, Users } from "lucide-react";
import { GloveToggle } from "./GloveToggle";
import { Logo } from "./Logo";
import { SyncBadge } from "./SyncBadge";
import { config } from "../lib/config";

const NAV = [
  { to: "/", label: "Home", icon: House, end: true },
  { to: "/register", label: "Register", icon: UserPlus, end: false },
  { to: "/patients", label: "Patients", icon: Users, end: false },
  { to: "/dashboard", label: "Dashboard", icon: ChartColumn, end: false },
];

export function AppShell() {
  return (
    <div className="min-h-screen md:flex">
      {/* Sidebar: tablets and laptops */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r-2 border-line bg-white p-4 md:flex">
        <Logo />
        <p className="mt-1 text-sm text-subtext">{config.facilityName}</p>
        <nav className="mt-6 flex flex-col gap-1">
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex h-12 items-center gap-3 rounded-xl px-3 text-base font-semibold ${
                  isActive
                    ? "bg-prima-50 text-prima-900"
                    : "text-ink hover:bg-page"
                }`
              }
            >
              <Icon size={22} /> {label}
            </NavLink>
          ))}
        </nav>
        <div className="mt-auto space-y-3">
          <GloveToggle />
          <SyncBadge />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top bar: phones */}
        <header className="flex items-center justify-between bg-prima-500 px-4 pb-3 pt-[calc(0.75rem+env(safe-area-inset-top))] md:hidden">
          <Logo light size={32} />
          <SyncBadge />
        </header>

        <main className="mx-auto w-full max-w-5xl flex-1 px-4 pb-28 pt-5 md:px-8 md:pb-10 md:pt-8">
          <Outlet />
        </main>
      </div>

      {/* Bottom tabs: phones */}
      <nav className="fixed inset-x-0 bottom-0 z-10 grid grid-cols-4 border-t-2 border-line bg-white pb-[env(safe-area-inset-bottom)] md:hidden">
        {NAV.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex h-16 flex-col items-center justify-center gap-1 text-sm font-semibold ${
                isActive ? "text-prima-500" : "text-subtext"
              }`
            }
          >
            <Icon size={24} /> {label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
