'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  Home,
  BarChart3,
  FolderKanban,
  Target,
  Megaphone,
  Users,
  Wallet,
  ShieldCheck,
  UsersRound,
  Globe,
  Lightbulb,
  Building2,
  FileText,
  Settings,
  Sparkles,
  ChevronRight,
  Plus,
  ListTodo,
} from 'lucide-react';
import { useState } from 'react';
import { OrgSwitcher } from './auth/OrgSwitcher';

// Navigation items grouped by category
const navGroups = [
  {
    title: 'Overview',
    items: [
      { href: '/hub', label: 'Home', icon: Home },
      { href: '/hub/dashboard', label: 'Metrics Dashboard', icon: BarChart3 },
    ],
  },
  {
    title: 'Work',
    items: [
      { href: '/hub/tasks', label: 'Tasks', icon: ListTodo },
      { href: '/hub/projects', label: 'Projects', icon: FolderKanban },
      { href: '/hub/rnd', label: 'Innovation & R&D', icon: Lightbulb },
    ],
  },
  {
    title: 'Business',
    items: [
      { href: '/hub/sales', label: 'Sales & Pipeline', icon: Target },
      { href: '/hub/marketing', label: 'Marketing', icon: Megaphone },
      { href: '/hub/customers', label: 'Customers', icon: Users },
    ],
  },
  {
    title: 'Operations',
    items: [
      { href: '/hub/finance', label: 'Finance', icon: Wallet },
      { href: '/hub/ops', label: 'Ops & Compliance', icon: ShieldCheck },
      { href: '/hub/team', label: 'Team & Culture', icon: UsersRound },
    ],
  },
  {
    title: 'External',
    items: [
      { href: '/hub/investors', label: 'Investor Relations', icon: Building2 },
      { href: '/hub/digital', label: 'Digital & IT', icon: Globe },
    ],
  },
  {
    title: 'Resources',
    items: [
      { href: '/hub/docs', label: 'Docs Hub', icon: FileText },
      { href: '/hub/settings', label: 'Settings', icon: Settings },
    ],
  },
];

// Quick actions for the sidebar
const quickActions = [
  { label: 'New Project', action: 'create project', icon: FolderKanban },
  { label: 'Log Expense', action: 'log expense', icon: Wallet },
  { label: 'Add Lead', action: 'create lead', icon: Target },
];

export function Sidebar() {
  const pathname = usePathname();
  const [collapsedGroups, setCollapsedGroups] = useState<string[]>([]);

  const toggleGroup = (title: string) => {
    setCollapsedGroups(prev =>
      prev.includes(title) ? prev.filter(t => t !== title) : [...prev, title]
    );
  };

  const handleQuickAction = (action: string) => {
    // Dispatch a custom event that the CommandBar can listen to
    const event = new CustomEvent('copilot-command', { detail: action });
    window.dispatchEvent(event);
  };

  return (
    <aside className="w-64 border-r border-neutral-800 bg-neutral-900 flex flex-col">
      {/* Organization Switcher */}
      <div className="border-b border-neutral-800">
        <OrgSwitcher />
      </div>

      {/* Quick Actions */}
      <div className="p-2 border-b border-neutral-800">
        <div className="text-[10px] uppercase tracking-wider text-neutral-500 px-2 py-1">Quick Actions</div>
        <div className="flex flex-wrap gap-1 mt-1">
          {quickActions.map((action) => (
            <button
              key={action.label}
              onClick={() => handleQuickAction(action.action)}
              className="flex items-center gap-1 px-2 py-1 text-xs text-neutral-400 bg-neutral-800 hover:bg-neutral-700 rounded transition-colors"
            >
              <Plus className="w-3 h-3" />
              {action.label}
            </button>
          ))}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-2">
        {navGroups.map((group) => {
          const isCollapsed = collapsedGroups.includes(group.title);
          return (
            <div key={group.title} className="mb-1">
              <button
                onClick={() => toggleGroup(group.title)}
                className="w-full flex items-center justify-between px-4 py-1.5 text-[10px] uppercase tracking-wider text-neutral-500 hover:text-neutral-400 transition-colors"
              >
                {group.title}
                <ChevronRight
                  className={cn(
                    'w-3 h-3 transition-transform',
                    !isCollapsed && 'rotate-90'
                  )}
                />
              </button>
              {!isCollapsed && (
                <div className="px-2 space-y-0.5">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href ||
                      (item.href !== '/hub' && pathname.startsWith(item.href));
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                          'flex items-center gap-2 px-2 py-1.5 rounded text-sm transition-colors',
                          isActive
                            ? 'bg-indigo-600/20 text-indigo-400 border-l-2 border-indigo-500'
                            : 'text-neutral-400 hover:bg-neutral-800 hover:text-neutral-100'
                        )}
                      >
                        <Icon className="w-4 h-4 flex-shrink-0" />
                        <span className="truncate">{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-neutral-800">
        <div className="flex items-center gap-2 px-2 py-2 rounded-lg bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/20">
          <Sparkles className="w-4 h-4 text-indigo-400" />
          <div className="text-xs">
            <div className="text-neutral-200">Copilot Ready</div>
            <div className="text-neutral-500">Press ⌘K anytime</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
