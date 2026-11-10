import { useMemo, useState } from 'react';
import {
  BookOpen,
  CheckCircle2,
  Dumbbell,
  Edit3,
  FilePlus2,
  Search,
  ShieldAlert,
  Sparkles,
  UserPlus,
  AlertTriangle,
  Link2,
  Spline,
  Bone,
  Zap,
  Trash2,
} from 'lucide-react';
import {
  Card,
  CardHeader,
  Badge,
  Button,
  Input,
  Select,
  Tabs,
  EmptyState,
  cx,
} from './ui';
import { CATEGORIES, REGIONS, PHASE_TITLES } from '../data/injuries';
import { SECTIONS, resolveExercise } from '../data/exercises';
import { STATUS, allInjuries, formatWeeks } from '../lib/protocol';
import { useApp } from '../store/AppContext';

const CAT_ICONS = {
  ligament: Link2,
  muscle: Dumbbell,
  tendon: Spline,
  bone: Bone,
  nerve: Zap,
};

export function EncyclopediaView({
  onAssignToNewPatient,
  onEditInjury,
  onCreateCustomInjury,
}) {
  const { state, dispatch, toast } = useApp();
  const injuries = useMemo(() => allInjuries(state), [state]);

  const [category, setCategory] = useState('all');
  const [region, setRegion] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState(injuries[0]?.id || 'acl_recon');
  const [activePhase, setActivePhase] = useState(0);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return injuries.filter((inj) => {
      if (category !== 'all' && inj.category !== category) return false;
      if (region !== 'all' && inj.region !== region) return false;
      if (!q) return true;
      return (
        inj.name.toLowerCase().includes(q) ||
        (inj.en || '').toLowerCase().includes(q) ||
        (inj.summary || '').toLowerCase().includes(q)
      );
    });
  }, [injuries, category, region, search]);

  const selected = useMemo(
    () => filtered.find((i) => i.id === selectedId) || filtered[0] || injuries[0],
    [filtered, selectedId, injuries]
  );

  const phase = selected?.phases?.[activePhase] || selected?.phases?.[0];

  return (
    <div className="space-y-6">
      {/* شريط التصنيفات النسيجية الخمسة */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <button
          type="button"
          onClick={() => setCategory('all')}
          className={cx(
            'flex flex-col justify-between rounded-2xl border p-4 text-right transition',
            category === 'all'
              ? 'border-emerald-500 bg-emerald-500/10 shadow-sm'
              : 'border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900/60'
          )}
        >
          <div className="flex items-center justify-between">
            <BookOpen size={20} className="text-emerald-500" />
            <Badge tone="emerald">{injuries.length}</Badge>
          </div>
          <div className="mt-3">
            <p className="text-sm font-extrabold text-slate-900 dark:text-white">كل الإصابات</p>
            <p className="text-[11px] text-slate-400">الجهاز الحركي الكامل</p>
          </div>
        </button>

        {Object.entries(CATEGORIES).map(([key, cat]) => {
          const Icon = CAT_ICONS[key] || BookOpen;
          const count = injuries.filter((i) => i.category === key).length;
          const active = category === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setCategory(key)}
              className={cx(
                'flex flex-col justify-between rounded-2xl border p-4 text-right transition',
                active
                  ? 'border-emerald-500 bg-emerald-500/10 shadow-sm'
                  : 'border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900/60'
              )}
            >
              <div className="flex items-center justify-between">
                <Icon size={20} className="text-sky-500" />
                <Badge tone={cat.color}>{count}</Badge>
              </div>
              <div className="mt-3">
                <p className="text-sm font-extrabold text-slate-900 dark:text-white">{cat.label}</p>
                <p className="truncate text-[11px] text-slate-400">{cat.en}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* شريط البحث والفلترة وزر إضافة إصابة مخصصة */}
      <Card className="p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-1 flex-wrap items-center gap-2">
            <div className="relative min-w-[240px] flex-1">
              <Search size={16} className="pointer-events-none absolute right-3 top-2.5 text-slate-400" />
              <Input
                placeholder="ابحث عن إصابة بالعربية أو الإنجليزية (ACL, Meniscus, غضروف، رباط، عرق النسا)..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pr-9"
              />
            </div>

            <Select value={region} onChange={(e) => setRegion(e.target.value)} className="w-auto min-w-[170px]">
              <option value="all">كل المناطق التشريحية</option>
              {Object.entries(REGIONS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </Select>
          </div>

          <Button icon={FilePlus2} onClick={onCreateCustomInjury}>
            إضافة إصابة / بروتوكول مخصص
          </Button>
        </div>
      </Card>

      {/* العرض المزدوج: قائمة الإصابات + مستعرض البروتوكول التفصيلي */}
      {filtered.length === 0 ? (
        <Card>
          <EmptyState
            icon={BookOpen}
            title="لا توجد إصابات مطابقة للبحث"
            text="جرّب تغيير التصنيف أو أضف إصابة مخصصة جديدة للموسوعة"
            action={
              <Button icon={FilePlus2} onClick={onCreateCustomInjury}>
                إنشاء إصابة مخصصة
              </Button>
            }
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
          {/* القائمة الجانبية للإصابات */}
          <div className="space-y-2.5 xl:col-span-4">
            {filtered.map((inj) => {
              const isSelected = selected?.id === inj.id;
              const cat = CATEGORIES[inj.category] || CATEGORIES.ligament;
              return (
                <button
                  key={inj.id}
                  type="button"
                  onClick={() => {
                    setSelectedId(inj.id);
                    setActivePhase(0);
                  }}
                  className={cx(
                    'w-full rounded-2xl border p-4 text-right transition',
                    isSelected
                      ? 'border-emerald-500 bg-emerald-500/10 shadow-sm'
                      : 'border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900/60'
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <Badge tone={cat.color}>{cat.label}</Badge>
                        <Badge tone="slate">{REGIONS[inj.region]}</Badge>
                        {inj.custom && <Badge tone="emerald">مخصص</Badge>}
                        {inj.edited && <Badge tone="amber">معدّل</Badge>}
                      </div>
                      <h4 className="mt-1.5 font-extrabold text-slate-900 dark:text-white">{inj.name}</h4>
                      <p className="text-xs text-slate-400">{inj.en}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* تفاصيل البروتوكول الكامل للإصابة المختارة */}
          {selected && (
            <div className="space-y-6 xl:col-span-8">
              <Card className="p-6">
                <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 pb-5 dark:border-slate-800">
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone={CATEGORIES[selected.category]?.color || 'emerald'}>
                        {CATEGORIES[selected.category]?.label}
                      </Badge>
                      <Badge tone="sky">{REGIONS[selected.region]}</Badge>
                      {(selected.management || []).map((m) => (
                        <Badge key={m} tone={STATUS[m]?.color || 'slate'}>
                          {STATUS[m]?.label || m}
                        </Badge>
                      ))}
                      {selected.neuro && <Badge tone="violet">مراقبة عصبية نشطة</Badge>}
                    </div>
                    <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">{selected.name}</h2>
                    <p className="text-sm font-semibold text-slate-400">{selected.en}</p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      icon={UserPlus}
                      onClick={() => onAssignToNewPatient?.(selected.id)}
                    >
                      تعيين لمريض جديد
                    </Button>
                    <Button
                      variant="secondary"
                      icon={Edit3}
                      onClick={() => onEditInjury?.(selected)}
                    >
                      تعديل البروتوكول
                    </Button>
                    {selected.custom && (
                      <Button
                        variant="danger"
                        icon={Trash2}
                        onClick={() => {
                          dispatch({ type: 'DELETE_CUSTOM_INJURY', id: selected.id });
                          toast('تم حذف الإصابة المخصصة', 'info');
                        }}
                      >
                        حذف
                      </Button>
                    )}
                  </div>
                </div>

                <p className="mt-4 text-sm leading-7 text-slate-600 dark:text-slate-300">{selected.summary}</p>

                {/* Pearls & Red Flags */}
                <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                  {selected.pearls?.length > 0 && (
                    <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-3.5 text-xs">
                      <p className="mb-1.5 flex items-center gap-1.5 font-extrabold text-emerald-700 dark:text-emerald-300">
                        <Sparkles size={14} /> نقاط إكلينيكية ذهبية (Clinical Pearls):
                      </p>
                      <ul className="list-inside list-disc space-y-1 text-slate-700 dark:text-slate-300">
                        {selected.pearls.map((p, i) => (
                          <li key={i}>{p}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {selected.redFlags?.length > 0 && (
                    <div className="rounded-2xl border border-rose-500/30 bg-rose-500/5 p-3.5 text-xs">
                      <p className="mb-1.5 flex items-center gap-1.5 font-extrabold text-rose-600 dark:text-rose-400">
                        <AlertTriangle size={14} /> علامات الخطر (Red Flags):
                      </p>
                      <ul className="list-inside list-disc space-y-1 text-rose-700 dark:text-rose-300">
                        {selected.redFlags.map((rf, i) => (
                          <li key={i}>{rf}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* تبويبات المراحل الأربعة */}
                <div className="mt-6">
                  <Tabs
                    value={activePhase}
                    onChange={setActivePhase}
                    tabs={selected.phases.map((p, idx) => ({
                      value: idx,
                      label: `المرحلة ${idx + 1}: ${p.title || PHASE_TITLES[idx]}`,
                      count: p.exercises?.length || 0,
                    }))}
                  />

                  {phase && (
                    <div className="mt-5 space-y-5">
                      {/* رأس المرحلة */}
                      <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-slate-50 p-4 dark:bg-slate-950/60">
                        <div>
                          <div className="flex items-center gap-2">
                            <Badge tone="emerald">المرحلة {activePhase + 1} من 4</Badge>
                            <Badge tone="sky">المدة التقديرية: {formatWeeks(phase.weeks)}</Badge>
                          </div>
                          <h3 className="mt-1 text-lg font-extrabold text-slate-900 dark:text-white">
                            {phase.title || PHASE_TITLES[activePhase]}
                          </h3>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {(phase.goals || []).map((g, i) => (
                            <Badge key={i} tone="teal">
                              🎯 {g}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      {/* الممنوعات وشروط الترقية */}
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div className="rounded-2xl border border-rose-500/30 bg-rose-500/5 p-4">
                          <h4 className="mb-2.5 flex items-center gap-2 text-sm font-extrabold text-rose-600 dark:text-rose-400">
                            <ShieldAlert size={16} /> الممنوعات الصارمة (Strict Contraindications)
                          </h4>
                          <ul className="space-y-2 text-xs font-semibold text-rose-800 dark:text-rose-200">
                            {phase.contraindications.map((c, i) => (
                              <li key={i} className="flex items-start gap-2">
                                <span className="mt-0.5 text-rose-500">⛔</span>
                                <span>{c}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-4">
                          <h4 className="mb-2.5 flex items-center gap-2 text-sm font-extrabold text-emerald-700 dark:text-emerald-300">
                            <CheckCircle2 size={16} /> شروط الترقية للمرحلة التالية (Gatekeeper Criteria)
                          </h4>
                          <ul className="space-y-2 text-xs font-semibold text-emerald-900 dark:text-emerald-200">
                            {phase.criteria.map((c, i) => (
                              <li key={i} className="flex items-start gap-2">
                                <span className="mt-0.5 text-emerald-500">✓</span>
                                <span>{c}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      {/* التمارين المخصصة للمرحلة */}
                      <div>
                        <h4 className="mb-3 flex items-center gap-2 text-sm font-extrabold text-slate-800 dark:text-slate-100">
                          <Dumbbell size={16} className="text-emerald-500" />
                          التمارين العلاجية المعتمدة في المرحلة {activePhase + 1} ({phase.exercises.length} تمرين)
                        </h4>
                        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                          {phase.exercises.map((ref, idx) => {
                            const ex = resolveExercise(ref);
                            if (!ex) return null;
                            const sec = SECTIONS[ex.section] || SECTIONS.strength;
                            return (
                              <div
                                key={idx}
                                className="flex items-start justify-between gap-2 rounded-2xl border border-slate-200 bg-white p-3.5 dark:border-slate-800 dark:bg-slate-900/50"
                              >
                                <div>
                                  <div className="flex flex-wrap items-center gap-1.5">
                                    <Badge tone={sec.color}>{sec.label}</Badge>
                                    {ex.iso && <Badge tone="teal">Isometric</Badge>}
                                    {ex.impact && <Badge tone="rose">صدمات</Badge>}
                                    {ex.heavy && <Badge tone="amber">حمل عالٍ</Badge>}
                                  </div>
                                  <p className="mt-1 font-bold text-slate-900 dark:text-white">{ex.name}</p>
                                  <p className="text-[11px] text-slate-400">{ex.en}</p>
                                  {ex.cue && <p className="mt-1 text-[11px] text-emerald-600 dark:text-emerald-400">💡 {ex.cue}</p>}
                                </div>
                                <div className="shrink-0 text-left text-xs">
                                  <p className="font-extrabold text-slate-800 dark:text-slate-200">
                                    {ex.sets} × {ex.reps}
                                  </p>
                                  <p className="text-[11px] text-slate-400">{ex.load}</p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
