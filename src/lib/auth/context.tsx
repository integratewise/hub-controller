'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { API_BASE } from '@/lib/hub/api';
import type { User, Organization, OrgMember, AuthState, AuthResponse } from '@/lib/hub/types';

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name?: string, orgName?: string) => Promise<void>;
  logout: () => void;
  switchOrg: (orgId: string) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

const TOKEN_KEY = 'hub_token';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    organization: null,
    organizations: [],
    role: null,
    isAuthenticated: false,
    isLoading: true,
  });

  const getToken = () => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(TOKEN_KEY);
  };

  const setToken = (token: string) => {
    localStorage.setItem(TOKEN_KEY, token);
  };

  const clearToken = () => {
    localStorage.removeItem(TOKEN_KEY);
  };

  const authFetch = async (path: string, init?: RequestInit) => {
    const token = getToken();
    const res = await fetch(`${API_BASE}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(init?.headers || {}),
      },
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(error.error || error.message || 'Request failed');
    }

    return res.json();
  };

  const refreshUser = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setState(prev => ({ ...prev, isLoading: false }));
      return;
    }

    try {
      const data = await authFetch('/auth/me');
      setState({
        user: data.user,
        organization: data.current_org,
        organizations: data.organizations || [],
        role: data.role,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch {
      clearToken();
      setState({
        user: null,
        organization: null,
        organizations: [],
        role: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = async (email: string, password: string) => {
    const data: AuthResponse = await authFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    setToken(data.token);

    setState({
      user: data.user,
      organization: data.organizations[0] || null,
      organizations: data.organizations,
      role: 'owner', // Will be set properly from /me
      isAuthenticated: true,
      isLoading: false,
    });

    // Refresh to get complete context
    await refreshUser();
  };

  const signup = async (email: string, password: string, name?: string, orgName?: string) => {
    const data: AuthResponse = await authFetch('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password, name, org_name: orgName }),
    });

    setToken(data.token);

    setState({
      user: data.user,
      organization: data.organizations[0] || null,
      organizations: data.organizations,
      role: 'owner',
      isAuthenticated: true,
      isLoading: false,
    });
  };

  const logout = () => {
    clearToken();
    setState({
      user: null,
      organization: null,
      organizations: [],
      role: null,
      isAuthenticated: false,
      isLoading: false,
    });
  };

  const switchOrg = async (orgId: string) => {
    const data = await authFetch('/auth/switch-org', {
      method: 'POST',
      body: JSON.stringify({ org_id: orgId }),
    });

    setToken(data.token);
    await refreshUser();
  };

  return (
    <AuthContext.Provider value={{ ...state, login, signup, logout, switchOrg, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function useRequireAuth() {
  const auth = useAuth();

  useEffect(() => {
    if (!auth.isLoading && !auth.isAuthenticated) {
      window.location.href = '/login';
    }
  }, [auth.isLoading, auth.isAuthenticated]);

  return auth;
}
