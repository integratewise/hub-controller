import { Sidebar } from '@/components/hub/Sidebar';
import { Topbar } from '@/components/hub/Topbar';

export const metadata = {
  title: 'IntegrateWise Hub | Universal Controller',
  description: 'Universal Controller Hub - Dashboard and command center',
};

export default function HubLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-screen w-screen bg-neutral-950 text-neutral-100 flex dark hub-dark">
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-hidden">
        <Topbar />
        <div className="p-6 overflow-y-auto flex-1">{children}</div>
      </main>
    </div>
  );
}

