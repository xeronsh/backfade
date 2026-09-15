import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ConfigurationError } from "@/components/backfade/ConfigurationError";
import "./styles/globals.css";

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("Missing root element");
const root = createRoot(rootElement);

async function bootstrap() {
  try {
    if (import.meta.env.VITE_FORCE_CONFIG_ERROR === "1")
      throw new Error("Configuration Error: forced test failure");
    const { App } = await import("./app/App");
    root.render(
      <StrictMode>
        <App />
      </StrictMode>,
    );
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "The app configuration could not be loaded.";
    root.render(<ConfigurationError message={message} />);
  }
}

void bootstrap();
