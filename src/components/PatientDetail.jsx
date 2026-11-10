import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Award,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Dumbbell,
  Edit3,
  FileText,
  Flame,
  Lock,
  Play,
  RotateCcw,
  ShieldAlert,
  Sparkles,
  Trash2,
  TrendingUp,
  Unlock,
} from 'lucide-react';
import {
  Card,
  CardHeader,
  Badge,
  Button,
  ProgressBar,
  PhaseStepper,
  Tabs,
  Avatar,
  LightDot,
  ConfirmModal,
  EmptyState,
  LIGHT_TONE,
  cx,
} from './ui';
import { SymptomTrendChart, RomChart, RingProgress } from './charts';
import { CATEGORIES, REGIONS, TISSUES, PHASE_TITLES } from '../data/injuries';
import { resolveExercise } from '../data/exercises';
import {
  STATUS,
  getPatientProtocol,
  timeline,
  phaseProgress,
  sortedSessions,
  formatWeeks,
} from '../lib/protocol';
import { EFFUSION_LEVELS, LIGHTS } from '../lib/engine';
import { formatDate } from '../lib/dates';
import { UnitGenerator } from './UnitGenerator';
import { useApp } from '../store/AppContext';

export function PatientDetail({
  patient,
  initialTab = 'overview',
  onBack,
  onEditPatient,
  onEditProtocol,
}) {
  const { state, dispatch, toast } = useApp();
  const [tab, setTab] = useState(initialTab);
  const [expandedSessionId, setExpandedSessionId] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const { injury } = useMemo(() => getPatientProtocol(state, patient), [state, patient]);
  const tl = useMemo(() => timeline(patient, injury), [patient, injury]);
  const pp = useMemo(() => phaseProgress(patient, injury), [patient, injury]);
  const sessionsAsc = useMemo(() => sortedSessions(patient, 'asc'), [patient]);
  const sessionsDesc = useMemo(() => sortedSessions(patient, 'desc'), [patient]);

  if (!patient || !injury) return null;

  const phaseIdx = Math.max(0, (patient.currentPhase || 1) - 1);
  const currentPhaseObj = injury.phases[phaseIdx] || injury.phases[0];
  const checkedCriteria = patient.criteria?.[phaseIdx] || [];
  const totalPhases = injury.phases.length;
  const statusMeta = STATUS[patient.status] || STATUS.conservative;
  const catMeta = CATEGORIES[patient.tissue] || CATEGORIES.ligament;

  const handleToggleCriterion = (index) => {
    dispatch({ type: 'TOGGLE_CRITERION', id: patient.id, phaseIdx, index });
  };

  const handlePromote = () => {
    dispatch({ type: 'PROMOTE_PHASE', id: patient.id, totalPhases });
    if (patient.currentPhase >= totalPhases) {
      toast('🎉 أتم المريض جميع المراحل التأهيلية بنجاح');
    } else {
      toast(`تمت ترقية المريض إلى المرحلة ${patient.currentPhase + 1}`);
    }
  };

  const handleDemote = () => {
    dispatch({ type: 'DEMOTE_PHASE', id: patient.id });
    toast('تمت إعادة المريض للمرحلة السابقة', 'info');
  };

  return (
    <div className="space-y-5">
      {/* شريط علوي بسيط للرجوع والإجراءات */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 rounded-xl bg-white px-3.5 py-2 text-sm font-bold text-slate-700 shadow-sm ring-1 ring-slate-200 transition hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-200 dark:ring-slate-800"
        >
          <ArrowRight size={17} />
          رجوع
        </button>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant={tab === 'generator' ? 'secondary' : 'primary'}
            icon={Play}
            onClick={() => setTab(tab === 'generator' ? 'overview' : 'generator')}
          >
            {tab === 'generator' ? 'عرض ملف المتابعة' : 'بدء جلسة اليوم'}
          </Button>
          <Button variant="secondary" size="sm" icon={Edit3} onClick={() => onEditPatient?.(patient)}>
            تعديل البيانات
          </Button>
          <Button variant="outline" size="sm" icon={FileText} onClick={() => onEditProtocol?.(injury)}>
            تعديل البروتوكول
          </Button>
          <Button variant="danger" size="sm" icon={Trash2} onClick={() => setConfirmDelete(true)}>
            حذف
          </Button>
        </div>
      </div>

      {/* بطاقة ملخص المريض — واضحة ومريحة للعين */}
      <Card className="p-5">
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-12 lg:items-center">
          <div className="space-y-3 lg:col-span-7">
            <div className="flex items-start gap-3.5">
              <Avatar name={patient.name} size="lg" />
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-xl font-extrabold text-slate-900 dark:text-white">{patient.name}</h1>
                  <Badge tone={statusMeta.color}>{statusMeta.short}</Badge>
                  <Badge tone={catMeta.color}>{TISSUES[patient.tissue]}</Badge>
                  <Badge tone="sky">{REGIONS[patient.region]}</Badge>
                </div>
                <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{patient.diagnosis}</p>
                <p className="text-xs text-slate-500">
                  {patient.age} سنة • {patient.weight} كجم {patient.sport ? `• ${patient.sport}` : ''}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 rounded-2xl bg-slate-50 p-3 text-xs dark:bg-slate-950/60">
              <div>
                <p className="text-[11px] text-slate-400">الأسبوع الحالي</p>
                <p className="mt-0.5 font-extrabold text-emerald-600 dark:text-emerald-400">{tl.label}</p>
              </div>
              <div>
                <p className="text-[11px] text-slate-400">تاريخ الإصابة</p>
                <p className="mt-0.5 font-bold">{formatDate(patient.injuryDate)}</p>
              </div>
              <div>
                <p className="text-[11px] text-slate-400">الجلسات المنفذة</p>
                <p className="mt-0.5 font-bold">{sessionsAsc.length} جلسات</p>
              </div>
            </div>
          </div>

          {/* تقدم المرحلة الحالية */}
          <div className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 lg:col-span-5 dark:border-slate-800 dark:bg-slate-950/50">
            <div className="flex-1 space-y-2">
              <Badge tone="emerald">
                المرحلة {patient.currentPhase} من {totalPhases}
              </Badge>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                {currentPhaseObj?.title}
              </h3>
              <PhaseStepper
                total={totalPhases}
                current={patient.currentPhase}
                discharged={patient.discharged}
              />
              <p className="text-xs text-slate-500">
                شروط الترقية المحققة: <b>{pp.criteriaDone} من {pp.criteriaTotal}</b>
              </p>
            </div>

            <RingProgress value={pp.percent} size={78} stroke={8} color="#10b981">
              <span className="text-base font-extrabold text-slate-900 dark:text-white">{pp.percent}%</span>
            </RingProgress>
          </div>
        </div>

        {patient.notes && (
          <div className="mt-4 rounded-xl bg-amber-500/10 px-4 py-2.5 text-xs text-slate-700 dark:text-slate-200">
            <b className="text-amber-600 dark:text-amber-400">ملاحظة هامة: </b>
            {patient.notes}
          </div>
        )}
      </Card>

      {/* تبويبات بسيطة وواضحة */}
      <Tabs
        value={tab}
        onChange={setTab}
        tabs={[
          { value: 'overview', label: 'متابعة الحالة وشروط الترقية', icon: TrendingUp },
          { value: 'generator', label: 'جلسة اليوم', icon: Sparkles },
          { value: 'protocol', label: 'مراحل البروتوكول', icon: Dumbbell, count: totalPhases },
        ]}
      />

      {tab === 'overview' && (
        <div className="space-y-5">
          {/* شروط الانتقال + الممنوعات */}
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
            <Card className="lg:col-span-7">
              <CardHeader
                icon={CheckCircle2}
                tone="emerald"
                title={`شروط الانتقال للمرحلة القادمة (المرحلة ${patient.currentPhase})`}
                subtitle="ضع علامة ✓ عند تحقق كل شرط لفتح الترقية للمرحلة التالية"
                action={
                  <Badge tone={pp.allMet ? 'emerald' : 'amber'}>
                    {pp.criteriaDone} / {pp.criteriaTotal}
                  </Badge>
                }
              />

              <div className="space-y-3 p-5">
                {(currentPhaseObj?.criteria || []).map((crit, idx) => {
                  const done = checkedCriteria.includes(idx);
                  return (
                    <label
                      key={idx}
                      onClick={() => handleToggleCriterion(idx)}
                      className={cx(
                        'flex cursor-pointer items-center justify-between gap-3 rounded-xl border p-3 transition',
                        done
                          ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-900 dark:text-emerald-200'
                          : 'border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/50'
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={done}
                          onChange={() => {}}
                          className="h-5 w-5 rounded accent-emerald-500"
                        />
                        <span className="text-sm font-semibold">{crit}</span>
                      </div>
                      <Badge tone={done ? 'emerald' : 'slate'}>{done ? 'مكتمل ✓' : 'قيد المتابعة'}</Badge>
                    </label>
                  );
                })}

                <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-slate-50 p-3.5 pt-3 dark:bg-slate-950/50">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                    {pp.allMet
                      ? '🎉 جميع الشروط مكتملة — المريض جاهز للترقية!'
                      : `يتبقى ${pp.criteriaTotal - pp.criteriaDone} شروط للترقية للمرحلة التالية`}
                  </span>

                  <div className="flex items-center gap-2">
                    {patient.currentPhase > 1 && (
                      <Button variant="ghost" size="sm" icon={RotateCcw} onClick={handleDemote}>
                        المرحلة السابقة
                      </Button>
                    )}
                    <Button
                      variant={pp.allMet ? 'primary' : 'secondary'}
                      size="sm"
                      icon={pp.allMet ? Award : Lock}
                      disabled={!pp.allMet || patient.discharged}
                      onClick={handlePromote}
                    >
                      {patient.discharged
                        ? 'مكتمل'
                        : patient.currentPhase >= totalPhases
                          ? 'اعتماد التخرج'
                          : `ترقية للمرحلة ${patient.currentPhase + 1}`}
                    </Button>
                    {!pp.allMet && !patient.discharged && (
                      <Button
                        variant="outline"
                        size="sm"
                        icon={Unlock}
                        onClick={handlePromote}
                        title="ترقية بقرار الأخصائي"
                      >
                        ترقية يدوية
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </Card>

            <Card className="lg:col-span-5">
              <CardHeader
                icon={ShieldAlert}
                tone="rose"
                title={`الممنوعات في المرحلة ${patient.currentPhase}`}
                subtitle="محظورات يجب تجنبها لحماية الأنسجة"
              />
              <div className="space-y-2 p-5">
                {(currentPhaseObj?.contraindications || []).map((c, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2.5 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3.5 py-2.5 text-xs font-bold text-rose-700 dark:text-rose-200"
                  >
                    <ShieldAlert size={15} className="shrink-0 text-rose-500" />
                    <span>{c}</span>
                  </div>
                ))}

                {injury.redFlags?.length > 0 && (
                  <div className="mt-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs">
                    <p className="mb-1 flex items-center gap-1.5 font-extrabold text-amber-700 dark:text-amber-300">
                      <AlertTriangle size={14} /> علامات تحذيرية:
                    </p>
                    <ul className="list-inside list-disc space-y-1 text-amber-800 dark:text-amber-200">
                      {injury.redFlags.map((rf, i) => (
                        <li key={i}>{rf}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* الرسوم البيانية لتطور الألم والمدى الحركي */}
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
            <Card className="lg:col-span-7">
              <CardHeader
                icon={Flame}
                tone="rose"
                title="تطور الألم والتورم عبر الجلسات"
              />
              <div className="p-5">
                <SymptomTrendChart
                  sessions={sessionsAsc}
                  showNerve={!!injury.neuro || patient.tissue === 'nerve'}
                />
              </div>
            </Card>

            <Card className="lg:col-span-5">
              <CardHeader
                icon={TrendingUp}
                tone="sky"
                title={`تطور ${injury.rom?.label || 'المدى الحركي'}`}
                subtitle={`الهدف: ${injury.rom?.target ?? 120}${injury.rom?.unit || '°'}`}
              />
              <div className="p-5">
                <RomChart
                  sessions={sessionsAsc}
                  target={injury.rom?.target}
                  unit={injury.rom?.unit || '°'}
                  inverted={injury.rom?.unit === 'سم'}
                  height={200}
                />
              </div>
            </Card>
          </div>

          {/* سجل الجلسات السابقة */}
          <Card>
            <CardHeader
              icon={Clock}
              tone="violet"
              title="سجل الجلسات السابقة"
              action={
                <Button size="sm" icon={Play} onClick={() => setTab('generator')}>
                  جلسة جديدة
                </Button>
              }
            />

            {sessionsDesc.length === 0 ? (
              <EmptyState
                icon={Calendar}
                title="لا توجد جلسات مسجلة بعد"
                action={
                  <Button icon={Play} onClick={() => setTab('generator')}>
                    بدء أول جلسة
                  </Button>
                }
              />
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {sessionsDesc.map((s) => {
                  const open = expandedSessionId === s.id;
                  const activeEx = (s.exercises || []).filter((e) => e.included && e.status !== 'locked');
                  const doneEx = activeEx.filter((e) => e.done);

                  return (
                    <div key={s.id} className="p-4 sm:p-5">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <div className="mt-1">
                            <LightDot light={s.light} size={12} />
                          </div>
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-extrabold text-slate-900 dark:text-white">
                                {formatDate(s.date, { withDay: true })}
                              </span>
                              <Badge tone={LIGHT_TONE[s.light] || 'emerald'}>
                                {LIGHTS[s.light]?.label}
                              </Badge>
                              <Badge tone="slate">المرحلة {s.phase || 1}</Badge>
                            </div>

                            <div className="mt-1 flex flex-wrap items-center gap-4 text-xs text-slate-600 dark:text-slate-300">
                              <span>الألم: <b className="text-rose-500">{s.pain}/10</b></span>
                              <span>التورم: <b className="text-sky-500">{EFFUSION_LEVELS[s.effusion]?.label}</b></span>
                              {s.rom !== undefined && s.rom !== null && (
                                <span>المدى: <b>{s.rom}{injury.rom?.unit || '°'}</b></span>
                              )}
                              <span>التمارين: <b className="text-emerald-600 dark:text-emerald-400">{doneEx.length}/{activeEx.length}</b></span>
                            </div>

                            {s.notes && (
                              <p className="mt-2 rounded-xl bg-slate-100/80 px-3 py-2 text-xs text-slate-700 dark:bg-slate-950/60 dark:text-slate-300">
                                {s.notes}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="secondary"
                            icon={open ? ChevronUp : ChevronDown}
                            onClick={() => setExpandedSessionId(open ? null : s.id)}
                          >
                            {open ? 'إخفاء' : `التمارين (${doneEx.length})`}
                          </Button>
                          <button
                            type="button"
                            onClick={() => {
                              dispatch({ type: 'DELETE_SESSION', id: patient.id, sessionId: s.id });
                              toast('تم حذف الجلسة', 'info');
                            }}
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-500/10 hover:text-rose-500"
                            title="حذف"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>

                      {open && (
                        <div className="mt-3 grid grid-cols-1 gap-2 rounded-xl bg-slate-50 p-3 sm:grid-cols-2 lg:grid-cols-3 dark:bg-slate-950/50">
                          {(s.exercises || []).map((ex, i) => (
                            <div
                              key={i}
                              className={cx(
                                'flex items-center justify-between rounded-lg border px-3 py-2 text-xs',
                                ex.status === 'locked'
                                  ? 'border-rose-500/30 bg-rose-500/5 text-rose-500 line-through'
                                  : ex.done
                                    ? 'border-emerald-500/30 bg-white dark:bg-slate-900'
                                    : 'border-slate-200 bg-white/50 opacity-60 dark:border-slate-800'
                              )}
                            >
                              <div className="truncate">
                                <p className="truncate font-bold">{ex.name}</p>
                                <p className="text-[11px] text-slate-400">
                                  {ex.sets} × {ex.reps} • {ex.load}
                                </p>
                              </div>
                              <Badge tone={ex.status === 'locked' ? 'rose' : ex.done ? 'emerald' : 'slate'}>
                                {ex.status === 'locked' ? 'مقفل' : ex.done ? 'تم ✓' : 'مؤجل'}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>
      )}

      {tab === 'generator' && (
        <UnitGenerator
          patient={patient}
          onSessionSaved={() => setTab('overview')}
        />
      )}

      {tab === 'protocol' && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {injury.phases.map((p, idx) => {
            const isCurrent = patient.currentPhase === idx + 1;
            const checked = patient.criteria?.[idx] || [];

            return (
              <Card
                key={idx}
                className={cx('p-5', isCurrent && 'ring-2 ring-emerald-500/60')}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge tone={isCurrent ? 'emerald' : 'slate'}>المرحلة {idx + 1}</Badge>
                      <span className="text-xs text-slate-400">{formatWeeks(p.weeks)}</span>
                      {isCurrent && <Badge tone="emerald">الحالية</Badge>}
                    </div>
                    <h4 className="mt-1 text-base font-extrabold text-slate-900 dark:text-white">
                      {p.title || PHASE_TITLES[idx]}
                    </h4>
                  </div>
                  {!isCurrent && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        dispatch({
                          type: 'UPDATE_PATIENT',
                          id: patient.id,
                          patch: { currentPhase: idx + 1, discharged: false },
                        });
                        toast(`تم نقل المريض إلى المرحلة ${idx + 1}`);
                      }}
                    >
                      تفعيل هذه المرحلة
                    </Button>
                  )}
                </div>

                <div className="mt-4 space-y-3 text-xs">
                  <div>
                    <p className="mb-1 font-bold text-rose-600 dark:text-rose-400">الممنوعات:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {p.contraindications.map((c, i) => (
                        <Badge key={i} tone="rose">
                          {c}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="mb-1 font-bold text-emerald-600 dark:text-emerald-400">شروط الترقية:</p>
                    <ul className="space-y-1">
                      {p.criteria.map((c, i) => (
                        <li key={i} className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={checked.includes(i)}
                            onChange={() =>
                              dispatch({ type: 'TOGGLE_CRITERION', id: patient.id, phaseIdx: idx, index: i })
                            }
                            className="rounded accent-emerald-500"
                          />
                          <span>{c}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <p className="mb-1.5 font-bold text-slate-700 dark:text-slate-300">
                      التمارين ({p.exercises.length}):
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {p.exercises.map((ref, i) => {
                        const ex = resolveExercise(ref);
                        if (!ex) return null;
                        return (
                          <span
                            key={i}
                            className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 dark:border-slate-800 dark:bg-slate-950"
                          >
                            {ex.name} ({ex.sets}×{ex.reps})
                          </span>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <ConfirmModal
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title="حذف ملف المريض"
        message={`هل أنت متأكد من حذف ملف "${patient.name}"؟`}
        confirmText="نعم، حذف"
        onConfirm={() => {
          dispatch({ type: 'DELETE_PATIENT', id: patient.id });
          toast('تم حذف ملف المريض', 'info');
          onBack?.();
        }}
      />
    </div>
  );
}
