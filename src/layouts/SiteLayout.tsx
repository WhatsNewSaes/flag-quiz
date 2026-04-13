import { Outlet } from 'react-router-dom';
import { SiteNav } from '../components/SiteNav';

export function SiteLayout() {
  return (
    <>
      <SiteNav />
      <Outlet />
    </>
  );
}
