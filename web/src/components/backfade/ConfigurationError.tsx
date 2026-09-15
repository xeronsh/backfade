export function ConfigurationError({ message }: { message: string }) {
  return (
    <main className="mx-auto flex min-h-screen max-w-xl items-center px-6">
      <section className="w-full rounded-panel border border-fade bg-fade-soft p-6">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.08em] text-fade">
          Configuration Error
        </p>
        <h1 className="mb-3 text-2xl font-semibold">
          Backfade is not configured
        </h1>
        <p className="text-sm text-text-2">{message}</p>
        <p className="mt-4 text-sm text-text-3">
          Copy `.env.example` to `.env.local`, fill the deployment values, then
          restart Vite.
        </p>
      </section>
    </main>
  );
}
