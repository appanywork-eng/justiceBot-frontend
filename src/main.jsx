import React from "react";
import ReactDOM from "react-dom/client";

import App from "./App.jsx";
import ContactPage from "./pages/ContactPage.jsx";
import AdminSupportPage from "./pages/AdminSupportPage.jsx";

function resolvePage() {
  const path =
    window.location.pathname
      .replace(/\/+$/, "") ||
    "/";

  if (
    path === "/contact" ||
    path === "/support"
  ) {
    return <ContactPage />;
  }

  if (
    path === "/admin/support"
  ) {
    return <AdminSupportPage />;
  }

  return <App />;
}

ReactDOM.createRoot(
  document.getElementById("root")
).render(
  <React.StrictMode>
    {resolvePage()}
  </React.StrictMode>
);
