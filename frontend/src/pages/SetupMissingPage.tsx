export function SetupMissingPage() {
  return (
    <div className="grid min-h-screen place-items-center bg-canvas px-6 text-fg">
      <div className="card max-w-[560px]">
        <h1 className="mb-3 text-3xl">Clerk key needed</h1>
        <p className="text-dim">
          Add <code className="text-fg">VITE_CLERK_PUBLISHABLE_KEY</code> to the project{" "}
          <code className="text-fg">.env</code>, then rebuild Docker. Clerk will handle signup, verification, and
          password reset.
        </p>
      </div>
    </div>
  );
}
