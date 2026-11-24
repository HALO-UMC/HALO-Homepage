import { Navigate, Route, Routes } from "react-router-dom";

import { partners } from "../data/companyData.js";
import { PartnerPage, PartnershipPage } from "./CorporateSubpages.jsx";
import CompanyPage from "./CompanyPage.jsx";
import InvitePage from "./InvitePage.jsx";
import KiriPage from "./KiriPage.jsx";
import PrivacyDraftPage from "./PrivacyDraftPage.jsx";

import "./editorial.css";
import "./corporate.css";

export default function WebEditorialRoutes() {
  return (
    <Routes>
      <Route path="/" element={<CompanyPage />} />
      {partners.map(({ slug }) => <Route key={slug} path={`/partners/${slug}`} element={<PartnerPage key={slug} slug={slug} />} />)}
      <Route path="/partnership" element={<PartnershipPage />} />
      <Route path="/kiri" element={<KiriPage />} />
      <Route path="/invite/*" element={<InvitePage />} />
      <Route path="/webeditorial" element={<Navigate to="/" replace />} />
      <Route path="/webeditorial/kiri" element={<Navigate to="/kiri" replace />} />
      <Route path="/webeditorial/privacy" element={<PrivacyDraftPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
