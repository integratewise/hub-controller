export type KPI = { key: string; value: number; label?: string };

export type Project = { 
  id?: string; 
  name: string; 
  category: string; 
  status: string; 
  owner?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type FinanceSummary = { 
  budget: number; 
  actual: number; 
  burn: number; 
  runwayMonths: number;
};

export type DocRef = {
  source: string;
  title: string;
  url: string;
  tags?: string[];
  lastModified?: string;
};

export type Opportunity = {
  id: string;
  name: string;
  stage: string;
  amount: number;
  closeDate?: string;
  account?: string;
};

export type Customer = {
  id: string;
  name: string;
  status: string;
  mrr?: number;
  healthScore?: number;
  lastActivity?: string;
};

