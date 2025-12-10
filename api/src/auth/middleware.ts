import { createMiddleware } from 'hono/factory';
import { verify } from 'hono/jwt';
import type { Env, User, Organization, OrgMember, AuthContext } from '../types';

// Extended context for authenticated routes
export type AuthEnv = {
  Bindings: Env;
  Variables: {
    userId: string;
    orgId: string;
    user: User;
    org: Organization;
    member: OrgMember;
  };
};

// JWT payload structure
interface JWTPayload {
  sub: string; // user_id
  org: string; // org_id
  role: string;
  exp: number;
}

/**
 * Authentication middleware - validates JWT and loads user/org context
 * Use this on all protected routes
 */
export const authMiddleware = createMiddleware<AuthEnv>(async (c, next) => {
  const authHeader = c.req.header('Authorization');

  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized', message: 'Missing or invalid authorization header' }, 401);
  }

  const token = authHeader.slice(7);

  try {
    // Verify JWT
    const payload = await verify(token, c.env.JWT_SECRET) as JWTPayload;

    // Check expiration
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return c.json({ error: 'Unauthorized', message: 'Token expired' }, 401);
    }

    // Load user from database
    const user = await c.env.DB.prepare(
      'SELECT id, email, name, avatar_url, email_verified, created_at, updated_at FROM users WHERE id = ?'
    ).bind(payload.sub).first<User>();

    if (!user) {
      return c.json({ error: 'Unauthorized', message: 'User not found' }, 401);
    }

    // Load organization
    const org = await c.env.DB.prepare(
      'SELECT id, name, slug, domain, logo_url, plan, billing_email, settings, created_at, updated_at FROM organizations WHERE id = ?'
    ).bind(payload.org).first<Organization>();

    if (!org) {
      return c.json({ error: 'Unauthorized', message: 'Organization not found' }, 401);
    }

    // Load membership
    const member = await c.env.DB.prepare(
      'SELECT id, org_id, user_id, role, status, invited_by, invited_at, joined_at, created_at FROM org_members WHERE org_id = ? AND user_id = ? AND status = ?'
    ).bind(payload.org, payload.sub, 'active').first<OrgMember>();

    if (!member) {
      return c.json({ error: 'Forbidden', message: 'Not a member of this organization' }, 403);
    }

    // Set context variables
    c.set('userId', payload.sub);
    c.set('orgId', payload.org);
    c.set('user', user);
    c.set('org', org);
    c.set('member', member);

    await next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return c.json({ error: 'Unauthorized', message: 'Invalid token' }, 401);
  }
});

/**
 * Optional auth middleware - doesn't require auth but loads context if present
 * Use this for routes that work with or without auth
 */
export const optionalAuthMiddleware = createMiddleware<AuthEnv>(async (c, next) => {
  const authHeader = c.req.header('Authorization');

  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    try {
      const payload = await verify(token, c.env.JWT_SECRET) as JWTPayload;

      if (payload.exp && payload.exp >= Math.floor(Date.now() / 1000)) {
        const user = await c.env.DB.prepare(
          'SELECT id, email, name, avatar_url, email_verified, created_at, updated_at FROM users WHERE id = ?'
        ).bind(payload.sub).first<User>();

        if (user) {
          c.set('userId', payload.sub);
          c.set('user', user);

          const org = await c.env.DB.prepare(
            'SELECT * FROM organizations WHERE id = ?'
          ).bind(payload.org).first<Organization>();

          if (org) {
            c.set('orgId', payload.org);
            c.set('org', org);
          }
        }
      }
    } catch {
      // Ignore auth errors for optional auth
    }
  }

  await next();
});

/**
 * Role-based access control middleware
 * Use after authMiddleware to restrict access to specific roles
 */
export const requireRole = (...allowedRoles: OrgMember['role'][]) => {
  return createMiddleware<AuthEnv>(async (c, next) => {
    const member = c.get('member');

    if (!member) {
      return c.json({ error: 'Forbidden', message: 'Authentication required' }, 403);
    }

    if (!allowedRoles.includes(member.role)) {
      return c.json({
        error: 'Forbidden',
        message: `This action requires one of the following roles: ${allowedRoles.join(', ')}`
      }, 403);
    }

    await next();
  });
};

/**
 * Get the current auth context from the request
 */
export function getAuthContext(c: { get: (key: string) => unknown }): AuthContext | null {
  const user = c.get('user') as User | undefined;
  const org = c.get('org') as Organization | undefined;
  const member = c.get('member') as OrgMember | undefined;

  if (!user || !org || !member) {
    return null;
  }

  return { user, org, member };
}
