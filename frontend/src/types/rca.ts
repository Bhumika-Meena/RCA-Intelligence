export interface IncidentFacts {
  deviation_number?: string | null;
  title: string;
  facility?: string | null;
  unit_operation?: string | null;
  product_name?: string | null;
  batch_number?: string | null;
  severity: string;
  incident_date?: string | null;
  reported_by?: string | null;
  containment_actions?: string | null;
}

export interface FiveWhyItem {
  why_number: number;
  question: string;
  answer: string;
}

export interface FishboneCategories {
  machine: string[];
  method: string[];
  material: string[];
  man: string[];
  measurement: string[];
  milieu: string[];
}

export interface MissingEvidenceItem {
  item: string;
  priority: 'High' | 'Medium' | 'Low' | string;
  rationale: string;
  verified?: boolean;
}

export interface RootCauseHypothesis {
  hypothesis: string;
  category: string;
  supporting_evidence: string[];
  contradicting_evidence: string[];
  confidence_level: 'High' | 'Medium' | 'Low' | string;
  status: 'candidate' | 'unconfirmed' | 'confirmed' | string;
}

export interface CapaItem {
  id?: number | null;
  action_type: 'corrective' | 'preventive';
  description: string;
  rationale?: string | null;
  owner?: string | null;
  target_date?: string | null;
  effectiveness_criteria?: string | null;
  status?: string;
}

export interface RCAAnalysisPayload {
  incident_facts: IncidentFacts;
  five_whys: FiveWhyItem[];
  fishbone: FishboneCategories;
  missing_evidence: MissingEvidenceItem[];
  root_causes: RootCauseHypothesis[];
  capa_recommendations: CapaItem[];
}

export interface AnalyzeResponse {
  analysis: RCAAnalysisPayload;
  source_text: string;
  source_type: string;
  source_file_name?: string | null;
}

export interface InvestigationSummary {
  id: number;
  deviation_number?: string | null;
  title: string;
  product_name?: string | null;
  batch_number?: string | null;
  severity: string;
  status: string;
  created_at: string;
  updated_at: string;
  capa_count: number;
}

export interface InvestigationDetail {
  id: number;
  deviation_number?: string | null;
  title: string;
  facility?: string | null;
  unit_operation?: string | null;
  product_name?: string | null;
  batch_number?: string | null;
  severity: string;
  status: string;
  incident_date?: string | null;
  reported_by?: string | null;
  containment_actions?: string | null;
  source_type: string;
  source_text?: string | null;
  source_file_name?: string | null;
  rca_analysis?: {
    five_whys: FiveWhyItem[];
    fishbone: FishboneCategories;
    missing_evidence: MissingEvidenceItem[];
    root_causes: RootCauseHypothesis[];
  } | null;
  reviewer_notes?: string | null;
  created_at: string;
  updated_at: string;
  capa_actions: CapaItem[];
}
