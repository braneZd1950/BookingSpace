import { Route, Routes } from 'react-router-dom';
import '@client/api/consentApi.js';
import '@client/api/pushApi.js';
import UsageTracker from '@client/components/UsageTracker.jsx';
import CalendarPage from '@client/pages/owner/CalendarPage.jsx';
import LaunchPlanPage from '@client/pages/owner/LaunchPlanPage.jsx';
import MembersPage from '@client/pages/owner/MembersPage.jsx';
import OnlinePage from '@client/pages/owner/OnlinePage.jsx';
import SetupPage from '@client/pages/owner/SetupPage.jsx';
import SettingsPage from '@client/pages/owner/SettingsPage.jsx';
import TerminiPage from '@client/pages/owner/TerminiPage.jsx';
import { StudioHome } from '@client/pages/owner/studioPages.jsx';
import StudioAnalyticsPage from '@client/pages/owner/StudioAnalyticsPage.jsx';
import MemberBookPage from '@client/pages/member/MemberBookPage.jsx';
import MemberHomePage from '@client/pages/member/MemberHomePage.jsx';
import MemberOnlinePage from '@client/pages/member/MemberOnlinePage.jsx';
import MemberPrivacyPage from '@client/pages/member/MemberPrivacyPage.jsx';
import ForgotPasswordPage from '@client/pages/public/ForgotPasswordPage.jsx';
import HomePage from '@client/pages/public/HomePage.jsx';
import LoginPage from '@client/pages/public/LoginPage.jsx';
import RegisterPage from '@client/pages/public/RegisterPage.jsx';
import ResetPasswordPage from '@client/pages/public/ResetPasswordPage.jsx';
import {
  MaintenancePage,
  NotFoundPage,
} from '@client/pages/public/StatusPage.jsx';
import {
  ContactPage,
  CookiesPage,
  FeedbackPage,
  PrivacyPage,
  TermsPage,
} from '@client/pages/public/sitePages.jsx';
import {
  LAUNCH_PLAN_ENABLED,
  ONLINE_ENABLED,
} from '@client/lib/studioFeatures.js';
import MobileMemberLayout from './layouts/MobileMemberLayout.jsx';
import MobilePublicLayout from './layouts/MobilePublicLayout.jsx';
import MobileStudioLayout from './layouts/MobileStudioLayout.jsx';

const maintenanceOn = import.meta.env.VITE_MAINTENANCE === 'true';

export default function App() {
  if (maintenanceOn) {
    return (
      <Routes>
        <Route element={<MobilePublicLayout />}>
          <Route path="*" element={<MaintenancePage />} />
        </Route>
      </Routes>
    );
  }

  return (
    <>
      <UsageTracker />
      <Routes>
        <Route path="/s/:slug" element={<MobileMemberLayout />}>
          <Route index element={<MemberHomePage />} />
          <Route path="termini" element={<MemberBookPage />} />
          {ONLINE_ENABLED ? <Route path="online" element={<MemberOnlinePage />} /> : null}
          <Route path="privatnost" element={<MemberPrivacyPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>

        <Route path="/stranica" element={<MobileStudioLayout />}>
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

        <Route element={<MobilePublicLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/zaboravljena-lozinka" element={<ForgotPasswordPage />} />
          <Route path="/nova-lozinka" element={<ResetPasswordPage />} />
          <Route path="/register" element={<RegisterPage />} />
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
