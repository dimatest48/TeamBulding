import React from "react";
import { createRoot } from "react-dom/client";
import { ClerkProvider } from "@clerk/clerk-react";
import { App } from "./App";
import { SetupMissingPage } from "./pages/SetupMissingPage";
import { CLERK_PUBLISHABLE_KEY } from "./lib/api";
import "./styles.css";

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    {CLERK_PUBLISHABLE_KEY ? (
      <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY} afterSignOutUrl="/">
        <App />
      </ClerkProvider>
    ) : (
      <SetupMissingPage />
    )}
  </React.StrictMode>,
);
