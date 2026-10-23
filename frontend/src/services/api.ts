import type {
  AnalyzeResponse,
  InvestigationSummary,
  InvestigationDetail,
  CapaItem
} from '../types/rca';

const API_BASE = '/api';

export async function checkHealth() {
  const res = await fetch(`${API_BASE}/health`);
  if (!res.ok) {
    throw new Error('Backend health check failed');
  }
  return res.json();
}

export async function analyzeIncident(
  text?: string,
  file?: File | null,
  sourceType: string = 'pasted_text'
): Promise<AnalyzeResponse> {
  if (file) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('source_type', sourceType);
    const res = await fetch(`${API_BASE}/rca/analyze`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Analysis failed' }));
      throw new Error(err.detail || 'Failed to analyze uploaded document');
    }
    return res.json();
  }

  const res = await fetch(`${API_BASE}/rca/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, source_type: sourceType }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Analysis failed' }));
    throw new Error(err.detail || 'Failed to analyze incident text');
  }

  return res.json();
}

export async function listInvestigations(): Promise<InvestigationSummary[]> {
  const res = await fetch(`${API_BASE}/rca`);
  if (!res.ok) {
    throw new Error('Failed to retrieve investigations');
  }
  return res.json();
}

export async function getInvestigation(id: number): Promise<InvestigationDetail> {
  const res = await fetch(`${API_BASE}/rca/${id}`);
  if (!res.ok) {
    throw new Error(`Failed to retrieve investigation #${id}`);
  }
  return res.json();
}

export interface SaveInvestigationPayload {
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
  rca_analysis: {
    five_whys: any[];
    fishbone: any;
    missing_evidence: any[];
    root_causes: any[];
  };
  reviewer_notes?: string | null;
  capa_actions: CapaItem[];
}

export async function saveInvestigation(
  data: SaveInvestigationPayload
): Promise<InvestigationDetail> {
  const res = await fetch(`${API_BASE}/rca`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to save' }));
    throw new Error(err.detail || 'Failed to save investigation to database');
  }

  return res.json();
}

export async function updateInvestigation(
  id: number,
  data: Partial<SaveInvestigationPayload>
): Promise<InvestigationDetail> {
  const res = await fetch(`${API_BASE}/rca/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to update' }));
    throw new Error(err.detail || 'Failed to update investigation');
  }

  return res.json();
}
