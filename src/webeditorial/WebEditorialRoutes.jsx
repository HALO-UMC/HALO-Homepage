import { Navigate, Route, Routes } from "react-router-dom";

import CompanyPage from "./CompanyPage.jsx";
import KiriPage from "./KiriPage.jsx";
import PrivacyDraftPage from "./PrivacyDraftPage.jsx";

import "./editorial.css";

export default function WebEditorialRoutes() {
  return (
    <Routes>
      <Route path="/" element={<CompanyPage />} />
      <Route path="/kiri" element={<KiriPage />} />
      <Route path="/webeditorial" element={<Navigate to="/" replace />} />
      <Route path="/webeditorial/kiri" element={<Navigate to="/kiri" replace />} />
      <Route path="/webeditorial/privacy" element={<PrivacyDraftPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
