import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import SiteFooter from './SiteFooter.jsx';
import SiteHeader from './SiteHeader.jsx';
import './PublicLayout.scss';

export default function PublicLayout() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (!hash) {
      window.scrollTo(0, 0);
      return;
    }

    const target = document.getElementById(hash.slice(1));
    if (target) target.scrollIntoView({ block: 'start' });
  }, [pathname, hash]);

  return (
    <div className="public">
      <SiteHeader />
      <Outlet />
      <SiteFooter />
    </div>
  );
}
