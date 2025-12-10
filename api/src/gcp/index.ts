// Google Cloud Platform Integration Layer
// Unified interface for GCP services

export * from './bigquery';
export * from './storage';
export * from './vertex-ai';
export * from './pubsub';
export * from './firestore';

// GCP Configuration
export interface GCPConfig {
  projectId: string;
  location: string;
  credentials?: string; // Base64 encoded service account JSON
}

// Initialize GCP services (for Cloud Run, credentials are automatic via metadata server)
export function getGCPConfig(): GCPConfig {
  return {
    projectId: process.env.GOOGLE_CLOUD_PROJECT || 'integratewise-hub',
    location: process.env.VERTEX_AI_LOCATION || 'us-central1',
  };
}
