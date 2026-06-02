import React from "react";
import { createRoot } from "react-dom/client";
import { ClerkProvider } from "@clerk/clerk-react";
import { App } from "./App";
import { SetupMissingPage } from "./pages/SetupMissingPage";
import { ToastProvider } from "./components/Toast";
import { CLERK_PUBLISHABLE_KEY } from "./lib/api";
import "./styles.css";

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    {CLERK_PUBLISHABLE_KEY ? (
      <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY} afterSignOutUrl="/">
        <ToastProvider>
          <App />
        </ToastProvider>
      </ClerkProvider>
    ) : (
      <SetupMissingPage />
    )}
  </React.StrictMode>,
);
