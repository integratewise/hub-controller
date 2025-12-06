'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  MessageSquare,
  LayoutDashboard,
  FolderKanban,
  TrendingUp,
  Megaphone,
  Users,
  DollarSign,
  Shield,
  UsersRound,
  Globe,
  Lightbulb,
  Building2,
  FileText,
  Settings,
  Sparkles,
} from 'lucide-react';

const nav = [
  { href: '/hub', label: 'AI Chat', icon: MessageSquare },
  { href: '/hub/dashboard', label: 'Metrics', icon: LayoutDashboard },
  { href: '/hub/projects', label: 'Projects', icon: FolderKanban },
  { href: '/hub/sales', label: 'Sales', icon: TrendingUp },
  { href: '/hub/marketing', label: 'Marketing', icon: Megaphone },
  { href: '/hub/customers', label: 'Customers', icon: Users },
  { href: '/hub/finance', label: 'Finance', icon: DollarSign },
  { href: '/hub/ops', label: 'Compliance', icon: Shield },
  { href: '/hub/team', label: 'Team', icon: UsersRound },
  { href: '/hub/digital', label: 'Digital & IT', icon: Globe },
  { href: '/hub/rnd', label: 'R&D', icon: Lightbulb },
  { href: '/hub/investors', label: 'Investors', icon: Building2 },
  { href: '/hub/docs', label: 'Docs', icon: FileText },
  { href: '/hub/settings', label: 'Settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 border-r border-neutral-800 bg-neutral-900 flex flex-col">
      {/* Logo */}
      <div className="p-4 border-b border-neutral-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="text-sm font-semibold text-neutral-100">IntegrateWise</div>
            <div className="text-xs text-neutral-500">GPT Controller</div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {nav.map((n) => {
          const Icon = n.icon;
          const isActive = pathname === n.href;
          return (
            <Link
              key={n.href}
              href={n.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all',
                isActive
                  ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30'
                  : 'text-neutral-400 hover:bg-neutral-800 hover:text-neutral-100'
              )}
            >
              <Icon className={cn('w-4 h-4', isActive && 'text-indigo-400')} />
              {n.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-neutral-800">
        <div className="text-xs text-neutral-500 text-center">
          Powered by Claude AI
        </div>
      </div>
    </aside>
  );
}
