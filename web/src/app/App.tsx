import "@rainbow-me/rainbowkit/styles.css";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "sonner";
import { ErrorBoundary } from "@/app/error-boundary";
import { Providers } from "@/app/providers";
import { AppRouter } from "@/app/router";
import { LocaleProvider } from "@/lib/locale-provider";

export function App() {
  return (
    <ErrorBoundary>
      <LocaleProvider>
        <Providers>
          <BrowserRouter>
            <AppRouter />
            <Toaster position="bottom-right" theme="dark" closeButton />
          </BrowserRouter>
        </Providers>
      </LocaleProvider>
    </ErrorBoundary>
  );
}
