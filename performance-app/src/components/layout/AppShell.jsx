import { Outlet, useLocation } from 'react-router-dom';
import { BottomNav } from './BottomNav';
import { Header } from './Header';

export function AppShell() {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-surface-0 text-white flex flex-col">
      <Header />
      <main className="flex-1 pb-20 md:pb-4 px-4 md:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
