import { Hono } from 'hono';
import { sign } from 'hono/jwt';
import type { Env, User, Organization, SignupInput, LoginInput, AuthResponse } from '../types';
import { authMiddleware, type AuthEnv } from './middleware';

const auth = new Hono<{ Bindings: Env }>();

// Password hashing using Web Crypto API (Cloudflare Workers compatible)
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const salt = crypto.getRandomValues(new Uint8Array(16));

  const key = await crypto.subtle.importKey(
    'raw',
    data,
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    key,
    256
  );

  const hashArray = new Uint8Array(derivedBits);
  const saltHex = Array.from(salt).map(b => b.toString(16).padStart(2, '0')).join('');
  const hashHex = Array.from(hashArray).map(b => b.toString(16).padStart(2, '0')).join('');

  return `${saltHex}:${hashHex}`;
}

async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  const [saltHex, hashHex] = storedHash.split(':');
  if (!saltHex || !hashHex) return false;

  const salt = new Uint8Array(saltHex.match(/.{2}/g)!.map(byte => parseInt(byte, 16)));
  const encoder = new TextEncoder();
  const data = encoder.encode(password);

  const key = await crypto.subtle.importKey(
    'raw',
    data,
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    key,
    256
  );

  const hashArray = new Uint8Array(derivedBits);
  const computedHashHex = Array.from(hashArray).map(b => b.toString(16).padStart(2, '0')).join('');

  return computedHashHex === hashHex;
}

// Generate a URL-safe slug from a name
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 50) + '-' + crypto.randomUUID().slice(0, 8);
}

// Generate JWT token
async function generateToken(
  userId: string,
  orgId: string,
  role: string,
  secret: string,
  expiresInDays: number = 7
): Promise<string> {
  const payload = {
    sub: userId,
    org: orgId,
    role: role,
    exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24 * expiresInDays),
  };

  return await sign(payload, secret);
}

// ============================================
// SIGNUP
// ============================================
auth.post('/signup', async (c) => {
  const { email, password, name, org_name } = await c.req.json<SignupInput>();

  // Validation
  if (!email || !password) {
    return c.json({ error: 'Email and password are required' }, 400);
  }

  if (password.length < 8) {
    return c.json({ error: 'Password must be at least 8 characters' }, 400);
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return c.json({ error: 'Invalid email format' }, 400);
  }

  // Check if user already exists
  const existingUser = await c.env.DB.prepare(
    'SELECT id FROM users WHERE email = ?'
  ).bind(email.toLowerCase()).first();

  if (existingUser) {
    return c.json({ error: 'User with this email already exists' }, 409);
  }

  const now = new Date().toISOString();
  const userId = crypto.randomUUID();
  const orgId = crypto.randomUUID();
  const memberId = crypto.randomUUID();

  // Hash password
  const passwordHash = await hashPassword(password);

  // Create user
  await c.env.DB.prepare(`
    INSERT INTO users (id, email, name, password_hash, email_verified, created_at, updated_at)
    VALUES (?, ?, ?, ?, 0, ?, ?)
  `).bind(userId, email.toLowerCase(), name || null, passwordHash, now, now).run();

  // Create organization
  const orgName = org_name || `${name || email.split('@')[0]}'s Workspace`;
  const orgSlug = generateSlug(orgName);

  await c.env.DB.prepare(`
    INSERT INTO organizations (id, name, slug, plan, created_at, updated_at)
    VALUES (?, ?, ?, 'free', ?, ?)
  `).bind(orgId, orgName, orgSlug, now, now).run();

  // Create membership (as owner)
  await c.env.DB.prepare(`
    INSERT INTO org_members (id, org_id, user_id, role, status, joined_at, created_at)
    VALUES (?, ?, ?, 'owner', 'active', ?, ?)
  `).bind(memberId, orgId, userId, now, now).run();

  // Generate token
  const token = await generateToken(userId, orgId, 'owner', c.env.JWT_SECRET);

  const response: AuthResponse = {
    token,
    user: {
      id: userId,
      email: email.toLowerCase(),
      name: name || undefined,
      email_verified: false,
      created_at: now,
      updated_at: now,
    },
    organizations: [{
      id: orgId,
      name: orgName,
      slug: orgSlug,
      plan: 'free',
      created_at: now,
      updated_at: now,
    }],
  };

  return c.json(response, 201);
});

// ============================================
// LOGIN
// ============================================
auth.post('/login', async (c) => {
  const { email, password } = await c.req.json<LoginInput>();

  if (!email || !password) {
    return c.json({ error: 'Email and password are required' }, 400);
  }

  // Find user
  const user = await c.env.DB.prepare(
    'SELECT * FROM users WHERE email = ?'
  ).bind(email.toLowerCase()).first<User & { password_hash: string }>();

  if (!user) {
    return c.json({ error: 'Invalid email or password' }, 401);
  }

  // Verify password
  const isValid = await verifyPassword(password, user.password_hash);
  if (!isValid) {
    return c.json({ error: 'Invalid email or password' }, 401);
  }

  // Get user's organizations
  const memberships = await c.env.DB.prepare(`
    SELECT o.*, m.role FROM organizations o
    JOIN org_members m ON m.org_id = o.id
    WHERE m.user_id = ? AND m.status = 'active'
    ORDER BY m.created_at ASC
  `).bind(user.id).all<Organization & { role: string }>();

  const organizations = memberships.results || [];

  if (organizations.length === 0) {
    return c.json({ error: 'No active organization memberships found' }, 403);
  }

  // Use first org as default
  const defaultOrg = organizations[0];
  const token = await generateToken(user.id, defaultOrg.id, defaultOrg.role, c.env.JWT_SECRET);

  const response: AuthResponse = {
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      avatar_url: user.avatar_url,
      email_verified: user.email_verified,
      created_at: user.created_at,
      updated_at: user.updated_at,
    },
    organizations,
  };

  return c.json(response);
});

// ============================================
// GET CURRENT USER (Protected)
// ============================================
const protectedAuth = new Hono<AuthEnv>();
protectedAuth.use('*', authMiddleware);

protectedAuth.get('/me', async (c) => {
  const user = c.get('user');
  const org = c.get('org');
  const member = c.get('member');

  // Get all user's organizations
  const memberships = await c.env.DB.prepare(`
    SELECT o.*, m.role FROM organizations o
    JOIN org_members m ON m.org_id = o.id
    WHERE m.user_id = ? AND m.status = 'active'
  `).bind(user.id).all<Organization & { role: string }>();

  return c.json({
    user,
    current_org: org,
    role: member.role,
    organizations: memberships.results || [],
  });
});

// ============================================
// SWITCH ORGANIZATION (Protected)
// ============================================
protectedAuth.post('/switch-org', async (c) => {
  const { org_id } = await c.req.json<{ org_id: string }>();
  const user = c.get('user');

  if (!org_id) {
    return c.json({ error: 'org_id is required' }, 400);
  }

  // Verify membership
  const membership = await c.env.DB.prepare(`
    SELECT m.role, o.* FROM org_members m
    JOIN organizations o ON o.id = m.org_id
    WHERE m.user_id = ? AND m.org_id = ? AND m.status = 'active'
  `).bind(user.id, org_id).first<Organization & { role: string }>();

  if (!membership) {
    return c.json({ error: 'Not a member of this organization' }, 403);
  }

  // Generate new token for the selected org
  const token = await generateToken(user.id, org_id, membership.role, c.env.JWT_SECRET);

  return c.json({
    token,
    organization: membership,
  });
});

// ============================================
// UPDATE PROFILE (Protected)
// ============================================
protectedAuth.put('/profile', async (c) => {
  const user = c.get('user');
  const { name, avatar_url } = await c.req.json<{ name?: string; avatar_url?: string }>();

  const now = new Date().toISOString();

  await c.env.DB.prepare(`
    UPDATE users SET name = COALESCE(?, name), avatar_url = COALESCE(?, avatar_url), updated_at = ?
    WHERE id = ?
  `).bind(name || null, avatar_url || null, now, user.id).run();

  const updatedUser = await c.env.DB.prepare(
    'SELECT id, email, name, avatar_url, email_verified, created_at, updated_at FROM users WHERE id = ?'
  ).bind(user.id).first<User>();

  return c.json({ user: updatedUser });
});

// ============================================
// CHANGE PASSWORD (Protected)
// ============================================
protectedAuth.post('/change-password', async (c) => {
  const user = c.get('user');
  const { current_password, new_password } = await c.req.json<{
    current_password: string;
    new_password: string;
  }>();

  if (!current_password || !new_password) {
    return c.json({ error: 'Current password and new password are required' }, 400);
  }

  if (new_password.length < 8) {
    return c.json({ error: 'New password must be at least 8 characters' }, 400);
  }

  // Get current password hash
  const userData = await c.env.DB.prepare(
    'SELECT password_hash FROM users WHERE id = ?'
  ).bind(user.id).first<{ password_hash: string }>();

  if (!userData) {
    return c.json({ error: 'User not found' }, 404);
  }

  // Verify current password
  const isValid = await verifyPassword(current_password, userData.password_hash);
  if (!isValid) {
    return c.json({ error: 'Current password is incorrect' }, 401);
  }

  // Update password
  const newPasswordHash = await hashPassword(new_password);
  const now = new Date().toISOString();

  await c.env.DB.prepare(
    'UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?'
  ).bind(newPasswordHash, now, user.id).run();

  return c.json({ success: true, message: 'Password updated successfully' });
});

// ============================================
// LOGOUT (Protected) - Invalidate token
// ============================================
protectedAuth.post('/logout', async (c) => {
  // In a stateless JWT setup, logout is handled client-side
  // If using sessions/refresh tokens, we would invalidate here
  return c.json({ success: true, message: 'Logged out successfully' });
});

// Mount protected routes
auth.route('/', protectedAuth);

export { auth as authRoutes };
export { authMiddleware, requireRole, optionalAuthMiddleware, type AuthEnv } from './middleware';
