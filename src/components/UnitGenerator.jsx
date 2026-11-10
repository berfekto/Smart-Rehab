import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  BookmarkCheck,
  CheckCircle2,
  Droplets,
  Dumbbell,
  Flame,
  Gauge,
  Lock,
  Plus,
  Printer,
  Save,
  ShieldAlert,
  Trash2,
  Unlock,
  Waves,
} from 'lucide-react';
import {
  Card,
  CardHeader,
  Badge,
  Button,
  Field,
  Input,
  Select,
  Textarea,
  Segmented,
  ProgressBar,
  LightDot,
  Avatar,
  cx,
} from './ui';
import {
  EFFUSION_LEVELS,
  NERVE_LEVELS,
  LIGHTS,
  evaluateTrafficLight,
  generateUnit,
  groupBySection,
  unitStats,
  toUnitItem,
} from '../lib/engine';
import { EXERCISE_LIST, SECTIONS } from '../data/exercises';
import { REGIONS } from '../data/injuries';
import { getPatientProtocol, lastSession, timeline, newId } from '../lib/protocol';
import { todayISO } from '../lib/dates';
import { useApp } from '../store/AppContext';

export function UnitGenerator({ patient: fixedPatient = null, onSessionSaved, onOpenPatient }) {
  const { state, dispatch, toast } = useApp();
  const [selectedPatientId, setSelectedPatientId] = useState(
    fixedPatient?.id || state.patients[0]?.id || ''
  );

  const patient = useMemo(
    () => fixedPatient || state.patients.find((p) => p.id === selectedPatientId) || state.patients[0],
    [fixedPatient, state.patients, selectedPatientId]
  );

  const { injury } = useMemo(
    () => (patient ? getPatientProtocol(state, patient) : { injury: null }),
    [state, patient]
  );

  const prev = useMemo(() => (patient ? lastSession(patient) : null), [patient]);
  const tlInfo = useMemo(() => (patient && injury ? timeline(patient, injury) : null), [patient, injury]);

  const [phaseIdx, setPhaseIdx] = useState(0);
  const [pain, setPain] = useState(2);
  const [effusion, setEffusion] = useState(0);
  const [nerve, setNerve] = useState(0);
  const [rom, setRom] = useState(90);
  const [includeHydro, setIncludeHydro] = useState(false);
  const [items, setItems] = useState([]);
  const [notes, setNotes] = useState('');
  const [sessionDate, setSessionDate] = useState(todayISO());
  const [showAddEx, setShowAddEx] = useState(false);
  const [selectedExId, setSelectedExId] = useState('quad_sets');
  const [customExName, setCustomExName] = useState('');
  const [customExSection, setCustomExSection] = useState('strength');
  const [customExSets, setCustomExSets] = useState(3);
  const [customExReps, setCustomExReps] = useState('12');

  useEffect(() => {
    if (!patient || !injury) return;
    const pIdx = Math.max(0, (patient.currentPhase || 1) - 1);
    setPhaseIdx(pIdx);
    const last = lastSession(patient);
    const initPain = last ? Number(last.pain) || 2 : 2;
    const initEff = last ? Number(last.effusion) || 0 : 0;
    const initNerve = last ? Number(last.nerve) || 0 : 0;
    const initRom =
      last && last.rom !== undefined && last.rom !== ''
        ? Number(last.rom)
        : injury.rom?.target
          ? Math.round(injury.rom.target * 0.7)
          : 90;
    setPain(initPain);
    setEffusion(initEff);
    setNerve(initNerve);
    setRom(initRom);
    setIncludeHydro(false);
    setNotes('');
  }, [patient?.id, injury?.id]);

  const evaluation = useMemo(() => {
    if (!injury) return { light: 'green', reasons: [], effDelta: 0 };
    return evaluateTrafficLight(
      { pain, effusion, nerve, rom },
      prev,
      { isNeuro: !!injury.neuro || patient?.tissue === 'nerve', romInverted: injury.rom?.unit === 'سم' }
    );
  }, [pain, effusion, nerve, rom, prev, injury, patient?.tissue]);

  useEffect(() => {
    if (!patient || !injury) return;
    const gen = generateUnit({
      injury,
      phaseIdx,
      light: evaluation.light,
      includeHydro,
      region: patient.region,
      patient,
    });
    setItems(gen.items.map((it) => ({ ...it, done: it.included && it.status !== 'locked' })));
  }, [patient?.id, injury?.id, phaseIdx, evaluation.light, includeHydro, patient?.protocolOverrides]);

  if (!patient || !injury) {
    return (
      <Card className="p-8 text-center">
        <p className="text-sm text-slate-500">لا يوجد مرضى مسجلون حالياً.</p>
      </Card>
    );
  }

  const lightMeta = LIGHTS[evaluation.light];
  const stats = unitStats(items);
  const grouped = groupBySection(items);
  const currentPhaseObj = injury.phases[phaseIdx] || injury.phases[0];
  const allLibrary = [...EXERCISE_LIST, ...(state.customExercises || [])];

  const updateItem = (uid, patch) => {
    setItems((list) => list.map((it) => (it.uid === uid ? { ...it, ...patch } : it)));
  };

  const removeItem = (uid) => {
    setItems((list) => list.filter((it) => it.uid !== uid));
  };

  const handleAddLibraryExercise = () => {
    const found = allLibrary.find((e) => e.id === selectedExId);
    if (!found) return;
    setItems((list) => [...list, { ...toUnitItem(found), done: true }]);
    toast(`تمت إضافة "${found.name}"`);
  };

  const handleAddCustomExercise = () => {
    if (!customExName.trim()) {
      toast('أدخل اسم التمرين', 'warning');
      return;
    }
    const newEx = {
      id: newId('ex_custom'),
      name: customExName.trim(),
      en: '',
      section: customExSection,
      sets: Number(customExSets) || 3,
      reps: customExReps || '10',
      load: 'وزن الجسم',
      rest: '60ث',
      custom: true,
    };
    dispatch({ type: 'ADD_LIBRARY_EXERCISE', exercise: newEx });
    setItems((list) => [...list, { ...toUnitItem(newEx), done: true }]);
    setCustomExName('');
    toast('تمت إضافة التمرين للجلسة');
  };

  const handleSaveAsPhaseDefault = () => {
    const activeExercises = items
      .filter((i) => i.included && !i.recovery)
      .map((i) => ({
        id: i.exId,
        name: i.name,
        en: i.en,
        section: i.section,
        sets: Number(i.sets) || 3,
        reps: i.reps,
        load: i.load,
        rest: i.rest,
        cue: i.cue,
        impact: i.impact,
        heavy: i.heavy,
        iso: i.iso,
      }));
    dispatch({
      type: 'SET_PATIENT_PROTOCOL',
      id: patient.id,
      phaseIdx,
      exercises: activeExercises,
    });
    toast(`تم حفظ التعديلات للمرحلة ${phaseIdx + 1}`);
  };

  const handleSaveSession = () => {
    const session = {
      date: sessionDate || todayISO(),
      phase: phaseIdx + 1,
      light: evaluation.light,
      reasons: evaluation.reasons.map((r) => r.msg),
      pain: Number(pain),
      effusion: Number(effusion),
      nerve: Number(nerve),
      rom: rom === '' ? null : Number(rom),
      hydro: includeHydro,
      exercises: items,
      completion: stats.completion,
      notes:
        notes.trim() ||
        (evaluation.light === 'red'
          ? 'تم التحويل لبروتوكول الاستشفاء وتصريف التورم وقفل التمارين الثقيلة.'
          : evaluation.light === 'yellow'
            ? 'تم تقليل المجموعات 30% وتأجيل التمارين عالية الصدمات.'
            : 'تم تنفيذ تمارين المرحلة بشكل طبيعي.'),
    };
    dispatch({ type: 'ADD_SESSION', id: patient.id, session });
    toast('تم حفظ الجلسة في سجل المريض');
    onSessionSaved?.(session);
  };

  const painTone = pain > 6 ? 'rose' : pain >= 4 ? 'amber' : 'emerald';
  const romUnit = injury.rom?.unit || '°';

  return (
    <div className="space-y-5">
      {/* اختيار المريض عند فتح منشئ الجلسة من القائمة الجانبية */}
      {!fixedPatient && (
        <Card className="p-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Avatar name={patient.name} />
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-extrabold text-slate-900 dark:text-white">{patient.name}</h3>
                  <Badge tone="sky">{REGIONS[patient.region]}</Badge>
                  <Badge tone="emerald">{tlInfo?.label}</Badge>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">{patient.diagnosis}</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Select
                value={patient.id}
                onChange={(e) => setSelectedPatientId(e.target.value)}
                className="min-w-[220px]"
              >
                {state.patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} — المرحلة {p.currentPhase}
                  </option>
                ))}
              </Select>
              {onOpenPatient && (
                <Button variant="secondary" size="sm" onClick={() => onOpenPatient(patient.id)}>
                  ملف المريض
                </Button>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* القسم العلوي: تقييم المريض اليوم + نتيجة الإشارة الضوئية */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-12">
        {/* إدخال الأعراض اليومية */}
        <Card className="xl:col-span-7">
          <CardHeader
            icon={Gauge}
            tone={lightMeta.color}
            title="تقييم المريض قبل الجلسة"
            subtitle="حدّد الألم والتورم والمدى الحركي ليتم ضبط تمارين اليوم تلقائياً"
          />

          <div className="space-y-4 p-5">
            {/* 1. مستوى الألم */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-950/50">
              <div className="mb-2 flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm font-bold">
                  <Flame size={16} className="text-rose-500" />
                  مستوى الألم اليوم (0–10)
                </span>
                <Badge tone={painTone} className="text-sm font-extrabold">
                  {pain} / 10 — {pain <= 3 ? 'خفيف' : pain <= 6 ? 'متوسط' : 'شديد'}
                </Badge>
              </div>
              <input
                type="range"
                min="0"
                max="10"
                step="1"
                value={pain}
                onChange={(e) => setPain(Number(e.target.value))}
                className="range w-full"
              />
              <div className="mt-1.5 flex justify-between text-[11px] text-slate-400">
                <span>0 (بدون ألم)</span>
                <span>1–3 (أخضر)</span>
                <span>4–6 (أصفر)</span>
                <span>7–10 (أحمر)</span>
              </div>
            </div>

            {/* 2. التورم / الارتشاح */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm font-bold">
                  <Droplets size={16} className="text-sky-500" />
                  درجة الارتشاح / التورم
                </span>
                {prev && (
                  <span className="text-xs text-slate-400">
                    الجلسة السابقة: <b>{EFFUSION_LEVELS[prev.effusion]?.label}</b>
                  </span>
                )}
              </div>
              <Segmented
                value={effusion}
                onChange={setEffusion}
                options={EFFUSION_LEVELS.map((l) => ({
                  value: l.v,
                  label: l.label,
                  tone: l.v === 0 ? 'emerald' : l.v === 1 ? 'sky' : l.v === 2 ? 'amber' : 'rose',
                }))}
              />
            </div>

            {/* 3. المدى الحركي + الأعراض العصبية */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field
                label={`${injury.rom?.label || 'زاوية المدى الحركي'} (${romUnit})`}
                hint={`الهدف: ${injury.rom?.target ?? 120}${romUnit}${prev?.rom !== undefined ? ` • السابق: ${prev.rom}${romUnit}` : ''}`}
              >
                <Input
                  type="number"
                  value={rom}
                  onChange={(e) => setRom(e.target.value === '' ? '' : Number(e.target.value))}
                />
              </Field>

              <Field label="تنميل أو كهرباء (أعراض عصبية)">
                <Select value={nerve} onChange={(e) => setNerve(Number(e.target.value))}>
                  {NERVE_LEVELS.map((n) => (
                    <option key={n.v} value={n.v}>
                      {n.label}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>

            {/* 4. خيارات سريعة */}
            <div className="grid grid-cols-1 gap-3 pt-1 sm:grid-cols-3">
              <Field label="المرحلة">
                <Select value={phaseIdx} onChange={(e) => setPhaseIdx(Number(e.target.value))}>
                  {injury.phases.map((p, i) => (
                    <option key={i} value={i}>
                      المرحلة {i + 1}: {p.title}
                    </option>
                  ))}
                </Select>
              </Field>

              <Field label="تاريخ الجلسة">
                <Input type="date" value={sessionDate} onChange={(e) => setSessionDate(e.target.value)} />
              </Field>

              <Field label="العلاج المائي">
                <button
                  type="button"
                  onClick={() => setIncludeHydro((v) => !v)}
                  className={cx(
                    'flex h-[38px] items-center justify-center gap-2 rounded-xl border text-xs font-bold transition',
                    includeHydro
                      ? 'border-cyan-500 bg-cyan-500/15 text-cyan-600 dark:text-cyan-300'
                      : 'border-slate-200 text-slate-500 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800'
                  )}
                >
                  <Waves size={15} />
                  {includeHydro ? 'مُفعّل اليوم' : 'إضافة تمارين مائية'}
                </button>
              </Field>
            </div>
          </div>
        </Card>

        {/* بطاقة قرار الجلسة (الإشارة الضوئية) — واضحة ومباشرة */}
        <Card
          className={cx(
            'flex flex-col justify-between p-5 transition xl:col-span-5',
            evaluation.light === 'green' && 'border-emerald-500/40',
            evaluation.light === 'yellow' && 'border-amber-500/40',
            evaluation.light === 'red' && 'border-rose-500/50'
          )}
        >
          <div>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 rounded-2xl bg-slate-900 px-3.5 py-2.5">
                  <span
                    className={cx(
                      'h-4 w-4 rounded-full transition',
                      evaluation.light === 'red' ? 'bg-rose-500 shadow-lg shadow-rose-500' : 'bg-rose-950/60'
                    )}
                  />
                  <span
                    className={cx(
                      'h-4 w-4 rounded-full transition',
                      evaluation.light === 'yellow' ? 'bg-amber-400 shadow-lg shadow-amber-400' : 'bg-amber-950/60'
                    )}
                  />
                  <span
                    className={cx(
                      'h-4 w-4 rounded-full transition',
                      evaluation.light === 'green' ? 'bg-emerald-400 shadow-lg shadow-emerald-400' : 'bg-emerald-950/60'
                    )}
                  />
                </div>
                <div>
                  <Badge tone={lightMeta.color} className="mb-1">
                    {lightMeta.label}
                  </Badge>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white">{lightMeta.title}</h3>
                </div>
              </div>
              <LightDot light={evaluation.light} size={12} pulse />
            </div>

            <p className="mt-3 text-xs leading-6 text-slate-600 dark:text-slate-300">{lightMeta.desc}</p>

            {/* أسباب القرار */}
            <div className="mt-4 space-y-2">
              {evaluation.reasons.map((r, i) => (
                <div
                  key={i}
                  className={cx(
                    'flex items-start gap-2 rounded-xl px-3 py-2.5 text-xs font-semibold',
                    r.level === 2
                      ? 'bg-rose-500/15 text-rose-700 dark:text-rose-300'
                      : r.level === 1
                        ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300'
                        : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                  )}
                >
                  {r.level === 2 ? (
                    <ShieldAlert size={15} className="mt-0.5 shrink-0" />
                  ) : r.level === 1 ? (
                    <AlertTriangle size={15} className="mt-0.5 shrink-0" />
                  ) : (
                    <CheckCircle2 size={15} className="mt-0.5 shrink-0" />
                  )}
                  <span>{r.msg}</span>
                </div>
              ))}
            </div>

            {evaluation.light === 'red' && (
              <div className="mt-3 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs leading-6 text-rose-700 dark:text-rose-200">
                <b>حماية المفصل (AMI):</b> تم قفل التمارين الثقيلة ({stats.locked}) تلقائياً، وتحويل الجلسة إلى تمارين ثابتة وتصريف التورم والثلج.
              </div>
            )}
          </div>

          {/* ملخص سريع للأرقام */}
          <div className="mt-5 grid grid-cols-3 gap-2 rounded-2xl bg-slate-100/80 p-3 text-center dark:bg-slate-950/60">
            <div>
              <p className="text-[11px] text-slate-500">تمارين اليوم</p>
              <p className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400">{stats.total}</p>
            </div>
            <div>
              <p className="text-[11px] text-slate-500">المجموعات</p>
              <p className="text-lg font-extrabold">
                {stats.sets}
                {stats.planned !== stats.sets && (
                  <span className="mr-1 text-xs text-slate-400 line-through">{stats.planned}</span>
                )}
              </p>
            </div>
            <div>
              <p className="text-[11px] text-slate-500">مقفل / مؤجل</p>
              <p className="text-lg font-extrabold text-rose-500">{stats.locked + stats.flagged}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* ممنوعات المرحلة للتذكير السريع */}
      {currentPhaseObj?.contraindications?.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-rose-500/30 bg-rose-500/5 px-4 py-3 text-xs">
          <span className="flex items-center gap-1.5 font-extrabold text-rose-600 dark:text-rose-400">
            <ShieldAlert size={15} /> الممنوعات في هذه المرحلة:
          </span>
          {currentPhaseObj.contraindications.map((c, idx) => (
            <Badge key={idx} tone="rose">
              {c}
            </Badge>
          ))}
        </div>
      )}

      {/* قائمة تمارين جلسة اليوم */}
      <Card>
        <CardHeader
          icon={Dumbbell}
          tone={lightMeta.color}
          title={`تمارين جلسة اليوم — المرحلة ${phaseIdx + 1}: ${currentPhaseObj?.title}`}
          subtitle="حدّد التمارين المنفذة وعدّل المجموعات أو الأوزان بسهولة"
          action={
            <div className="no-print flex flex-wrap items-center gap-2">
              <Button variant="secondary" size="sm" icon={Plus} onClick={() => setShowAddEx((v) => !v)}>
                إضافة تمرين
              </Button>
              <Button
                variant="outline"
                size="sm"
                icon={BookmarkCheck}
                onClick={handleSaveAsPhaseDefault}
                title="حفظ التمارين الحالية كافتراضي لهذه المرحلة"
              >
                حفظ للمرحلة
              </Button>
              <Button variant="ghost" size="sm" icon={Printer} onClick={() => window.print()}>
                طباعة
              </Button>
            </div>
          }
        />

        {showAddEx && (
          <div className="no-print border-b border-slate-100 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-950/50">
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
              <div className="flex gap-2">
                <Select value={selectedExId} onChange={(e) => setSelectedExId(e.target.value)}>
                  {Object.entries(SECTIONS).map(([secKey, sec]) => (
                    <optgroup key={secKey} label={sec.label}>
                      {allLibrary
                        .filter((e) => e.section === secKey)
                        .map((ex) => (
                          <option key={ex.id} value={ex.id}>
                            {ex.name} ({ex.sets}×{ex.reps})
                          </option>
                        ))}
                    </optgroup>
                  ))}
                </Select>
                <Button size="sm" icon={Plus} onClick={handleAddLibraryExercise}>
                  إضافة من المكتبة
                </Button>
              </div>

              <div className="flex flex-wrap gap-2">
                <Input
                  placeholder="أو اكتب اسم تمرين جديد..."
                  value={customExName}
                  onChange={(e) => setCustomExName(e.target.value)}
                  className="flex-1"
                />
                <Button size="sm" variant="secondary" icon={Plus} onClick={handleAddCustomExercise}>
                  إضافة تمرين مخصص
                </Button>
              </div>
            </div>
          </div>
        )}

        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {grouped.map(([secKey, secItems]) => {
            const sec = SECTIONS[secKey] || SECTIONS.strength;
            return (
              <div key={secKey} className="p-4 sm:p-5">
                <div className="mb-3 flex items-center justify-between">
                  <Badge tone={sec.color}>{sec.label}</Badge>
                  <span className="text-xs text-slate-400">{secItems.length} تمارين</span>
                </div>

                <div className="space-y-2">
                  {secItems.map((it) => {
                    const isLocked = it.status === 'locked';
                    const isFlagged = it.status === 'flagged';
                    const isSuspended = it.status === 'suspended';

                    return (
                      <div
                        key={it.uid}
                        className={cx(
                          'flex flex-col gap-3 rounded-2xl border p-3.5 transition sm:flex-row sm:items-center sm:justify-between',
                          isLocked
                            ? 'border-rose-500/30 bg-rose-500/5 opacity-70'
                            : isFlagged
                              ? 'border-amber-500/40 bg-amber-500/5'
                              : isSuspended
                                ? 'border-slate-200 bg-slate-50/60 opacity-65 dark:border-slate-800 dark:bg-slate-950/40'
                                : it.done
                                  ? 'border-emerald-500/30 bg-emerald-500/5'
                                  : 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/40'
                        )}
                      >
                        <div className="flex items-start gap-3">
                          {isLocked ? (
                            <div
                              className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-lg bg-rose-500/20 text-rose-500"
                              title="مقفل لحماية المفصل"
                            >
                              <Lock size={14} />
                            </div>
                          ) : (
                            <input
                              type="checkbox"
                              checked={!!(it.included && it.done)}
                              onChange={(e) =>
                                updateItem(it.uid, {
                                  included: true,
                                  status: 'active',
                                  done: e.target.checked,
                                })
                              }
                              className="mt-1 h-5 w-5 cursor-pointer rounded accent-emerald-500"
                            />
                          )}

                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <span
                                className={cx(
                                  'font-bold text-slate-900 dark:text-white',
                                  isLocked && 'line-through opacity-75'
                                )}
                              >
                                {it.name}
                              </span>
                              {it.recovery && <Badge tone="indigo">استشفاء وتصريف</Badge>}
                              {it.volumeReduced && (
                                <Badge tone="amber">خُفّض 30% (كان {it.plannedSets})</Badge>
                              )}
                            </div>

                            {it.cue && (
                              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">💡 {it.cue}</p>
                            )}
                            {it.flagReason && (
                              <p
                                className={cx(
                                  'mt-1 text-xs font-semibold',
                                  isLocked ? 'text-rose-500' : 'text-amber-600 dark:text-amber-400'
                                )}
                              >
                                ⚠ {it.flagReason}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* التحكم السريع في المجموعات والتكرار والحمل */}
                        <div className="flex flex-wrap items-center gap-2">
                          {isLocked || isFlagged || isSuspended ? (
                            <Button
                              size="sm"
                              variant="secondary"
                              icon={Unlock}
                              onClick={() =>
                                updateItem(it.uid, {
                                  status: 'active',
                                  included: true,
                                  done: true,
                                  flagReason: '',
                                })
                              }
                            >
                              تفعيل التمرين
                            </Button>
                          ) : (
                            <>
                              <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-2.5 py-1 text-xs dark:border-slate-700 dark:bg-slate-900">
                                <span className="text-slate-400">مجموعات:</span>
                                <input
                                  type="number"
                                  min="1"
                                  max="15"
                                  value={it.sets}
                                  onChange={(e) => updateItem(it.uid, { sets: Number(e.target.value) })}
                                  className="w-9 bg-transparent text-center font-bold outline-none"
                                />
                              </div>

                              <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-2.5 py-1 text-xs dark:border-slate-700 dark:bg-slate-900">
                                <span className="text-slate-400">التكرار:</span>
                                <input
                                  type="text"
                                  value={it.reps}
                                  onChange={(e) => updateItem(it.uid, { reps: e.target.value })}
                                  className="w-16 bg-transparent text-center font-bold outline-none"
                                />
                              </div>

                              <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-2.5 py-1 text-xs dark:border-slate-700 dark:bg-slate-900">
                                <span className="text-slate-400">الحمل:</span>
                                <input
                                  type="text"
                                  value={it.load}
                                  onChange={(e) => updateItem(it.uid, { load: e.target.value })}
                                  className="w-24 bg-transparent text-center font-bold outline-none"
                                />
                              </div>
                            </>
                          )}

                          <button
                            type="button"
                            onClick={() => removeItem(it.uid)}
                            className="no-print rounded-lg p-1.5 text-slate-400 hover:bg-rose-500/10 hover:text-rose-500"
                            title="حذف"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* حفظ الجلسة */}
        <div className="border-t border-slate-100 bg-slate-50/70 p-5 dark:border-slate-800 dark:bg-slate-950/50">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:items-end">
            <div className="lg:col-span-8">
              <Field label="ملاحظات الجلسة (اختياري)">
                <Textarea
                  rows={2}
                  placeholder="سجل أي ملاحظات حول أداء المريض أو استجابته اليوم..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </Field>
            </div>
            <div className="flex flex-col gap-2 lg:col-span-4">
              <ProgressBar value={stats.completion} tone={lightMeta.color} showLabel />
              <Button size="lg" icon={Save} onClick={handleSaveSession} className="w-full">
                حفظ الجلسة في سجل المريض
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
