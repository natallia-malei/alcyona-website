import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import "./index.css";
import "./i18n";
import { router } from "./router";
import { StorageProvider } from "./storage/StorageProvider";
import { AuthProvider } from "./auth/AuthProvider";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AuthProvider>
      <StorageProvider>
        <RouterProvider router={router} />
      </StorageProvider>
    </AuthProvider>
  </StrictMode>,
);
