import "@rainbow-me/rainbowkit/styles.css";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "sonner";
import { Providers } from "@/app/providers";
import { AppRouter } from "@/app/router";

export function App() {
  return (
    <Providers>
      <BrowserRouter>
        <AppRouter />
        <Toaster position="bottom-right" theme="dark" closeButton />
      </BrowserRouter>
    </Providers>
  );
}
