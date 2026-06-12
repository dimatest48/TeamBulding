import { motion } from "framer-motion";
import {
  BookOpen,
  Folders,
  LayoutDashboard,
  ListTodo,
  LogOut,
  Share2,
  User as UserIcon,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { UserButton, useAuth, useUser } from "@clerk/clerk-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { SPRING_SNAP, navIconMotion } from "../lib/motion";

type NavItem = { to: string; label: string; icon: LucideIcon };

const PRIMARY: NavItem[] = [{ to: "/cabinet", label: "Overview", icon: LayoutDashboard }];
const WORKSPACE: NavItem[] = [
  { to: "/tasks", label: "Tasks", icon: ListTodo },
  { to: "/shared", label: "Shared with me", icon: Share2 },
  { to: "/subjects", label: "Subjects", icon: Folders },
];
const SECONDARY: NavItem[] = [{ to: "/profile", label: "Profile", icon: UserIcon }];

function NavRow({ item, active, onClick }: { item: NavItem; active: boolean; onClick?: () => void }) {
  const Icon = item.icon;
  return (
    <motion.div whileHover={{ x: 2 }} whileTap={{ scale: 0.96 }} transition={SPRING_SNAP} className="relative">
      {active && (
        <motion.span
          layoutId="nav-active"
          transition={SPRING_SNAP}
          className="absolute inset-0 rounded-xl border border-accent/40 bg-gradient-to-r from-accent/25 to-accent-2/15 shadow-[0_0_24px_-6px_rgba(99,102,241,0.6)]"
        />
      )}
      <Link
        to={item.to}
        onClick={onClick}
        className={`relative flex items-center gap-3 rounded-xl px-4 py-3 font-semibold transition-colors ${
          active ? "text-fg" : "text-dim hover:text-fg"
        }`}
      >
        {active && <span className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-full bg-accent" />}
        <motion.span {...navIconMotion} className="grid place-items-center">
          <Icon size={18} />
        </motion.span>
        {item.label}
      </Link>
    </motion.div>
  );
}

export function Sidebar({ onClose }: { onClose?: () => void }) {
  const { signOut } = useAuth();
  const { user } = useUser();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const displayName = user?.fullName || user?.primaryEmailAddress?.emailAddress || "Student";

  const isActive = (to: string) =>
    to === "/cabinet" ? pathname === "/cabinet" : pathname === to || pathname.startsWith(`${to}/`);

  return (
    <aside className="flex flex-col border-r border-line bg-panel px-5 py-6 backdrop-blur h-full min-h-screen md:bg-panel/60 md:min-h-screen">
      <div className="mb-9 flex items-center justify-between">
        <Link className="flex items-center gap-2.5 font-display text-xl font-semibold text-fg" to="/" onClick={onClose}>
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-accent to-accent-2 text-white shadow-[0_8px_24px_-8px_rgba(99,102,241,0.8)]">
            <BookOpen size={18} />
          </span>
          Tasker
        </Link>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="grid h-9 w-9 place-items-center rounded-xl border border-line bg-white/[0.03] text-dim hover:text-fg md:hidden"
            aria-label="Close sidebar"
          >
            <X size={18} />
          </button>
        )}
      </div>

      <div className="mb-8 flex items-center gap-3 rounded-2xl border border-line bg-white/[0.03] p-3">
        <UserButton afterSignOutUrl="/" />
        <div className="min-w-0">
          <strong className="block truncate text-sm text-fg">{displayName}</strong>
          <span className="block truncate text-xs text-dim">{user?.primaryEmailAddress?.emailAddress}</span>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-1.5">
        {PRIMARY.map((item) => (
          <NavRow key={item.to} item={item} active={isActive(item.to)} onClick={onClose} />
        ))}

        <p className="mb-1 mt-5 px-4 text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-faint">
          Workspace
        </p>
        {WORKSPACE.map((item) => (
          <NavRow key={item.to} item={item} active={isActive(item.to)} onClick={onClose} />
        ))}

        <div className="my-4 h-px bg-line" />
        {SECONDARY.map((item) => (
          <NavRow key={item.to} item={item} active={isActive(item.to)} onClick={onClose} />
        ))}

        <motion.button
          type="button"
          whileHover={{ x: 2 }}
          whileTap={{ scale: 0.96 }}
          transition={SPRING_SNAP}
          className="mt-1 flex items-center gap-3 rounded-xl px-4 py-3 text-left font-semibold text-dim transition-colors hover:text-rose"
          onClick={() => {
            if (onClose) onClose();
            signOut(() => navigate("/"));
          }}
        >
          <motion.span {...navIconMotion} className="grid place-items-center">
            <LogOut size={18} />
          </motion.span>
          Log out
        </motion.button>
      </nav>
    </aside>
  );
}
