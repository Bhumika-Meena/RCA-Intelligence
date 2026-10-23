import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import type {
  FiveWhyItem,
  FishboneCategories,
  MissingEvidenceItem,
  RootCauseHypothesis,
  CapaItem,
  RCAAnalysisPayload,
  AnalyzeResponse,
  InvestigationSummary,
  InvestigationDetail
} from '../types/rca';
import * as api from '../services/api';

export interface RcaState {
  // Current active investigation form
  id: number | null;
  deviation_number: string;
  title: string;
  facility: string;
  unit_operation: string;
  product_name: string;
  batch_number: string;
  severity: string;
  status: string;
  incident_date: string;
  reported_by: string;
  containment_actions: string;
  source_type: string;
  source_text: string;
  source_file_name: string | null;

  // Investigation elements
  five_whys: FiveWhyItem[];
  fishbone: FishboneCategories;
  missing_evidence: MissingEvidenceItem[];
  root_causes: RootCauseHypothesis[];
  capa_actions: CapaItem[];
  reviewer_notes: string;

  // AI Assistance tracking
  aiExtracted: RCAAnalysisPayload | null;
  acceptedFields: Record<string, boolean>;

  // Statuses
  analysisStatus: 'idle' | 'loading' | 'success' | 'error';
  analysisError: string | null;
  isSaving: boolean;
  saveSuccess: string | null;
  saveError: string | null;

  // Saved investigations drawer
  savedList: InvestigationSummary[];
  isLoadingSaved: boolean;
  isSavedModalOpen: boolean;
}

const initialFishbone: FishboneCategories = {
  machine: [],
  method: [],
  material: [],
  man: [],
  measurement: [],
  milieu: [],
};

const initialState: RcaState = {
  id: null,
  deviation_number: '',
  title: '',
  facility: '',
  unit_operation: '',
  product_name: '',
  batch_number: '',
  severity: 'Major',
  status: 'draft',
  incident_date: '',
  reported_by: '',
  containment_actions: '',
  source_type: 'pasted_text',
  source_text: '',
  source_file_name: null,

  five_whys: [],
  fishbone: initialFishbone,
  missing_evidence: [],
  root_causes: [],
  capa_actions: [],
  reviewer_notes: '',

  aiExtracted: null,
  acceptedFields: {},

  analysisStatus: 'idle',
  analysisError: null,
  isSaving: false,
  saveSuccess: null,
  saveError: null,

  savedList: [],
  isLoadingSaved: false,
  isSavedModalOpen: false,
};

// Async Thunks
export const runAnalyzeIncident = createAsyncThunk(
  'rca/analyzeIncident',
  async (
    payload: { text?: string; file?: File | null; sourceType: string },
    { rejectWithValue }
  ) => {
    try {
      const response: AnalyzeResponse = await api.analyzeIncident(
        payload.text,
        payload.file,
        payload.sourceType
      );
      return response;
    } catch (err: any) {
      return rejectWithValue(err.message || 'AI Analysis failed');
    }
  }
);

export const fetchSavedInvestigations = createAsyncThunk(
  'rca/fetchSavedInvestigations',
  async (_, { rejectWithValue }) => {
    try {
      return await api.listInvestigations();
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to fetch saved investigations');
    }
  }
);

export const loadInvestigationById = createAsyncThunk(
  'rca/loadInvestigationById',
  async (id: number, { rejectWithValue }) => {
    try {
      return await api.getInvestigation(id);
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to load investigation');
    }
  }
);

export const saveCurrentInvestigation = createAsyncThunk(
  'rca/saveCurrentInvestigation',
  async (_, { getState, rejectWithValue }) => {
    const state = (getState() as { rca: RcaState }).rca;
    try {
      const payload: api.SaveInvestigationPayload = {
        deviation_number: state.deviation_number || null,
        title: state.title || 'Untitled Investigation',
        facility: state.facility || null,
        unit_operation: state.unit_operation || null,
        product_name: state.product_name || null,
        batch_number: state.batch_number || null,
        severity: state.severity || 'Major',
        status: state.status || 'draft',
        incident_date: state.incident_date || null,
        reported_by: state.reported_by || null,
        containment_actions: state.containment_actions || null,
        source_type: state.source_type,
        source_text: state.source_text || null,
        source_file_name: state.source_file_name || null,
        rca_analysis: {
          five_whys: state.five_whys,
          fishbone: state.fishbone,
          missing_evidence: state.missing_evidence,
          root_causes: state.root_causes,
        },
        reviewer_notes: state.reviewer_notes || null,
        capa_actions: state.capa_actions,
      };

      if (state.id) {
        return await api.updateInvestigation(state.id, payload);
      } else {
        return await api.saveInvestigation(payload);
      }
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to save investigation');
    }
  }
);

export const rcaSlice = createSlice({
  name: 'rca',
  initialState,
  reducers: {
    setField: (state, action: PayloadAction<{ field: string; value: any }>) => {
      (state as any)[action.payload.field] = action.payload.value;
      // Mark field as human-reviewed/modified
      state.acceptedFields[action.payload.field] = true;
    },
    acceptAiSuggestion: (state, action: PayloadAction<string>) => {
      const field = action.payload;
      if (state.aiExtracted) {
        const facts = state.aiExtracted.incident_facts as any;
        if (field in facts) {
          (state as any)[field] = facts[field];
          state.acceptedFields[field] = true;
        }
      }
    },
    acceptAllAiSuggestions: (state) => {
      if (!state.aiExtracted) return;
      const facts = state.aiExtracted.incident_facts;
      state.deviation_number = facts.deviation_number || state.deviation_number;
      state.title = facts.title || state.title;
      state.facility = facts.facility || state.facility;
      state.unit_operation = facts.unit_operation || state.unit_operation;
      state.product_name = facts.product_name || state.product_name;
      state.batch_number = facts.batch_number || state.batch_number;
      state.severity = facts.severity || state.severity;
      state.incident_date = facts.incident_date || state.incident_date;
      state.reported_by = facts.reported_by || state.reported_by;
      state.containment_actions = facts.containment_actions || state.containment_actions;

      state.five_whys = state.aiExtracted.five_whys;
      state.fishbone = state.aiExtracted.fishbone;
      state.missing_evidence = state.aiExtracted.missing_evidence;
      state.root_causes = state.aiExtracted.root_causes;
      state.capa_actions = state.aiExtracted.capa_recommendations;

      Object.keys(facts).forEach((k) => {
        state.acceptedFields[k] = true;
      });
      state.acceptedFields['five_whys'] = true;
      state.acceptedFields['fishbone'] = true;
      state.acceptedFields['missing_evidence'] = true;
      state.acceptedFields['root_causes'] = true;
      state.acceptedFields['capa_actions'] = true;
    },
    updateFiveWhy: (
      state,
      action: PayloadAction<{ index: number; question?: string; answer?: string }>
    ) => {
      const item = state.five_whys[action.payload.index];
      if (item) {
        if (action.payload.question !== undefined) item.question = action.payload.question;
        if (action.payload.answer !== undefined) item.answer = action.payload.answer;
      }
    },
    addFiveWhy: (state) => {
      const nextNum = state.five_whys.length + 1;
      state.five_whys.push({
        why_number: nextNum,
        question: `Why did step ${nextNum - 1} occur?`,
        answer: 'Pending investigation',
      });
    },
    removeFiveWhy: (state, action: PayloadAction<number>) => {
      state.five_whys = state.five_whys.filter((_, idx) => idx !== action.payload);
      state.five_whys.forEach((item, idx) => {
        item.why_number = idx + 1;
      });
    },
    addFishboneFactor: (
      state,
      action: PayloadAction<{ category: keyof FishboneCategories; factor: string }>
    ) => {
      if (action.payload.factor.trim()) {
        state.fishbone[action.payload.category].push(action.payload.factor.trim());
      }
    },
    removeFishboneFactor: (
      state,
      action: PayloadAction<{ category: keyof FishboneCategories; index: number }>
    ) => {
      state.fishbone[action.payload.category].splice(action.payload.index, 1);
    },
    toggleEvidenceVerified: (state, action: PayloadAction<number>) => {
      const item = state.missing_evidence[action.payload];
      if (item) {
        item.verified = !item.verified;
      }
    },
    updateRootCauseStatus: (
      state,
      action: PayloadAction<{ index: number; status: string }>
    ) => {
      const item = state.root_causes[action.payload.index];
      if (item) {
        item.status = action.payload.status;
      }
    },
    addCapaAction: (state, action: PayloadAction<CapaItem>) => {
      state.capa_actions.push(action.payload);
    },
    updateCapaAction: (
      state,
      action: PayloadAction<{ index: number; data: Partial<CapaItem> }>
    ) => {
      const item = state.capa_actions[action.payload.index];
      if (item) {
        Object.assign(item, action.payload.data);
      }
    },
    removeCapaAction: (state, action: PayloadAction<number>) => {
      state.capa_actions.splice(action.payload, 1);
    },
    setSavedModalOpen: (state, action: PayloadAction<boolean>) => {
      state.isSavedModalOpen = action.payload;
    },
    clearSaveSuccess: (state) => {
      state.saveSuccess = null;
    },
    resetInvestigation: () => initialState,
  },
  extraReducers: (builder) => {
    // Analyze
    builder.addCase(runAnalyzeIncident.pending, (state) => {
      state.analysisStatus = 'loading';
      state.analysisError = null;
    });
    builder.addCase(runAnalyzeIncident.fulfilled, (state, action) => {
      state.analysisStatus = 'success';
      state.aiExtracted = action.payload.analysis;
      state.source_text = action.payload.source_text;
      state.source_type = action.payload.source_type;
      state.source_file_name = action.payload.source_file_name || null;

      // Auto-populate initial form fields from AI extraction
      const facts = action.payload.analysis.incident_facts;
      state.deviation_number = facts.deviation_number || '';
      state.title = facts.title || 'API Quality Deviation';
      state.facility = facts.facility || '';
      state.unit_operation = facts.unit_operation || '';
      state.product_name = facts.product_name || '';
      state.batch_number = facts.batch_number || '';
      state.severity = facts.severity || 'Major';
      state.incident_date = facts.incident_date || '';
      state.reported_by = facts.reported_by || '';
      state.containment_actions = facts.containment_actions || '';

      state.five_whys = action.payload.analysis.five_whys || [];
      state.fishbone = action.payload.analysis.fishbone || initialFishbone;
      state.missing_evidence = action.payload.analysis.missing_evidence || [];
      state.root_causes = action.payload.analysis.root_causes || [];
      state.capa_actions = action.payload.analysis.capa_recommendations || [];
    });
    builder.addCase(runAnalyzeIncident.rejected, (state, action) => {
      state.analysisStatus = 'error';
      state.analysisError = (action.payload as string) || 'AI Analysis failed';
    });

    // Save
    builder.addCase(saveCurrentInvestigation.pending, (state) => {
      state.isSaving = true;
      state.saveError = null;
      state.saveSuccess = null;
    });
    builder.addCase(saveCurrentInvestigation.fulfilled, (state, action) => {
      state.isSaving = false;
      state.id = action.payload.id;
      state.status = action.payload.status;
      state.saveSuccess = `Investigation #${action.payload.id} successfully saved to Neon PostgreSQL!`;
    });
    builder.addCase(saveCurrentInvestigation.rejected, (state, action) => {
      state.isSaving = false;
      state.saveError = (action.payload as string) || 'Failed to save';
    });

    // List Saved
    builder.addCase(fetchSavedInvestigations.pending, (state) => {
      state.isLoadingSaved = true;
    });
    builder.addCase(fetchSavedInvestigations.fulfilled, (state, action) => {
      state.isLoadingSaved = false;
      state.savedList = action.payload;
    });
    builder.addCase(fetchSavedInvestigations.rejected, (state) => {
      state.isLoadingSaved = false;
    });

    // Load Single Investigation
    builder.addCase(loadInvestigationById.fulfilled, (state, action) => {
      const inv: InvestigationDetail = action.payload;
      state.id = inv.id;
      state.deviation_number = inv.deviation_number || '';
      state.title = inv.title;
      state.facility = inv.facility || '';
      state.unit_operation = inv.unit_operation || '';
      state.product_name = inv.product_name || '';
      state.batch_number = inv.batch_number || '';
      state.severity = inv.severity;
      state.status = inv.status;
      state.incident_date = inv.incident_date || '';
      state.reported_by = inv.reported_by || '';
      state.containment_actions = inv.containment_actions || '';
      state.source_type = inv.source_type;
      state.source_text = inv.source_text || '';
      state.source_file_name = inv.source_file_name || null;
      state.reviewer_notes = inv.reviewer_notes || '';

      if (inv.rca_analysis) {
        state.five_whys = inv.rca_analysis.five_whys || [];
        state.fishbone = inv.rca_analysis.fishbone || initialFishbone;
        state.missing_evidence = inv.rca_analysis.missing_evidence || [];
        state.root_causes = inv.rca_analysis.root_causes || [];
      } else {
        state.five_whys = [];
        state.fishbone = initialFishbone;
        state.missing_evidence = [];
        state.root_causes = [];
      }

      state.capa_actions = inv.capa_actions || [];
      state.isSavedModalOpen = false;
      state.saveSuccess = `Loaded saved investigation #${inv.id} (${inv.deviation_number || 'No Dev#'})`;
    });
  },
});

export const {
  setField,
  acceptAiSuggestion,
  acceptAllAiSuggestions,
  updateFiveWhy,
  addFiveWhy,
  removeFiveWhy,
  addFishboneFactor,
  removeFishboneFactor,
  toggleEvidenceVerified,
  updateRootCauseStatus,
  addCapaAction,
  updateCapaAction,
  removeCapaAction,
  setSavedModalOpen,
  clearSaveSuccess,
  resetInvestigation,
} = rcaSlice.actions;

export default rcaSlice.reducer;
