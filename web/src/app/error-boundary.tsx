import { Component, type ErrorInfo, type ReactNode } from "react";
import { ConfigurationError } from "@/components/backfade/ConfigurationError";

interface Props {
  children: ReactNode;
}

interface State {
  message: string | null;
}

/**
 * Catches render-time failures anywhere below it. Without this, a single bad
 * component unmounts the whole tree and the reader gets a blank page with
 * nothing but a console error to go on.
 *
 * It reports the error rather than swallowing it: the console keeps the real
 * stack, and the surface offers a reload.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { message: null };

  static getDerivedStateFromError(error: unknown): State {
    return {
      message:
        error instanceof Error
          ? error.message
          : "An unknown error stopped the interface.",
    };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Keep the real stack visible for debugging; the UI shows a summary.
    console.error("Render error:", error, info.componentStack);
  }

  render() {
    if (this.state.message === null) return this.props.children;
    return <ConfigurationError message={this.state.message} />;
  }
}
