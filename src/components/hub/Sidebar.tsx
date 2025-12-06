'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const nav = [
  { href: '/hub', label: 'Home' },
  { href: '/hub/dashboard', label: 'Metrics' },
  { href: '/hub/projects', label: 'Projects' },
  { href: '/hub/sales', label: 'Sales' },
  { href: '/hub/marketing', label: 'Marketing' },
  { href: '/hub/customers', label: 'Customers' },
  { href: '/hub/finance', label: 'Finance' },
  { href: '/hub/ops', label: 'Ops & Compliance' },
  { href: '/hub/team', label: 'Team & Culture' },
  { href: '/hub/digital', label: 'Digital Presence & IT' },
  { href: '/hub/rnd', label: 'Innovation & R&D' },
  { href: '/hub/investors', label: 'Investor Relations' },
  { href: '/hub/docs', label: 'Docs Hub' },
  { href: '/hub/settings', label: 'Settings' },
];

export function Sidebar() {
  const pathname = usePathname();
  
  return (
    <aside className="w-64 border-r border-neutral-800 bg-neutral-900">
      <div className="p-4 text-xl font-semibold text-neutral-100">IntegrateWise</div>
      <nav className="px-2 py-2 space-y-1">
        {nav.map((n) => (
          <Link
            key={n.href}
            href={n.href}
            className={cn(
              'block px-3 py-2 rounded text-sm transition-colors',
              pathname === n.href
                ? 'bg-neutral-800 text-neutral-100'
                : 'text-neutral-400 hover:bg-neutral-800 hover:text-neutral-100'
            )}
          >
            {n.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}

