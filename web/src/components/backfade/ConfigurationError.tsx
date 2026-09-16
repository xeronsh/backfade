export function ConfigurationError({ message }: { message: string }) {
  // Only a genuine schema failure should tell the reader to edit env files.
  // Any other throw here is a module/import failure, and sending someone to
  // `.env.local` for that wastes their time.
  const isConfig = message.startsWith("Configuration Error:");
  return (
    <main className="mx-auto flex min-h-screen max-w-xl items-center px-6">
      <section className="w-full rounded-panel border border-fade bg-fade-soft p-6">
        <p className="mb-2 font-mono text-meta uppercase tracking-eyebrow text-fade">
          {isConfig ? "Configuration error" : "Startup error"}
        </p>
        <h1 className="mb-3 text-page-title font-semibold">
          {isConfig ? "Backfade is not configured" : "Backfade failed to start"}
        </h1>
        <p className="text-body text-text-2">{message}</p>
        <p className="mt-4 text-body text-text-3">
          {isConfig
            ? "Copy `.env.example` to `.env.local`, fill the deployment values, then restart Vite."
            : "Reload the page. If it persists, check the browser console for the failing module."}
        </p>
      </section>
    </main>
  );
}
