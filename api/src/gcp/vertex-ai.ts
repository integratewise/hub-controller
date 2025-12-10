// Vertex AI Integration for Copilot NLP, Embeddings, and Summarization
// Powers the AI layer of the Universal Controller

import { VertexAIEmbedding, CopilotIntent, CommandResult } from '../types';

export interface VertexAIConfig {
  projectId: string;
  location: string;
  model?: string;
  embeddingModel?: string;
}

// Vertex AI client wrapper
export class VertexAIClient {
  private projectId: string;
  private location: string;
  private model: string;
  private embeddingModel: string;
  private apiEndpoint: string;

  constructor(config: VertexAIConfig) {
    this.projectId = config.projectId;
    this.location = config.location;
    this.model = config.model || 'gemini-1.5-pro';
    this.embeddingModel = config.embeddingModel || 'text-embedding-004';
    this.apiEndpoint = `https://${config.location}-aiplatform.googleapis.com/v1`;
  }

  // Generate embeddings for text (for semantic search)
  async generateEmbeddings(texts: string[]): Promise<VertexAIEmbedding[]> {
    const endpoint = `${this.apiEndpoint}/projects/${this.projectId}/locations/${this.location}/publishers/google/models/${this.embeddingModel}:predict`;
    
    // In production, make actual API call
    console.log('Generating embeddings for', texts.length, 'texts');
    
    // Simulated response
    return texts.map(() => ({
      values: Array(768).fill(0).map(() => Math.random() - 0.5),
      statistics: { truncated: false, token_count: 100 },
    }));
  }

  // Parse natural language command into structured intent
  async parseCommand(input: string): Promise<{
    intent: CopilotIntent;
    entities: Record<string, unknown>;
    confidence: number;
  }> {
    const systemPrompt = `You are the IntegrateWise Copilot, an AI assistant for a business operations platform.
    
Parse the user's natural language command and extract:
1. intent: One of: create, list, update, delete, search, metrics, report, sync, compliance, forecast, analyze
2. entities: Extracted entities like project names, metric types, date ranges, filters
3. confidence: 0-1 score of how confident you are in the parsing

Categories in the system: startup_launch, saas, services, sales, marketing, finance, ops, team, digital, rnd, investors

Examples:
- "Show weekly MRR vs burn" -> intent: metrics, entities: {metrics: ["mrr", "burn"], period: "week"}
- "Create SaaS project: Billing revamp" -> intent: create, entities: {type: "project", category: "saas", title: "Billing revamp"}
- "Pull latest Salesforce opportunities" -> intent: sync, entities: {source: "salesforce", type: "opportunity"}
- "Generate ROC compliance report" -> intent: report, entities: {type: "compliance", framework: "roc"}

Respond in JSON format only.`;

    const response = await this.chat(systemPrompt, input);
    
    try {
      return JSON.parse(response);
    } catch {
      return {
        intent: 'unknown',
        entities: {},
        confidence: 0,
      };
    }
  }

  // Chat completion with Gemini
  async chat(systemPrompt: string, userMessage: string): Promise<string> {
    const endpoint = `${this.apiEndpoint}/projects/${this.projectId}/locations/${this.location}/publishers/google/models/${this.model}:generateContent`;
    
    // In production, make actual API call
    console.log('Vertex AI chat:', userMessage.substring(0, 100));
    
    // Simulated response for development
    return JSON.stringify({
      intent: 'unknown',
      entities: {},
      confidence: 0.5,
    });
  }

  // Summarize documents or data
  async summarize(content: string, maxLength: number = 500): Promise<string> {
    const prompt = `Summarize the following content in ${maxLength} characters or less. Be concise and focus on key points:\n\n${content}`;
    
    return this.chat('You are a concise summarization assistant.', prompt);
  }

  // Generate insights from metrics
  async generateInsights(metrics: Record<string, number>): Promise<string[]> {
    const prompt = `Analyze these business metrics and provide 3-5 actionable insights:
${JSON.stringify(metrics, null, 2)}

Focus on:
- Trends and anomalies
- Areas of concern
- Opportunities for improvement
- Comparisons to typical benchmarks`;

    const response = await this.chat(
      'You are a business intelligence analyst. Provide insights in a bullet-point list format.',
      prompt
    );

    return response.split('\n').filter((line) => line.trim().startsWith('-') || line.trim().startsWith('•'));
  }

  // Semantic search using embeddings
  async semanticSearch(
    query: string,
    documents: { id: string; content: string; embedding?: number[] }[],
    topK: number = 5
  ): Promise<{ id: string; score: number }[]> {
    // Generate embedding for query
    const [queryEmbedding] = await this.generateEmbeddings([query]);
    
    // Calculate cosine similarity with all documents
    const results = documents.map((doc) => {
      const embedding = doc.embedding || [];
      const score = this.cosineSimilarity(queryEmbedding.values, embedding);
      return { id: doc.id, score };
    });

    // Sort by score and return top K
    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);
  }

  // Cosine similarity calculation
  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0;
    
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  // Extract key entities from text
  async extractEntities(text: string): Promise<{
    people: string[];
    organizations: string[];
    dates: string[];
    amounts: string[];
    projects: string[];
  }> {
    const prompt = `Extract named entities from the following text:
"${text}"

Return JSON with arrays for: people, organizations, dates, amounts, projects`;

    const response = await this.chat(
      'You are an entity extraction system. Return only valid JSON.',
      prompt
    );

    try {
      return JSON.parse(response);
    } catch {
      return {
        people: [],
        organizations: [],
        dates: [],
        amounts: [],
        projects: [],
      };
    }
  }

  // Generate response for Copilot
  async generateCopilotResponse(
    intent: CopilotIntent,
    data: unknown,
    context?: string
  ): Promise<string> {
    const prompt = `Generate a helpful response for a business operations copilot.
Intent: ${intent}
Data: ${JSON.stringify(data)}
${context ? `Context: ${context}` : ''}

Be concise, professional, and actionable.`;

    return this.chat(
      'You are IntegrateWise Copilot, a helpful business operations assistant.',
      prompt
    );
  }
}

// Factory function
export function createVertexAIClient(
  projectId: string,
  location: string = 'us-central1'
): VertexAIClient {
  return new VertexAIClient({ projectId, location });
}
