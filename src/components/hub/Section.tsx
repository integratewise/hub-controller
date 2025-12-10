import Link from 'next/link';
import { ArrowRight, ChevronRight } from 'lucide-react';

interface SectionProps {
  title: string;
  children: React.ReactNode;
  action?: { label: string; href: string } | { label: string; onClick: () => void };
  description?: string;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
}

export function Section({ 
  title, 
  children, 
  action, 
  description,
}: SectionProps) {
  return (
    <section className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-lg font-semibold text-neutral-100">{title}</h2>
          {description && (
            <p className="text-sm text-neutral-500 mt-0.5">{description}</p>
          )}
        </div>
        {action && (
          'href' in action ? (
            <Link 
              href={action.href}
              className="flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-700 transition-colors"
            >
              {action.label}
              <ArrowRight className="w-4 h-4" />
            </Link>
          ) : (
            <button 
              onClick={action.onClick}
              className="flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-700 transition-colors"
            >
              {action.label}
              <ArrowRight className="w-4 h-4" />
            </button>
          )
        )}
      </div>
      {children}
    </section>
  );
}

// Card Section with background
interface CardSectionProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

export function CardSection({ title, children, className = '' }: CardSectionProps) {
  return (
    <div className={`rounded-lg border border-neutral-800 bg-neutral-900 p-4 ${className}`}>
      <h3 className="text-sm font-medium text-neutral-200 mb-3">{title}</h3>
      {children}
    </div>
  );
}

