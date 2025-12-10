// Google Cloud Storage Integration
// Store pitch decks, compliance docs, exports, and other files

import { GCSDocument } from '../types';

export interface GCSConfig {
  projectId: string;
  bucket: string;
}

export interface UploadOptions {
  contentType?: string;
  metadata?: Record<string, string>;
  public?: boolean;
}

export interface SignedUrlOptions {
  action: 'read' | 'write';
  expires: number; // milliseconds from now
  contentType?: string;
}

// Google Cloud Storage client wrapper
export class GCSClient {
  private projectId: string;
  private bucket: string;
  private apiEndpoint: string;

  constructor(config: GCSConfig) {
    this.projectId = config.projectId;
    this.bucket = config.bucket;
    this.apiEndpoint = 'https://storage.googleapis.com';
  }

  // Upload a file to GCS
  async upload(
    path: string,
    content: ArrayBuffer | string,
    options: UploadOptions = {}
  ): Promise<GCSDocument> {
    const now = new Date().toISOString();
    
    console.log(`Uploading to gs://${this.bucket}/${path}`);
    
    // In production, use the GCS JSON API or XML API
    return {
      name: path,
      bucket: this.bucket,
      content_type: options.contentType || 'application/octet-stream',
      size: typeof content === 'string' ? content.length : content.byteLength,
      created: now,
      updated: now,
      metadata: options.metadata,
    };
  }

  // Download a file from GCS
  async download(path: string): Promise<ArrayBuffer> {
    console.log(`Downloading gs://${this.bucket}/${path}`);
    
    // In production, fetch from GCS
    return new ArrayBuffer(0);
  }

  // Delete a file from GCS
  async delete(path: string): Promise<void> {
    console.log(`Deleting gs://${this.bucket}/${path}`);
  }

  // List files in a path
  async list(prefix: string, maxResults: number = 100): Promise<GCSDocument[]> {
    console.log(`Listing gs://${this.bucket}/${prefix}`);
    
    return [];
  }

  // Get file metadata
  async getMetadata(path: string): Promise<GCSDocument | null> {
    console.log(`Getting metadata for gs://${this.bucket}/${path}`);
    
    return null;
  }

  // Generate a signed URL for direct upload/download
  async getSignedUrl(path: string, options: SignedUrlOptions): Promise<string> {
    const expiration = Date.now() + options.expires;
    
    // In production, generate actual signed URL using service account
    return `https://storage.googleapis.com/${this.bucket}/${path}?X-Goog-Expires=${options.expires}`;
  }

  // Copy a file within GCS
  async copy(sourcePath: string, destPath: string): Promise<GCSDocument> {
    console.log(`Copying gs://${this.bucket}/${sourcePath} to gs://${this.bucket}/${destPath}`);
    
    const now = new Date().toISOString();
    return {
      name: destPath,
      bucket: this.bucket,
      content_type: 'application/octet-stream',
      size: 0,
      created: now,
      updated: now,
    };
  }

  // Move a file (copy + delete)
  async move(sourcePath: string, destPath: string): Promise<GCSDocument> {
    const result = await this.copy(sourcePath, destPath);
    await this.delete(sourcePath);
    return result;
  }

  // Upload investor document
  async uploadInvestorDoc(
    docId: string,
    fileName: string,
    content: ArrayBuffer,
    contentType: string
  ): Promise<{ gcsPath: string; publicUrl: string }> {
    const path = `investor-docs/${docId}/${fileName}`;
    
    await this.upload(path, content, {
      contentType,
      metadata: {
        docId,
        uploadedAt: new Date().toISOString(),
      },
    });

    return {
      gcsPath: `gs://${this.bucket}/${path}`,
      publicUrl: `https://storage.googleapis.com/${this.bucket}/${path}`,
    };
  }

  // Upload compliance document
  async uploadComplianceDoc(
    framework: string,
    controlId: string,
    fileName: string,
    content: ArrayBuffer,
    contentType: string
  ): Promise<{ gcsPath: string; signedUrl: string }> {
    const path = `compliance/${framework}/${controlId}/${fileName}`;
    
    await this.upload(path, content, {
      contentType,
      metadata: {
        framework,
        controlId,
        uploadedAt: new Date().toISOString(),
      },
    });

    const signedUrl = await this.getSignedUrl(path, {
      action: 'read',
      expires: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return {
      gcsPath: `gs://${this.bucket}/${path}`,
      signedUrl,
    };
  }

  // Export data to GCS
  async exportData(
    exportType: string,
    data: unknown,
    format: 'json' | 'csv' = 'json'
  ): Promise<{ gcsPath: string; signedUrl: string }> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const path = `exports/${exportType}/${timestamp}.${format}`;
    
    let content: string;
    let contentType: string;
    
    if (format === 'json') {
      content = JSON.stringify(data, null, 2);
      contentType = 'application/json';
    } else {
      // Convert to CSV
      content = this.toCSV(data as Record<string, unknown>[]);
      contentType = 'text/csv';
    }

    await this.upload(path, content, { contentType });

    const signedUrl = await this.getSignedUrl(path, {
      action: 'read',
      expires: 24 * 60 * 60 * 1000, // 24 hours
    });

    return {
      gcsPath: `gs://${this.bucket}/${path}`,
      signedUrl,
    };
  }

  // Helper to convert array of objects to CSV
  private toCSV(data: Record<string, unknown>[]): string {
    if (data.length === 0) return '';
    
    const headers = Object.keys(data[0]);
    const rows = data.map((row) =>
      headers.map((h) => {
        const val = row[h];
        if (val === null || val === undefined) return '';
        if (typeof val === 'string' && val.includes(',')) return `"${val}"`;
        return String(val);
      }).join(',')
    );
    
    return [headers.join(','), ...rows].join('\n');
  }
}

// Factory function
export function createGCSClient(projectId: string, bucket: string): GCSClient {
  return new GCSClient({ projectId, bucket });
}
