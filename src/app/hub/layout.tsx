import { Sidebar } from '@/components/hub/Sidebar';

export const metadata = {
  title: 'IntegrateWise Hub | GPT Controller',
  description: 'AI-powered business operations hub',
};

export default function HubLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-screen w-screen bg-neutral-950 text-neutral-100 flex dark hub-dark">
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-hidden">
        {children}
      </main>
    </div>
  );
}

