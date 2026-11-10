import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useState } from 'react';
import { storage } from '../lib/storage';
import { buildDemoPatients } from '../data/demoPatients';
import { newId } from '../lib/protocol';
import { todayISO as today } from '../lib/dates';

const VERSION = 1;

function initialState() {
  return {
    version: VERSION,
    patients: buildDemoPatients(),
    customInjuries: [],
    injuryOverrides: {},
    customExercises: [],
    settings: { specialist: 'د. وليد', clinic: 'عيادة التأهيل الرياضي' },
  };
}

function updatePatient(state, id, fn) {
  return { ...state, patients: state.patients.map((p) => (p.id === id ? fn(p) : p)) };
}

function reducer(state, action) {
  switch (action.type) {
    case 'ADD_PATIENT': {
      const p = {
        id: newId('p'),
        currentPhase: 1,
        criteria: {},
        sessions: [],
        createdAt: Date.now(),
        ...action.patient,
      };
      p.phaseStartDate = p.phaseStartDate || p.rehabStartDate || today();
      p.phaseHistory = p.phaseHistory || [{ phase: p.currentPhase, date: p.phaseStartDate }];
      return { ...state, patients: [p, ...state.patients], _lastAdded: p.id };
    }
    case 'UPDATE_PATIENT':
      return updatePatient(state, action.id, (p) => ({ ...p, ...action.patch }));
    case 'DELETE_PATIENT':
      return { ...state, patients: state.patients.filter((p) => p.id !== action.id) };
    case 'TOGGLE_CRITERION':
      return updatePatient(state, action.id, (p) => {
        const list = p.criteria?.[action.phaseIdx] || [];
        const next = list.includes(action.index) ? list.filter((i) => i !== action.index) : [...list, action.index];
        return { ...p, criteria: { ...(p.criteria || {}), [action.phaseIdx]: next } };
      });
    case 'PROMOTE_PHASE':
      return updatePatient(state, action.id, (p) => {
        const total = action.totalPhases || 4;
        if (p.currentPhase >= total) {
          return { ...p, discharged: true, dischargeDate: today(), phaseHistory: [...(p.phaseHistory || []), { phase: 'discharge', date: today() }] };
        }
        const np = p.currentPhase + 1;
        return { ...p, currentPhase: np, phaseStartDate: today(), phaseHistory: [...(p.phaseHistory || []), { phase: np, date: today() }] };
      });
    case 'DEMOTE_PHASE':
      return updatePatient(state, action.id, (p) => {
        if (p.discharged) return { ...p, discharged: false, dischargeDate: '' };
        if (p.currentPhase <= 1) return p;
        const np = p.currentPhase - 1;
        return { ...p, currentPhase: np, phaseStartDate: today(), phaseHistory: [...(p.phaseHistory || []), { phase: np, date: today(), regression: true }] };
      });
    case 'ADD_SESSION':
      return updatePatient(state, action.id, (p) => ({ ...p, sessions: [...(p.sessions || []), { id: newId('s'), createdAt: Date.now(), ...action.session }] }));
    case 'UPDATE_SESSION':
      return updatePatient(state, action.id, (p) => ({ ...p, sessions: p.sessions.map((s) => (s.id === action.sessionId ? { ...s, ...action.patch } : s)) }));
    case 'DELETE_SESSION':
      return updatePatient(state, action.id, (p) => ({ ...p, sessions: p.sessions.filter((s) => s.id !== action.sessionId) }));
    case 'SET_PATIENT_PROTOCOL':
      return updatePatient(state, action.id, (p) => {
        const po = { ...(p.protocolOverrides || {}) };
        if (action.exercises) po[action.phaseIdx] = action.exercises;
        else delete po[action.phaseIdx];
        return { ...p, protocolOverrides: po };
      });
    case 'SAVE_CUSTOM_INJURY': {
      const exists = state.customInjuries.some((i) => i.id === action.injury.id);
      return {
        ...state,
        customInjuries: exists ? state.customInjuries.map((i) => (i.id === action.injury.id ? action.injury : i)) : [...state.customInjuries, action.injury],
      };
    }
    case 'DELETE_CUSTOM_INJURY':
      return { ...state, customInjuries: state.customInjuries.filter((i) => i.id !== action.id) };
    case 'SAVE_INJURY_OVERRIDE':
      return { ...state, injuryOverrides: { ...state.injuryOverrides, [action.injury.id]: action.injury } };
    case 'RESET_INJURY_OVERRIDE': {
      const o = { ...state.injuryOverrides };
      delete o[action.id];
      return { ...state, injuryOverrides: o };
    }
    case 'ADD_LIBRARY_EXERCISE':
      return { ...state, customExercises: [...(state.customExercises || []), action.exercise] };
    case 'UPDATE_SETTINGS':
      return { ...state, settings: { ...state.settings, ...action.patch } };
    case 'IMPORT_STATE':
      return { ...initialState(), ...action.state, version: VERSION };
    case 'RESET_DEMO':
      return initialState();
    case 'CLEAR_ALL':
      return { ...initialState(), patients: [] };
    default:
      return state;
  }
}

const AppCtx = createContext(null);

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, undefined, () => {
    const saved = storage.load();
    if (saved && saved.version === VERSION && Array.isArray(saved.patients)) return { ...initialState(), ...saved };
    return initialState();
  });

  useEffect(() => {
    const { _lastAdded, ...persist } = state;
    storage.save(persist);
  }, [state]);

  // Toasts
  const [toasts, setToasts] = useState([]);
  const toast = useCallback((msg, type = 'success') => {
    const id = Math.random().toString(36).slice(2);
    setToasts((t) => [...t, { id, msg, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3500);
  }, []);

  const value = useMemo(() => ({ state, dispatch, toast, toasts }), [state, toast, toasts]);
  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>;
}

export function useApp() {
  const ctx = useContext(AppCtx);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}
