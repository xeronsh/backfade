// Toast stack — one global container, appended per page. Spec §11.10.
export type ToastKind = "success" | "info" | "error";

export function toast(message: string, kind: ToastKind = "info"): void {
  let stack = document.querySelector(".toasts");
  if (!stack) {
    stack = document.createElement("div");
    stack.className = "toasts";
    document.body.appendChild(stack);
  }
  const el = document.createElement("div");
  el.className = `toast toast--${kind}`;
  el.textContent = message;
  stack.appendChild(el);
  const ttl = kind === "success" ? 4000 : kind === "info" ? 5000 : 8000;
  window.setTimeout(() => el.remove(), ttl);
}
