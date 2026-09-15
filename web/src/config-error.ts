// Surfaces a build-configuration failure instead of leaving a blank page.
//
// config.ts throws at module-evaluation time, which happens before any page's own error
// handling can run, so the failure has to be caught globally. Loaded before the page script.
window.addEventListener("error", (e) => {
  const message = e.error instanceof Error ? e.error.message : e.message;
  if (!message || !/VITE_/.test(message)) return;

  const root = document.getElementById("app");
  if (!root || root.dataset.configError === "shown") return;
  root.dataset.configError = "shown";
  root.innerHTML = `
    <main class="page">
      <div class="empty">
        <div class="empty__title">Configuration error</div>
        <p class="muted" style="margin-top:8px;line-height:1.5">${message}</p>
      </div>
    </main>`;
});

export {};
