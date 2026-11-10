/** محرك البروتوكولات: حل الإصابة، الحسابات الزمنية، تقدم المرحلة */
import { INJURIES, INJURY_MAP } from '../data/injuries';
import { daysBetween, parseDate, toISODate } from './dates';

export const STATUS = {
  preop: { label: 'تأهيل قبل العملية', short: 'قبل العملية', color: 'sky' },
  postop: { label: 'تأهيل بعد العملية', short: 'بعد العملية', color: 'violet' },
  conservative: { label: 'تأهيل تحفظي (بدون جراحة)', short: 'تحفظي', color: 'emerald' },
};

export const ACTIVITY_LEVELS = {
  elite: 'رياضي محترف / نخبة',
  competitive: 'رياضي تنافسي (أندية/جامعات)',
  recreational: 'رياضي ترفيهي',
  active: 'نشط بدنياً (غير رياضي)',
  sedentary: 'قليل الحركة / مكتبي',
};

/** كل الإصابات المتاحة (المدمجة بعد تطبيق التعديلات + المخصصة) */
export function allInjuries(state) {
  const overrides = state?.injuryOverrides || {};
  const builtins = INJURIES.map((i) => (overrides[i.id] ? { ...overrides[i.id], edited: true } : i));
  const customs = (state?.customInjuries || []).map((i) => ({ ...i, custom: true }));
  return [...builtins, ...customs];
}

export function getInjury(state, id) {
  if (!id) return null;
  const custom = (state?.customInjuries || []).find((i) => i.id === id);
  if (custom) return { ...custom, custom: true };
  const ov = state?.injuryOverrides?.[id];
  if (ov) return { ...ov, edited: true };
  return INJURY_MAP[id] || null;
}

/** البروتوكول الفعلي للمريض (الإصابة المختارة أو بروتوكول مرجعي لنفس النسيج/المنطقة) */
export function getPatientProtocol(state, patient) {
  const direct = getInjury(state, patient.injuryId);
  if (direct) return { injury: direct, fallback: false };
  const list = allInjuries(state);
  const match =
    list.find((i) => i.category === patient.tissue && i.region === patient.region) ||
    list.find((i) => i.category === patient.tissue) ||
    list.find((i) => i.region === patient.region) ||
    list[0];
  return { injury: match, fallback: true };
}

/** تاريخ المرجع للحسابات الزمنية */
export function referenceDate(patient, injury) {
  if (injury?.timelineRef === 'rehab' && patient.rehabStartDate) return patient.rehabStartDate;
  if (patient.status === 'postop' && patient.surgeryDate) return patient.surgeryDate;
  return patient.injuryDate || patient.rehabStartDate;
}

export function timeline(patient, injury) {
  const ref = referenceDate(patient, injury);
  const days = Math.max(0, daysBetween(ref) ?? 0);
  const week = Math.floor(days / 7) + 1;
  const sinceInjury = patient.injuryDate ? daysBetween(patient.injuryDate) : null;
  const sinceRehab = patient.rehabStartDate ? daysBetween(patient.rehabStartDate) : null;
  const sinceSurgery = patient.surgeryDate ? daysBetween(patient.surgeryDate) : null;
  let label;
  if (patient.status === 'postop') label = `الأسبوع ${week} بعد العملية`;
  else if (patient.status === 'preop') label = `الأسبوع ${week} من الإصابة`;
  else label = `الأسبوع ${week} من الإصابة`;
  if (injury?.timelineRef === 'rehab') label = `الأسبوع ${week} من بدء التأهيل`;

  const surgeryCountdown =
    patient.status === 'preop' && patient.surgeryDate && sinceSurgery !== null && sinceSurgery < 0
      ? Math.abs(sinceSurgery)
      : null;

  return { ref, days, week, label, sinceInjury, sinceRehab, sinceSurgery, surgeryCountdown };
}

/** المرحلة المتوقعة حسب الجدول الزمني فقط */
export function expectedPhase(injury, days) {
  if (!injury) return 1;
  const w = days / 7;
  for (let i = 0; i < injury.phases.length; i++) {
    if (w < injury.phases[i].weeks[1]) return i + 1;
  }
  return injury.phases.length;
}

export function scheduleStatus(currentPhase, expected) {
  if (currentPhase > expected) return { key: 'ahead', label: 'متقدم عن الجدول', color: 'sky' };
  if (currentPhase < expected) return { key: 'behind', label: 'متأخر عن الجدول الزمني', color: 'amber' };
  return { key: 'on', label: 'ضمن الجدول الزمني', color: 'emerald' };
}

export function phaseDurationDays(phase) {
  return Math.max(3, Math.round((phase.weeks[1] - phase.weeks[0]) * 7));
}

export function formatWeeks(weeks) {
  const [a, b] = weeks;
  const f = (n) => (n < 1 && n > 0 ? `${Math.round(n * 7)} أيام` : `${n}`);
  if (a < 1 && b < 1) return `${Math.round(a * 7)}-${Math.round(b * 7)} أيام`;
  if (a > 0 && a < 1) return `${f(a)} – الأسبوع ${b}`;
  return `الأسبوع ${a}–${b}`;
}

/** تقدم المرحلة الحالية: 60% شروط الترقية + 40% الزمن داخل المرحلة */
export function phaseProgress(patient, injury) {
  const phaseIdx = (patient.currentPhase || 1) - 1;
  const phase = injury?.phases?.[phaseIdx];
  if (!phase) return { percent: 0, criteriaDone: 0, criteriaTotal: 0, daysInPhase: 0, durationDays: 0, allMet: false };
  const checked = patient.criteria?.[phaseIdx] || [];
  const criteriaTotal = phase.criteria.length;
  const criteriaDone = phase.criteria.filter((_, i) => checked.includes(i)).length;
  const daysInPhase = Math.max(0, daysBetween(patient.phaseStartDate || patient.rehabStartDate) ?? 0);
  const durationDays = phaseDurationDays(phase);
  const cf = criteriaTotal ? criteriaDone / criteriaTotal : 1;
  const tf = Math.min(1, daysInPhase / durationDays);
  const percent = Math.round((cf * 0.6 + tf * 0.4) * 100);
  return { percent, criteriaDone, criteriaTotal, daysInPhase, durationDays, allMet: criteriaDone === criteriaTotal, cf, tf };
}

export function overallProgress(patient, injury) {
  const n = injury?.phases?.length || 4;
  const pp = phaseProgress(patient, injury);
  if (patient.discharged) return 100;
  return Math.round((((patient.currentPhase || 1) - 1 + pp.percent / 100) / n) * 100);
}

export function lastSession(patient) {
  const s = patient.sessions || [];
  if (!s.length) return null;
  return [...s].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : (b.createdAt || 0) - (a.createdAt || 0)))[0];
}

export function sortedSessions(patient, dir = 'asc') {
  const s = [...(patient.sessions || [])].sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : (a.createdAt || 0) - (b.createdAt || 0)));
  return dir === 'asc' ? s : s.reverse();
}

export function newId(prefix = 'id') {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

export function ensureISO(d) {
  return d ? toISODate(parseDate(d)) : '';
}
