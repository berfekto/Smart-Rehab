/**
 * محرك توليد الوحدة العلاجية الذكي (Traffic Light Engine)
 * GREEN  : ألم منخفض وبدون ارتشاح جديد → الوحدة القياسية للمرحلة
 * YELLOW : ألم 4-6 أو زيادة خفيفة في التورم → خفض الحجم/المجموعات 30% وتعليم التمارين عالية الصدمات
 * RED    : ألم > 6 أو قفزة مفاجئة في الارتشاح → قفل التحميل الثقيل والتحول لبروتوكول الاستشفاء الحاد والتصريف
 */
import { EXERCISES, SECTIONS, resolveExercise } from '../data/exercises';

export const EFFUSION_LEVELS = [
  { v: 0, label: 'لا يوجد', short: '0' },
  { v: 1, label: 'خفيف', short: '1+' },
  { v: 2, label: 'متوسط', short: '2+' },
  { v: 3, label: 'شديد', short: '3+' },
];

export const NERVE_LEVELS = [
  { v: 0, label: 'لا يوجد' },
  { v: 1, label: 'تنميل/كهرباء متقطعة خفيفة' },
  { v: 2, label: 'تنميل/كهرباء مستمرة' },
  { v: 3, label: 'انتشار للأطراف أو ضعف عضلي' },
];

export const LIGHTS = {
  green: {
    key: 'green',
    label: 'إشارة خضراء',
    title: 'الوحدة القياسية للمرحلة',
    desc: 'ألم منخفض وبدون ارتشاح جديد — تحميل كامل حسب بروتوكول المرحلة.',
    color: 'emerald',
  },
  yellow: {
    key: 'yellow',
    label: 'إشارة صفراء',
    title: 'وحدة معدلة (خفض الحجم 30%)',
    desc: 'تم خفض المجموعات بنسبة 30% وتعليم التمارين عالية الصدمات للمراجعة.',
    color: 'amber',
  },
  red: {
    key: 'red',
    label: 'إشارة حمراء',
    title: 'بروتوكول الاستشفاء الحاد وتصريف الارتشاح',
    desc: 'تم رصد تحميل زائد — قفل التمارين الثقيلة لتفادي التثبيط العضلي المفصلي (AMI).',
    color: 'rose',
  },
};

/**
 * تقييم الإشارة الضوئية
 * @param {object} s { pain, effusion, nerve, rom }
 * @param {object} prev آخر جلسة (للمقارنة) { pain, effusion, nerve, rom }
 * @param {object} opts { isNeuro, romInverted } — romInverted: القيم الأقل أفضل (مثل المسافة أصابع-أرض)
 */
export function evaluateTrafficLight(s, prev, opts = {}) {
  const { isNeuro = false, romInverted = false } = opts;
  const reasons = [];
  let level = 0; // 0 green, 1 yellow, 2 red
  const bump = (l, msg) => {
    level = Math.max(level, l);
    reasons.push({ level: l, msg });
  };

  const pain = Number(s.pain) || 0;
  const eff = Number(s.effusion) || 0;
  const prevEff = prev ? Number(prev.effusion) || 0 : null;
  const prevPain = prev ? Number(prev.pain) || 0 : null;
  const effDelta = prevEff === null ? 0 : eff - prevEff;

  // الألم
  if (pain > 6) bump(2, `ألم مرتفع (${pain}/10) — أعلى من الحد الآمن للتحميل`);
  else if (pain >= 4) bump(1, `ألم متوسط (${pain}/10)`);

  // الارتشاح
  if (eff === 3) bump(2, 'ارتشاح/تورم شديد');
  else if (effDelta >= 2) bump(2, `قفزة مفاجئة في الارتشاح (+${effDelta} درجة عن الجلسة السابقة) — مؤشر تحميل زائد`);
  else if (effDelta === 1) bump(1, 'زيادة خفيفة في التورم مقارنة بالجلسة السابقة');
  else if (eff === 2) bump(1, 'ارتشاح متوسط مستمر');

  // قفزة الألم
  if (prevPain !== null && pain - prevPain >= 3 && pain >= 4) bump(1, `ارتفاع الألم ${pain - prevPain} درجات عن الجلسة السابقة`);

  // الأعراض العصبية
  if (isNeuro || Number(s.nerve) > 0) {
    const n = Number(s.nerve) || 0;
    if (n === 3) bump(2, 'أعراض عصبية منتشرة أو ضعف عضلي — يستلزم إعادة تقييم عصبي');
    else if (n === 2) bump(1, 'تنميل/كهرباء مستمرة — تجنب شد العصب');
  }

  // تراجع المدى الحركي
  if (prev && s.rom !== '' && s.rom !== null && s.rom !== undefined && prev.rom !== '' && prev.rom !== null && prev.rom !== undefined) {
    const drop = romInverted ? Number(s.rom) - Number(prev.rom) : Number(prev.rom) - Number(s.rom);
    if (drop >= 10) bump(1, `تراجع المدى الحركي ${drop}${romInverted ? ' سم' : '°'} عن الجلسة السابقة`);
  }

  if (!reasons.length) reasons.push({ level: 0, msg: 'الأعراض مستقرة — جاهز للتحميل القياسي' });

  const key = ['green', 'yellow', 'red'][level];
  return { light: key, reasons, effDelta };
}

const UPPER = ['shoulder', 'clavicle', 'elbow', 'wrist'];
const LOWER = ['knee', 'thigh', 'hip', 'ankle', 'leg'];

/** بروتوكول الاستشفاء الحاد حسب المنطقة التشريحية */
export function recoveryProtocol(region) {
  let refs;
  if (region === 'knee' || region === 'thigh' || region === 'hip') {
    refs = [
      { id: 'ankle_pumps', sets: 3, reps: '20', cue: 'ضخ وريدي لتقليل الارتشاح' },
      { id: 'quad_sets', sets: 3, reps: '10×5ث', cue: 'انقباض ثابت تحت الألم لمنع تثبيط الرباعية (AMI)' },
      { id: 'glute_sets', sets: 2, reps: '10×5ث' },
      { id: 'heel_slides', sets: 2, reps: '10', cue: 'مدى لطيف خالٍ من الألم فقط' },
      { id: 'lymph_drain', sets: 1, reps: '10-15 د' },
      { id: 'elevation', sets: 1, reps: '20 د' },
      { id: 'game_ready', sets: 1, reps: '20 د' },
      { id: 'compression', sets: 1, reps: 'طوال اليوم' },
    ];
  } else if (region === 'ankle' || region === 'leg') {
    refs = [
      { id: 'ankle_pumps', sets: 3, reps: '20', cue: 'مدى لطيف' },
      { id: 'ankle_iso', sets: 3, reps: '10×5ث', load: 'تحت الألم' },
      { id: 'ankle_circles', sets: 2, reps: 'A-Z ببطء' },
      { id: 'quad_sets', sets: 2, reps: '10×5ث' },
      { id: 'lymph_drain', sets: 1, reps: '10-15 د' },
      { id: 'elevation', sets: 1, reps: '20 د' },
      { id: 'cryo', sets: 1, reps: '15-20 د' },
      { id: 'compression', sets: 1, reps: 'طوال اليوم' },
    ];
  } else if (UPPER.includes(region)) {
    refs = [
      { id: 'pendulum', sets: 2, reps: '30ث', cue: 'استرخاء كامل للكتف' },
      region === 'wrist' || region === 'elbow'
        ? { id: 'wrist_ext_iso', sets: 3, reps: '5×10ث', load: 'تحت الألم 30%' }
        : { id: 'shoulder_iso', sets: 3, reps: '10×5ث', load: '20-30% فقط' },
      { id: 'scap_retraction', sets: 2, reps: '10' },
      { id: 'grip_putty', sets: 2, reps: '1 د', load: 'خفيف' },
      { id: 'lymph_drain', sets: 1, reps: '10 د' },
      { id: 'cryo', sets: 1, reps: '15 د' },
      { id: 'relax_pos', sets: 1, reps: '10 د' },
    ];
  } else if (region === 'lumbar') {
    refs = [
      { id: 'relax_pos', sets: 1, reps: '10 د', cue: 'وضعية الراحة المفضلة (90/90 أو منبطح)' },
      { id: 'diaphragm_breath', sets: 3, reps: '10 أنفاس' },
      { id: 'ta_activation', sets: 2, reps: '10×5ث' },
      { id: 'glute_sets', sets: 2, reps: '10×5ث' },
      { id: 'walk_tread', sets: 1, reps: '5-10 د', load: 'مشي هادئ' },
      { id: 'tens', sets: 1, reps: '20 د' },
      { id: 'cryo', sets: 1, reps: '15 د' },
    ];
  } else {
    // cervical / default
    refs = [
      { id: 'relax_pos', sets: 1, reps: '10 د', cue: 'وضعية تخفيف (اليد فوق الرأس إن خففت الأعراض)' },
      { id: 'diaphragm_breath', sets: 3, reps: '10 أنفاس' },
      { id: 'chin_tuck', sets: 2, reps: '8×5ث', cue: 'لطيف وبدون ألم' },
      { id: 'deep_neck_flex', sets: 2, reps: '8×5ث' },
      { id: 'scap_retraction', sets: 2, reps: '10' },
      { id: 'tens', sets: 1, reps: '20 د' },
      { id: 'heat_pack', sets: 1, reps: '15 د' },
    ];
  }
  return refs.map(resolveExercise).filter(Boolean);
}

let uidCounter = 0;
const uid = () => `u${Date.now().toString(36)}${(uidCounter++).toString(36)}`;

export function toUnitItem(ex, extra = {}) {
  return {
    uid: uid(),
    exId: ex.id,
    name: ex.name,
    en: ex.en,
    section: ex.section,
    sets: ex.sets,
    plannedSets: ex.sets,
    reps: ex.reps,
    load: ex.load,
    rest: ex.rest,
    cue: ex.cue || '',
    impact: !!ex.impact,
    heavy: !!ex.heavy,
    iso: !!ex.iso,
    status: 'active', // active | flagged | locked | suspended
    included: true,
    done: false,
    ...extra,
  };
}

/** قائمة تمارين المرحلة (مع تعديلات المريض الدائمة إن وُجدت) */
export function phaseExercises(injury, phaseIdx, patient) {
  const override = patient?.protocolOverrides?.[phaseIdx];
  if (override && override.length) return override.map(resolveExercise).filter(Boolean);
  const phase = injury?.phases?.[phaseIdx];
  return (phase?.exercises || []).map(resolveExercise).filter(Boolean);
}

/**
 * توليد الوحدة العلاجية اليومية
 */
export function generateUnit({ injury, phaseIdx, light, includeHydro = false, region, patient }) {
  let base = phaseExercises(injury, phaseIdx, patient);

  // العلاج المائي
  const hasHydro = base.some((e) => e.section === 'hydro');
  if (!includeHydro) base = base.filter((e) => e.section !== 'hydro');
  else if (!hasHydro) {
    const add = UPPER.includes(region)
      ? ['pool_shoulder', 'pool_walk']
      : region === 'lumbar' || region === 'cervical'
        ? ['pool_walk', 'pool_rom']
        : phaseIdx >= 2
          ? ['pool_walk', 'pool_squat', 'deep_water_run']
          : ['pool_walk', 'pool_rom'];
    base = [...base, ...add.map((id) => ({ ...EXERCISES[id] }))];
  }

  if (light === 'green') {
    return { items: base.map((e) => toUnitItem(e)), mode: 'standard' };
  }

  if (light === 'yellow') {
    const items = base.map((e) => {
      const reduced = Math.max(1, Math.round(e.sets * 0.7));
      const item = toUnitItem(e, { sets: reduced, plannedSets: e.sets, volumeReduced: reduced < e.sets });
      if (e.impact) {
        item.status = 'flagged';
        item.included = false;
        item.flagReason = 'تمرين عالي الصدمات — يُنصح بتأجيله اليوم';
      } else if (e.heavy) {
        item.flagReason = 'خفّض الحمل 20-30% وراقب الاستجابة';
      }
      return item;
    });
    return { items, mode: 'reduced' };
  }

  // RED
  const recovery = recoveryProtocol(region).map((e) => toUnitItem(e, { recovery: true }));
  const recoveryIds = new Set(recovery.map((r) => r.exId));
  const suspended = base
    .filter((e) => !recoveryIds.has(e.id))
    .map((e) => {
      const lock = e.heavy || e.impact || e.section === 'conditioning' || (e.section === 'strength' && !e.iso);
      return toUnitItem(e, {
        status: lock ? 'locked' : 'suspended',
        included: false,
        flagReason: lock ? 'مقفل: تحميل ثقيل/صدمات أثناء الارتشاح يسبب التثبيط العضلي (AMI)' : 'معلق اليوم — يمكن تفعيله بقرار الأخصائي',
      });
    });
  return { items: [...recovery, ...suspended], mode: 'recovery' };
}

export function groupBySection(items) {
  const groups = {};
  items.forEach((it) => {
    const k = SECTIONS[it.section] ? it.section : 'strength';
    (groups[k] = groups[k] || []).push(it);
  });
  return Object.entries(groups).sort((a, b) => SECTIONS[a[0]].order - SECTIONS[b[0]].order);
}

export function unitStats(items) {
  const active = items.filter((i) => i.included && i.status !== 'locked');
  const done = active.filter((i) => i.done);
  const sets = active.reduce((s, i) => s + (Number(i.sets) || 0), 0);
  const planned = items.filter((i) => i.status !== 'locked' || i.recovery).reduce((s, i) => s + (Number(i.plannedSets) || 0), 0);
  return {
    total: active.length,
    done: done.length,
    sets,
    planned,
    locked: items.filter((i) => i.status === 'locked').length,
    flagged: items.filter((i) => i.status === 'flagged').length,
    completion: active.length ? Math.round((done.length / active.length) * 100) : 0,
  };
}
