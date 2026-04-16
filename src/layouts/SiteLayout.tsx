import { Outlet } from 'react-router-dom';
import { SiteNav } from '../components/SiteNav';
import { SiteFooter } from '../components/SiteFooter';

export function SiteLayout() {
  return (
    <div className="min-h-screen flex flex-col">
      <SiteNav />
      <Outlet />
      <SiteFooter />
    </div>
  );
}
