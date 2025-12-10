// Firestore Integration for Fast Config & Real-Time Data
// Used for Copilot command cache, API tokens, real-time updates

export interface FirestoreConfig {
  projectId: string;
}

export interface DocumentData {
  [key: string]: unknown;
}

export interface QueryOptions {
  where?: { field: string; op: '==' | '!=' | '<' | '<=' | '>' | '>=' | 'in' | 'array-contains'; value: unknown }[];
  orderBy?: { field: string; direction: 'asc' | 'desc' }[];
  limit?: number;
  offset?: number;
}

// Firestore client wrapper
export class FirestoreClient {
  private projectId: string;
  private apiEndpoint: string;

  constructor(config: FirestoreConfig) {
    this.projectId = config.projectId;
    this.apiEndpoint = `https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/(default)/documents`;
  }

  // Get a document
  async get(collection: string, docId: string): Promise<DocumentData | null> {
    console.log(`Getting ${collection}/${docId}`);
    return null;
  }

  // Set a document (overwrite)
  async set(collection: string, docId: string, data: DocumentData): Promise<void> {
    console.log(`Setting ${collection}/${docId}:`, data);
  }

  // Update a document (partial update)
  async update(collection: string, docId: string, data: Partial<DocumentData>): Promise<void> {
    console.log(`Updating ${collection}/${docId}:`, data);
  }

  // Delete a document
  async delete(collection: string, docId: string): Promise<void> {
    console.log(`Deleting ${collection}/${docId}`);
  }

  // Query documents
  async query(collection: string, options: QueryOptions = {}): Promise<DocumentData[]> {
    console.log(`Querying ${collection}:`, options);
    return [];
  }

  // Add a document (auto-generate ID)
  async add(collection: string, data: DocumentData): Promise<string> {
    const docId = crypto.randomUUID();
    await this.set(collection, docId, data);
    return docId;
  }

  // ============================================
  // Hub-specific collections and methods
  // ============================================

  // Copilot command cache
  async getCachedCommand(commandHash: string): Promise<{
    result: unknown;
    cachedAt: string;
  } | null> {
    const doc = await this.get('copilot_cache', commandHash);
    if (!doc) return null;
    
    // Check TTL
    const cachedAt = new Date(doc.cachedAt as string);
    const ttl = (doc.ttl as number) || 3600000; // Default 1 hour
    if (Date.now() - cachedAt.getTime() > ttl) {
      await this.delete('copilot_cache', commandHash);
      return null;
    }
    
    return {
      result: doc.result,
      cachedAt: doc.cachedAt as string,
    };
  }

  async setCachedCommand(
    commandHash: string,
    result: unknown,
    ttlMs: number = 3600000
  ): Promise<void> {
    await this.set('copilot_cache', commandHash, {
      result,
      cachedAt: new Date().toISOString(),
      ttl: ttlMs,
    });
  }

  // Integration tokens
  async getIntegrationToken(integrationId: string): Promise<{
    accessToken: string;
    refreshToken?: string;
    expiresAt?: string;
    scopes?: string[];
  } | null> {
    const doc = await this.get('integration_tokens', integrationId);
    if (!doc) return null;
    
    return {
      accessToken: doc.accessToken as string,
      refreshToken: doc.refreshToken as string | undefined,
      expiresAt: doc.expiresAt as string | undefined,
      scopes: doc.scopes as string[] | undefined,
    };
  }

  async setIntegrationToken(
    integrationId: string,
    token: {
      accessToken: string;
      refreshToken?: string;
      expiresAt?: string;
      scopes?: string[];
    }
  ): Promise<void> {
    await this.set('integration_tokens', integrationId, {
      ...token,
      updatedAt: new Date().toISOString(),
    });
  }

  // User preferences
  async getUserPreferences(userId: string): Promise<{
    theme: 'light' | 'dark' | 'system';
    defaultDashboard: string;
    notifications: Record<string, boolean>;
    copilotSettings: Record<string, unknown>;
  } | null> {
    const doc = await this.get('user_preferences', userId);
    if (!doc) return null;
    
    return {
      theme: (doc.theme as 'light' | 'dark' | 'system') || 'system',
      defaultDashboard: (doc.defaultDashboard as string) || 'home',
      notifications: (doc.notifications as Record<string, boolean>) || {},
      copilotSettings: (doc.copilotSettings as Record<string, unknown>) || {},
    };
  }

  async setUserPreferences(
    userId: string,
    preferences: Partial<{
      theme: 'light' | 'dark' | 'system';
      defaultDashboard: string;
      notifications: Record<string, boolean>;
      copilotSettings: Record<string, unknown>;
    }>
  ): Promise<void> {
    await this.update('user_preferences', userId, {
      ...preferences,
      updatedAt: new Date().toISOString(),
    });
  }

  // Real-time dashboard subscriptions (for push notifications)
  async subscribeToDashboard(userId: string, dashboardId: string): Promise<void> {
    await this.set('dashboard_subscriptions', `${userId}_${dashboardId}`, {
      userId,
      dashboardId,
      subscribedAt: new Date().toISOString(),
    });
  }

  async unsubscribeFromDashboard(userId: string, dashboardId: string): Promise<void> {
    await this.delete('dashboard_subscriptions', `${userId}_${dashboardId}`);
  }

  // Copilot session state
  async getCopilotSession(sessionId: string): Promise<{
    messages: { role: 'user' | 'assistant'; content: string; timestamp: string }[];
    context: Record<string, unknown>;
  } | null> {
    const doc = await this.get('copilot_sessions', sessionId);
    if (!doc) return null;
    
    return {
      messages: (doc.messages as { role: 'user' | 'assistant'; content: string; timestamp: string }[]) || [],
      context: (doc.context as Record<string, unknown>) || {},
    };
  }

  async updateCopilotSession(
    sessionId: string,
    message: { role: 'user' | 'assistant'; content: string },
    context?: Record<string, unknown>
  ): Promise<void> {
    const session = await this.getCopilotSession(sessionId);
    const messages = session?.messages || [];
    
    messages.push({
      ...message,
      timestamp: new Date().toISOString(),
    });

    await this.set('copilot_sessions', sessionId, {
      messages,
      context: { ...session?.context, ...context },
      updatedAt: new Date().toISOString(),
    });
  }

  // Feature flags
  async getFeatureFlags(): Promise<Record<string, boolean>> {
    const doc = await this.get('config', 'feature_flags');
    return (doc as Record<string, boolean>) || {};
  }

  async setFeatureFlag(flag: string, enabled: boolean): Promise<void> {
    await this.update('config', 'feature_flags', {
      [flag]: enabled,
      updatedAt: new Date().toISOString(),
    });
  }
}

// Factory function
export function createFirestoreClient(projectId: string): FirestoreClient {
  return new FirestoreClient({ projectId });
}
