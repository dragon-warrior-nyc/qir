export interface ProductDetails {
  name: string;
  description: string;
  price: string;
  category: string;
  brand: string;
  size: string;
  color: string;
  gender: string;
  badge: string;
  _meta?: {
    cost: number;
    tokens?: number;
  };
}

export interface AnalysisResult {
  relevanceScore: number;
  reasoning: string;
  keyMatches: string[];
  missingFeatures: string[];
  customerUtilityAssessment: string;
  humanReviewNeeded: boolean;
  reviewReason?: string;
  _meta?: {
    cost: number;
    usage?: {
      promptTokens: number;
      candidatesTokens: number;
    };
  };
}

export interface GroundingChunk {
  web?: {
    uri: string;
    title: string;
  };
}

export interface SearchContextResult {
  overview: string;
  groundingChunks: GroundingChunk[];
  source?: 'SEARCH' | 'KNOWLEDGE';
  _meta?: {
    cost: number;
  };
}

export enum AnalysisStatus {
  IDLE = 'IDLE',
  ANALYZING = 'ANALYZING',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR',
}

export interface CostBreakdown {
  extractionCost: number;
  contextCost: number;
  analysisCost: number;
  totalCost: number;
}