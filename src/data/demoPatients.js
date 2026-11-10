/** بيانات تجريبية: 4 حالات واقعية في مراحل مختلفة (التواريخ نسبية لليوم الحالي) */
import { INJURY_MAP } from './injuries';
import { daysAgoISO } from '../lib/dates';
import { evaluateTrafficLight, generateUnit } from '../lib/engine';

function buildSession(patient, { daysAgo, pain, effusion, nerve = 0, rom, notes, hydro = false, phase, skip = [] }, prev) {
  const injury = INJURY_MAP[patient.injuryId];
  const phaseIdx = (phase || patient.currentPhase) - 1;
  const symptoms = { pain, effusion, nerve, rom };
  const tl = evaluateTrafficLight(symptoms, prev, { isNeuro: !!injury.neuro, romInverted: injury.rom?.unit === 'سم' });
  const { items } = generateUnit({ injury, phaseIdx, light: tl.light, includeHydro: hydro, region: patient.region, patient });
  const exercises = items.map((it, idx) => ({
    ...it,
    done: it.included && it.status !== 'locked' && !skip.includes(idx),
  }));
  const active = exercises.filter((e) => e.included && e.status !== 'locked');
  return {
    id: `s_${patient.id}_${daysAgo}`,
    date: daysAgoISO(daysAgo),
    createdAt: Date.now() - daysAgo * 86400000,
    phase: phaseIdx + 1,
    light: tl.light,
    reasons: tl.reasons.map((r) => r.msg),
    pain,
    effusion,
    nerve,
    rom,
    hydro,
    exercises,
    completion: active.length ? Math.round((active.filter((e) => e.done).length / active.length) * 100) : 0,
    notes,
  };
}

function withSessions(patient, specs) {
  const sessions = [];
  let prev = null;
  specs.forEach((sp) => {
    const s = buildSession(patient, sp, prev);
    sessions.push(s);
    prev = s;
  });
  return { ...patient, sessions };
}

export function buildDemoPatients() {
  // 1) خياطة غضروف هلالي — الأسبوع 3 بعد العملية مع ارتشاح خفيف
  const p1 = withSessions(
    {
      id: 'p_demo_meniscus',
      name: 'أحمد سمير الشريف',
      age: 24,
      weight: 78,
      height: 181,
      gender: 'male',
      phone: '01012345678',
      sport: 'كرة القدم (ظهير أيمن)',
      activityLevel: 'competitive',
      region: 'knee',
      side: 'right',
      tissue: 'ligament',
      injuryId: 'meniscus_repair',
      diagnosis: 'خياطة الغضروف الهلالي الإنسي (Bucket-handle) - الركبة اليمنى',
      status: 'postop',
      injuryDate: daysAgoISO(33),
      surgeryDate: daysAgoISO(17),
      rehabStartDate: daysAgoISO(15),
      currentPhase: 1,
      phaseStartDate: daysAgoISO(15),
      criteria: { 0: [0, 3] },
      phaseHistory: [{ phase: 1, date: daysAgoISO(15) }],
      notes: 'تعليمات الجراح: ثني 0-90° لأول 4 أسابيع، دعامة مقفلة في الفرد أثناء المشي. حساسية من الإيبوبروفين.',
      createdAt: Date.now() - 15 * 86400000,
    },
    [
      { daysAgo: 15, pain: 6, effusion: 2, rom: 45, notes: 'أول جلسة بعد العملية. ارتشاح متوسط، تثبيط واضح للرباعية (Lag 15°). تم التركيز على التبريد وNMES.' },
      { daysAgo: 13, pain: 5, effusion: 2, rom: 55, notes: 'تحسن بسيط في الثني. لا يزال يعاني من صعوبة رفع الساق مفرودة.' },
      { daysAgo: 10, pain: 4, effusion: 1, rom: 70, notes: 'انخفاض الارتشاح إلى خفيف. فرد كامل 0° تم الوصول إليه.' },
      { daysAgo: 8, pain: 3, effusion: 1, rom: 78, notes: 'SLR بدون تأخر. تحمل جيد للتمارين.' },
      { daysAgo: 5, pain: 2, effusion: 1, rom: 85, notes: 'تقدم ممتاز. مشى كثيراً في نهاية الأسبوع.' },
      { daysAgo: 2, pain: 4, effusion: 2, rom: 82, notes: 'زيادة خفيفة في التورم بعد المشي الطويل في حفل زفاف. تم تخفيض الحجم وتعليمات الراحة والرفع.' },
    ]
  );

  // 2) تأهيل قبل عملية الرباط الصليبي
  const p2 = withSessions(
    {
      id: 'p_demo_acl',
      name: 'يوسف خالد منصور',
      age: 21,
      weight: 72,
      height: 178,
      gender: 'male',
      phone: '01198765432',
      sport: 'كرة السلة (صانع ألعاب)',
      activityLevel: 'elite',
      region: 'knee',
      side: 'left',
      tissue: 'ligament',
      injuryId: 'acl_prehab',
      diagnosis: 'قطع كامل في الرباط الصليبي الأمامي - الركبة اليسرى + كدمة عظمية',
      status: 'preop',
      injuryDate: daysAgoISO(22),
      surgeryDate: daysAgoISO(-21),
      rehabStartDate: daysAgoISO(19),
      currentPhase: 2,
      phaseStartDate: daysAgoISO(6),
      criteria: { 0: [0, 1, 2, 3], 1: [0, 3] },
      phaseHistory: [
        { phase: 1, date: daysAgoISO(19) },
        { phase: 2, date: daysAgoISO(6) },
      ],
      notes: 'الجراحة مقررة بطُعم أوتار الخلفية (Hamstring autograft). الهدف: Quiet knee + قوة رباعية ≥ 80% قبل العملية.',
      createdAt: Date.now() - 19 * 86400000,
    },
    [
      { daysAgo: 19, pain: 5, effusion: 2, rom: 95, phase: 1, notes: 'التقييم الأولي: ارتشاح متوسط، Lachman إيجابي، فقدان فرد 5°.' },
      { daysAgo: 16, pain: 4, effusion: 1, rom: 105, phase: 1, notes: 'تحسن الارتشاح. استعادة الفرد الكامل.' },
      { daysAgo: 12, pain: 3, effusion: 1, rom: 115, phase: 1, notes: 'مشي طبيعي بدون عكازات.' },
      { daysAgo: 9, pain: 2, effusion: 0, rom: 120, phase: 1, notes: 'لا ارتشاح. SLR بدون تأخر. جاهز للمرحلة الثانية.' },
      { daysAgo: 6, pain: 2, effusion: 0, rom: 122, phase: 2, hydro: true, notes: 'بدء المرحلة الثانية مع جلسة مائية.' },
      { daysAgo: 3, pain: 1, effusion: 0, rom: 126, phase: 2, notes: 'تحمل ممتاز للتحميل المغلق. توازن رجل واحدة 22 ثانية.' },
    ]
  );

  // 3) تمزق حاد في العضلة الخلفية
  const p3 = withSessions(
    {
      id: 'p_demo_hamstring',
      name: 'عمر طارق حسن',
      age: 27,
      weight: 70,
      height: 175,
      gender: 'male',
      phone: '01234567890',
      sport: 'ألعاب القوى (عدو 200م)',
      activityLevel: 'elite',
      region: 'thigh',
      side: 'right',
      tissue: 'muscle',
      injuryId: 'hamstring_strain',
      diagnosis: 'تمزق حاد في رأس العضلة ذات الرأسين الطويل (BAMIC 2b) - الفخذ الأيمن',
      status: 'conservative',
      injuryDate: daysAgoISO(4),
      surgeryDate: '',
      rehabStartDate: daysAgoISO(3),
      currentPhase: 1,
      phaseStartDate: daysAgoISO(3),
      criteria: {},
      phaseHistory: [{ phase: 1, date: daysAgoISO(3) }],
      notes: 'إصابة أثناء العدو عند 60م. ألم عند الضغط 12 سم من الحدبة الإسكية. MRI: تمزق 2b طوله 6 سم.',
      createdAt: Date.now() - 3 * 86400000,
    },
    [
      { daysAgo: 3, pain: 7, effusion: 1, rom: 45, notes: 'المرحلة الحادة: ألم مرتفع عند المشي، كدمة خلفية. تم التحويل لبروتوكول الاستشفاء.' },
      { daysAgo: 1, pain: 5, effusion: 1, rom: 55, notes: 'تحسن الألم. انقباض ثابت عند 90° محتمل بألم 3/10.' },
    ]
  );

  // 4) انزلاق غضروفي قطني مع عرق النسا
  const p4 = withSessions(
    {
      id: 'p_demo_lumbar',
      name: 'منى عبد الرحمن فؤاد',
      age: 38,
      weight: 64,
      height: 165,
      gender: 'female',
      phone: '01556677889',
      sport: 'كروس فيت (ترفيهي) + عمل مكتبي',
      activityLevel: 'recreational',
      region: 'lumbar',
      side: 'left',
      tissue: 'nerve',
      injuryId: 'lumbar_disc',
      diagnosis: 'انزلاق غضروفي L5-S1 خلفي جانبي أيسر مع عرق النسا (جذر S1)',
      status: 'conservative',
      injuryDate: daysAgoISO(51),
      surgeryDate: '',
      rehabStartDate: daysAgoISO(44),
      currentPhase: 2,
      phaseStartDate: daysAgoISO(24),
      criteria: { 0: [0, 1, 2, 3], 1: [0, 2] },
      phaseHistory: [
        { phase: 1, date: daysAgoISO(44) },
        { phase: 2, date: daysAgoISO(24) },
      ],
      notes: 'تفضيل اتجاهي للفرد (Extension bias). منعكس الكاحل ضعيف قليلاً يسار. لا علامات ذيل الفرس.',
      createdAt: Date.now() - 44 * 86400000,
    },
    [
      { daysAgo: 44, pain: 8, effusion: 0, nerve: 2, rom: 35, phase: 1, notes: 'ألم شديد ينتشر حتى القدم. صعوبة في الجلوس. بروتوكول تهدئة.' },
      { daysAgo: 38, pain: 6, effusion: 0, nerve: 2, rom: 30, phase: 1, notes: 'بدء تمركز الألم مع تمارين ماكنزي.' },
      { daysAgo: 31, pain: 4, effusion: 0, nerve: 1, rom: 24, phase: 1, notes: 'الألم أصبح فوق الركبة فقط.' },
      { daysAgo: 24, pain: 3, effusion: 0, nerve: 1, rom: 20, phase: 2, notes: 'ترقية للمرحلة الثانية. بدء التحكم الحركي.' },
      { daysAgo: 17, pain: 3, effusion: 0, nerve: 1, rom: 16, phase: 2, hydro: true, notes: 'تحمل جيد للمشي في الماء.' },
      { daysAgo: 10, pain: 2, effusion: 0, nerve: 1, rom: 14, phase: 2, notes: 'Dead bug بتحكم جيد. تنميل خفيف في الكعب بعد الجلوس الطويل.' },
      { daysAgo: 3, pain: 2, effusion: 0, nerve: 1, rom: 12, phase: 2, notes: 'ODI تحسن من 48% إلى 26%.' },
    ]
  );

  return [p1, p2, p3, p4];
}
