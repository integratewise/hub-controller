# IntegrateWise Spine API Contract

## Overview

The Spine is the unified API controller for IntegrateWise Hub, providing standardized endpoints for authentication, resource management, and webhooks. This document defines the complete API contract with request/response schemas and status codes.

**Base URL:** `https://hub-controller.vercel.app/api`  
**Version:** 1.0.0  
**Last Updated:** 2025-12-06

---

## Authentication

### Session Management

#### POST /auth/session

Create a new authenticated session.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "secure_password"
}
```

**Response (200):**
```json
{
  "session_id": "sess_abc123",
  "user_id": "usr_xyz789",
  "email": "user@example.com",
  "expires_at": "2025-12-07T10:00:00Z",
  "token": "jwt_token_here"
}
```

**Error Responses:**
- `401 Unauthorized` - Invalid credentials
- `400 Bad Request` - Missing required fields

---

## Notebooks API

### GET /notebooks

List all notebooks with statistics.

**Query Parameters:**
- `category` (optional): Filter by category
- `limit` (optional): Number of results (default: 20)
- `offset` (optional): Pagination offset

**Response (200):**
```json
{
  "notebooks": [
    {
      "id": "nb_001",
      "name": "Finance",
      "description": "Financial tracking and metrics",
      "icon": "DollarSign",
      "category": "Operations",
      "progress": 45,
      "status": "in_progress",
      "docs_count": 12,
      "created_at": "2025-11-01T00:00:00Z",
      "updated_at": "2025-12-06T10:00:00Z"
    }
  ],
  "stats": {
    "totalNotebooks": 15,
    "totalDocs": 145,
    "avgProgress": 32
  },
  "pagination": {
    "limit": 20,
    "offset": 0,
    "total": 15
  }
}
```

### POST /notebooks

Create a new notebook.

**Request:**
```json
{
  "name": "Security",
  "description": "Security and compliance tracking",
  "icon": "Shield",
  "category": "Compliance"
}
```

**Response (201):**
```json
{
  "id": "nb_002",
  "name": "Security",
  "description": "Security and compliance tracking",
  "icon": "Shield",
  "category": "Compliance",
  "progress": 0,
  "status": "not_started",
  "docs_count": 0,
  "created_at": "2025-12-06T10:00:00Z",
  "updated_at": "2025-12-06T10:00:00Z"
}
```

### GET /notebooks/{id}

Get notebook details with documents.

**Response (200):**
```json
{
  "id": "nb_001",
  "name": "Finance",
  "description": "Financial tracking",
  "progress": 45,
  "documents": [
    {
      "id": "doc_001",
      "title": "Q4 Budget",
      "content": "...",
      "order_index": 1,
      "created_at": "2025-12-01T00:00:00Z"
    }
  ]
}
```

---

## Documents API

### POST /documents

Create a document in a notebook.

**Request:**
```json
{
  "notebook_id": "nb_001",
  "title": "Monthly Metrics",
  "content": "# Report\n...",
  "order_index": 2,
  "metadata": {
    "source_of_truth": "box://folder/file.md",
    "box_file_id": "12345",
    "last_synced_at": "2025-12-06T10:00:00Z"
  }
}
```

**Response (201):**
```json
{
  "id": "doc_002",
  "notebook_id": "nb_001",
  "title": "Monthly Metrics",
  "content": "# Report\n...",
  "order_index": 2,
  "metadata": {
    "source_of_truth": "box://folder/file.md",
    "box_file_id": "12345",
    "last_synced_at": "2025-12-06T10:00:00Z"
  },
  "created_at": "2025-12-06T10:00:00Z",
  "updated_at": "2025-12-06T10:00:00Z"
}
```

### GET /documents/{id}

Get document details.

**Response (200):**
```json
{
  "id": "doc_001",
  "notebook_id": "nb_001",
  "title": "Q4 Budget",
  "content": "...",
  "created_at": "2025-12-01T00:00:00Z"
}
```

### PATCH /documents/{id}

Update a document.

**Request:**
```json
{
  "title": "Updated Title",
  "content": "Updated content",
  "metadata": {
    "last_synced_at": "2025-12-06T11:00:00Z"
  }
}
```

**Response (200):** Updated document object

---

## Secrets API

### GET /secrets

List all secrets metadata (without values).

**Query Parameters:**
- `scope` (optional): Filter by scope (env, service, user)
- `owner` (optional): Filter by owner

**Response (200):**
```json
{
  "secrets": [
    {
      "id": "sec_001",
      "name": "NEON_DATABASE_URL",
      "scope": "env",
      "owner": "platform",
      "ttl_days": 90,
      "rotation_url": "https://bitwarden.example.com/rotate/neon",
      "last_rotated_at": "2025-10-07T00:00:00Z",
      "next_rotation_at": "2026-01-05T00:00:00Z",
      "status": "active"
    }
  ]
}
```

### POST /secrets

Create a new secret (Bitwarden master only).

**Request:**
```json
{
  "name": "API_KEY_STRIPE",
  "scope": "service",
  "owner": "payments",
  "ttl_days": 180,
  "rotation_url": "https://stripe.com/rotate"
}
```

**Response (201):** Created secret metadata

---

## Webhooks API

### POST /webhooks/subscribe

Subscribe to event stream.

**Request:**
```json
{
  "event_type": "document.created",
  "target_url": "https://example.com/webhooks/documents",
  "secret": "webhook_secret_key"
}
```

**Response (201):**
```json
{
  "webhook_id": "wh_001",
  "event_type": "document.created",
  "target_url": "https://example.com/webhooks/documents",
  "status": "active",
  "created_at": "2025-12-06T10:00:00Z"
}
```

### POST /webhooks/events

Receive webhook event (called by workers/pub-sub).

**Request:**
```json
{
  "event_id": "evt_001",
  "event_type": "document.created",
  "timestamp": "2025-12-06T10:00:00Z",
  "payload": {
    "document_id": "doc_001",
    "notebook_id": "nb_001",
    "title": "New Document"
  }
}
```

**Response (202):** Accepted

---

## Error Handling

All errors follow this format:

```json
{
  "error": "error_code",
  "message": "Human readable message",
  "status": 400,
  "timestamp": "2025-12-06T10:00:00Z",
  "request_id": "req_abc123"
}
```

### Common Status Codes

- `200 OK` - Successful request
- `201 Created` - Resource created
- `202 Accepted` - Async operation accepted
- `400 Bad Request` - Invalid parameters
- `401 Unauthorized` - Authentication required
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `409 Conflict` - Resource conflict
- `500 Internal Server Error` - Server error

---

## Rate Limiting

- **Rate Limit:** 1000 requests per minute per API key
- **Headers:**
  - `X-RateLimit-Limit: 1000`
  - `X-RateLimit-Remaining: 999`
  - `X-RateLimit-Reset: 1702035600`

---

## Changelog

### v1.0.0 (2025-12-06)
- Initial Spine API release
- Auth, Notebooks, Documents, Secrets, Webhooks endpoints
- Bitwarden integration for secrets management
- Box source linkage for notebook metadata
