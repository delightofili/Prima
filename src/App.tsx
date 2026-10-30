import { Link, Route, Routes } from "react-router-dom";
import { AppShell } from "./components/AppShell";
import { HomePage } from "./pages/HomePage";
import { PatientDetailPage } from "./pages/PatientDetailPage";
import { PatientsPage } from "./pages/PatientsPage";
import { RegisterPage } from "./pages/RegisterPage";
import { NewVisitPage } from "./pages/NewVisitPage";
import { EditPatientPage } from "./pages/EditPatientPage";
import { EditVisitPage } from "./pages/EditVisitPage";
import { DashboardPage } from "./pages/DashboardPage";
import { PlansPage } from "./pages/PlansPage";
import { DuplicatesPage } from "./pages/DuplicatesPage";
import { AccountPage } from "./pages/AccountPage";
import { AdminPage } from "./pages/AdminPage";
import { PrivacyPage } from "./pages/PrivacyPage";
import { PhoneCheckPage } from "./pages/PhoneCheckPage";
import { ScanPage } from "./pages/ScanPage";
import { PatientCardPage } from "./pages/PatientCardPage";
import { SyncDoctorPage } from "./pages/SyncDoctorPage";
import { TranslationsPage } from "./pages/TranslationsPage";
import { useI18n } from "./i18n";

function NotFound() {
  const { t } = useI18n();
  return (
    <div className="card mx-auto max-w-md space-y-3 text-center">
      <p className="text-lg font-semibold">{t("app.notFound")}</p>
      <Link to="/" className="btn btn-secondary">
        {t("app.goHome")}
      </Link>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<HomePage />} />
        <Route path="register" element={<RegisterPage />} />
        <Route path="patients" element={<PatientsPage />} />
        <Route path="patients/:id" element={<PatientDetailPage />} />
        <Route path="patients/:id/visits/new" element={<NewVisitPage />} />
        <Route path="patients/:id/edit" element={<EditPatientPage />} />
        <Route
          path="patients/:id/visits/:visitId/edit"
          element={<EditVisitPage />}
        />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="plans" element={<PlansPage />} />
        <Route path="duplicates" element={<DuplicatesPage />} />
        <Route path="account" element={<AccountPage />} />
        <Route path="privacy" element={<PrivacyPage />} />
        <Route path="admin" element={<AdminPage />} />
        <Route path="phone-check" element={<PhoneCheckPage />} />
        <Route path="scan" element={<ScanPage />} />
        <Route path="patients/:id/card" element={<PatientCardPage />} />
        <Route path="sync-doctor" element={<SyncDoctorPage />} />
        <Route path="translations" element={<TranslationsPage />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
