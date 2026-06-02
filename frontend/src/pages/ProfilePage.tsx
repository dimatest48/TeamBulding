import { UserButton, useUser } from "@clerk/clerk-react";
import { AppShell } from "../components/AppShell";

export function ProfilePage() {
  const { user } = useUser();
  return (
    <AppShell>
      <div className="card max-w-[620px]">
        <p className="eyebrow">Clerk profile</p>
        <h1 className="mb-5 mt-1 text-3xl">Account</h1>
        <dl className="space-y-4 text-sm">
          <div>
            <dt className="font-semibold text-dim">Name</dt>
            <dd className="text-lg text-fg">{user?.fullName || "Not set"}</dd>
          </div>
          <div>
            <dt className="font-semibold text-dim">Email</dt>
            <dd className="text-lg text-fg">{user?.primaryEmailAddress?.emailAddress}</dd>
          </div>
          <div>
            <dt className="font-semibold text-dim">Email verification</dt>
            <dd className="text-lg capitalize text-fg">{user?.primaryEmailAddress?.verification?.status || "unknown"}</dd>
          </div>
        </dl>
        <div className="mt-6">
          <UserButton afterSignOutUrl="/" />
        </div>
      </div>
    </AppShell>
  );
}
