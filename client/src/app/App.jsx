import { Route, Routes } from 'react-router-dom';
import '../api/consentApi.js';
import '../api/pushApi.js';
import PublicLayout from '../components/PublicLayout.jsx';
import CalendarPage from '../pages/owner/CalendarPage.jsx';
import LaunchPlanPage from '../pages/owner/LaunchPlanPage.jsx';
import MembersPage from '../pages/owner/MembersPage.jsx';
import OnlinePage from '../pages/owner/OnlinePage.jsx';
import SetupPage from '../pages/owner/SetupPage.jsx';
import SettingsPage from '../pages/owner/SettingsPage.jsx';
import StudioLayout from '../pages/owner/StudioLayout.jsx';
import TerminiPage from '../pages/owner/TerminiPage.jsx';
import { StudioHome } from '../pages/owner/studioPages.jsx';
import MemberBookPage from '../pages/member/MemberBookPage.jsx';
import MemberDiscoverPage from '../pages/member/MemberDiscoverPage.jsx';
import MemberHomePage from '../pages/member/MemberHomePage.jsx';
import MemberLayout from '../pages/member/MemberLayout.jsx';
import MemberOnlinePage from '../pages/member/MemberOnlinePage.jsx';
import StudioPolicyPage from '../pages/member/StudioPolicyPage.jsx';
import UsageTracker from '../components/UsageTracker.jsx';
import StudioAnalyticsPage from '../pages/owner/StudioAnalyticsPage.jsx';
import {
  LAUNCH_PLAN_ENABLED,
  ONLINE_ENABLED,
} from '../lib/studioFeatures.js';
import ForgotPasswordPage from '../pages/public/ForgotPasswordPage.jsx';
import HomePage from '../pages/public/HomePage.jsx';
import LoginPage from '../pages/public/LoginPage.jsx';
import AdminGate from '../pages/admin/AdminGate.jsx';
import AdminHomePage from '../pages/admin/AdminHomePage.jsx';
import AdminStaffPage from '../pages/admin/AdminStaffPage.jsx';
import PlatformGate from '../pages/platform/PlatformGate.jsx';
import {
  PlatformActivityPage,
  PlatformBillingPage,
  PlatformReportsPage,
  PlatformStudiosPage,
  PlatformSystemPage,
  PlatformUsersPage,
} from '../pages/platform/platformPages.jsx';
import PlatformAnalyticsPage from '../pages/public/PlatformAnalyticsPage.jsx';
import RegisterPage from '../pages/public/RegisterPage.jsx';
import ResetPasswordPage from '../pages/public/ResetPasswordPage.jsx';
import {
  MaintenancePage,
  NotFoundPage,
} from '../pages/public/StatusPage.jsx';
import {
  ContactPage,
  CookiesPage,
  FeedbackPage,
  PrivacyPage,
  TermsPage,
} from '../pages/public/sitePages.jsx';

const maintenanceOn = import.meta.env.VITE_MAINTENANCE === 'true';

export default function App() {
  if (maintenanceOn) {
    return (
      <Routes>
        <Route element={<PublicLayout />}>
          <Route path="*" element={<MaintenancePage />} />
        </Route>
      </Routes>
    );
  }

  return (
    <>
      <UsageTracker />
      <Routes>
        <Route path="/s/:slug" element={<MemberLayout />}>
          <Route index element={<MemberHomePage />} />
          <Route path="termini" element={<MemberBookPage />} />
          {ONLINE_ENABLED ? <Route path="online" element={<MemberOnlinePage />} /> : null}
          <Route path="otkrij" element={<MemberDiscoverPage />} />
          <Route path="privatnost" element={<StudioPolicyPage kind="privacy" />} />
          <Route path="uvjeti" element={<StudioPolicyPage kind="terms" />} />
          <Route path="kolacici" element={<StudioPolicyPage kind="cookies" />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
        <Route path="/stranica" element={<StudioLayout />}>
          <Route index element={<StudioHome />} />
          <Route path="termini" element={<TerminiPage />} />
          {ONLINE_ENABLED ? <Route path="online" element={<OnlinePage />} /> : null}
          <Route path="kalendar" element={<CalendarPage />} />
          <Route path="clanovi" element={<MembersPage />} />
          <Route path="analitika" element={<StudioAnalyticsPage />} />
          {LAUNCH_PLAN_ENABLED ? <Route path="plan" element={<LaunchPlanPage />} /> : null}
          <Route path="postavke" element={<SettingsPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
        <Route element={<PublicLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/otkrij" element={<MemberDiscoverPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/zaboravljena-lozinka" element={<ForgotPasswordPage />} />
          <Route path="/nova-lozinka" element={<ResetPasswordPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/admin" element={<AdminGate />}>
            <Route index element={<AdminHomePage />} />
            <Route path="djelatnici" element={<AdminStaffPage />} />
          </Route>
          <Route path="/analitika" element={<PlatformGate />}>
            <Route index element={<PlatformAnalyticsPage />} />
            <Route path="studiji" element={<PlatformStudiosPage />} />
            <Route path="korisnici" element={<PlatformUsersPage />} />
            <Route path="aktivnost" element={<PlatformActivityPage />} />
            <Route path="placanja" element={<PlatformBillingPage />} />
            <Route path="izvjestaji" element={<PlatformReportsPage />} />
            <Route path="sustav" element={<PlatformSystemPage />} />
          </Route>
          <Route path="/postavljanje" element={<SetupPage />} />
          <Route path="/privatnost" element={<PrivacyPage />} />
          <Route path="/uvjeti" element={<TermsPage />} />
          <Route path="/kolacici" element={<CookiesPage />} />
          <Route path="/kontakt" element={<ContactPage />} />
          <Route path="/povratna-informacija" element={<FeedbackPage />} />
          <Route path="/odrzavanje" element={<MaintenancePage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </>
  );
}
