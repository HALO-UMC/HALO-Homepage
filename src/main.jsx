import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import App from "./App.jsx";
import DemodayPage from "./pages/DemodayPage.jsx";

import "./index.css";

const pathname =
  window.location.pathname.replace(/\/+$/, "") || "/";

const isDemodayPage = pathname === "/demoday";

createRoot(
  document.getElementById("root"),
).render(
  <StrictMode>
    {isDemodayPage ? (
      <DemodayPage />
    ) : (
      <App />
    )}
  </StrictMode>,
);