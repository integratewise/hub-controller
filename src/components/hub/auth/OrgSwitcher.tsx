'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/lib/auth/context';
import { Check, ChevronDown, Plus, Building2, LogOut, Settings, User } from 'lucide-react';
import Link from 'next/link';

export function OrgSwitcher() {
  const { user, organization, organizations, role, switchOrg, logout, isLoading } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (isLoading) {
    return (
      <div className="px-2 py-2">
        <div className="h-10 bg-neutral-800 rounded-lg animate-pulse" />
      </div>
    );
  }

  if (!user || !organization) {
    return (
      <div className="px-2 py-2">
        <Link
          href="/login"
          className="flex items-center justify-center gap-2 px-3 py-2 text-sm bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all"
        >
          Sign in
        </Link>
      </div>
    );
  }

  const handleSwitchOrg = async (orgId: string) => {
    if (orgId === organization.id) {
      setIsOpen(false);
      return;
    }
    try {
      await switchOrg(orgId);
      setIsOpen(false);
    } catch (error) {
      console.error('Failed to switch org:', error);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getPlanBadgeColor = (plan: string) => {
    switch (plan) {
      case 'enterprise': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'pro': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'starter': return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30';
      default: return 'bg-neutral-500/20 text-neutral-400 border-neutral-500/30';
    }
  };

  return (
    <div className="relative px-2 py-2" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-2 px-2 py-2 rounded-lg bg-neutral-800/50 hover:bg-neutral-800 border border-neutral-700/50 transition-colors"
      >
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-medium flex-shrink-0">
          {organization.logo_url ? (
            <img src={organization.logo_url} alt={organization.name} className="w-full h-full rounded-lg object-cover" />
          ) : (
            getInitials(organization.name)
          )}
        </div>
        <div className="flex-1 text-left min-w-0">
          <div className="text-sm font-medium text-neutral-100 truncate">{organization.name}</div>
          <div className="text-[10px] text-neutral-500 capitalize">{role} · {organization.plan}</div>
        </div>
        <ChevronDown className={`w-4 h-4 text-neutral-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute left-2 right-2 top-full mt-1 bg-neutral-900 border border-neutral-700/50 rounded-lg shadow-xl z-50 overflow-hidden">
          {/* Current user */}
          <div className="px-3 py-2 border-b border-neutral-800">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white text-xs font-medium">
                {user.avatar_url ? (
                  <img src={user.avatar_url} alt={user.name || user.email} className="w-full h-full rounded-full object-cover" />
                ) : (
                  getInitials(user.name || user.email)
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm text-neutral-100 truncate">{user.name || 'User'}</div>
                <div className="text-xs text-neutral-500 truncate">{user.email}</div>
              </div>
            </div>
          </div>

          {/* Organizations list */}
          <div className="py-1 max-h-48 overflow-y-auto">
            <div className="px-3 py-1 text-[10px] uppercase tracking-wider text-neutral-500">Organizations</div>
            {organizations.map((org) => (
              <button
                key={org.id}
                onClick={() => handleSwitchOrg(org.id)}
                className="w-full flex items-center gap-2 px-3 py-2 hover:bg-neutral-800 transition-colors"
              >
                <div className="w-6 h-6 rounded bg-gradient-to-br from-blue-500/50 to-purple-600/50 flex items-center justify-center text-white text-[10px] font-medium">
                  {getInitials(org.name)}
                </div>
                <div className="flex-1 text-left min-w-0">
                  <div className="text-sm text-neutral-200 truncate">{org.name}</div>
                </div>
                <span className={`text-[10px] px-1.5 py-0.5 rounded border ${getPlanBadgeColor(org.plan)}`}>
                  {org.plan}
                </span>
                {org.id === organization.id && (
                  <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                )}
              </button>
            ))}
          </div>

          {/* Actions */}
          <div className="border-t border-neutral-800 py-1">
            <Link
              href="/hub/settings/organization"
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800 transition-colors"
              onClick={() => setIsOpen(false)}
            >
              <Building2 className="w-4 h-4" />
              Organization settings
            </Link>
            <Link
              href="/hub/settings/profile"
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800 transition-colors"
              onClick={() => setIsOpen(false)}
            >
              <User className="w-4 h-4" />
              Profile settings
            </Link>
            <button
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800 transition-colors"
              onClick={() => setIsOpen(false)}
            >
              <Plus className="w-4 h-4" />
              Create organization
            </button>
          </div>

          {/* Logout */}
          <div className="border-t border-neutral-800 py-1">
            <button
              onClick={() => {
                logout();
                window.location.href = '/login';
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-neutral-800 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
