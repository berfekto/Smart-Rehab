import { useEffect, useMemo, useState } from 'react';
import { FilePlus2, Plus, Trash2, Check, Search, RotateCcw, ShieldAlert, CheckCircle2, Dumbbell } from 'lucide-react';
import { Modal, Field, Input, Select, Textarea, Button, Badge, Tabs } from './ui';
import { CATEGORIES, REGIONS, PHASE_TITLES } from '../data/injuries';
import { EXERCISE_LIST, SECTIONS, resolveExercise } from '../data/exercises';
import { newId } from '../lib/protocol';
import { useApp } from '../store/AppContext';

function makeEmptyInjury() {
  return {
    id: newId('inj_custom'),
    name: '',
    en: '',
    category: 'ligament',
    region: 'knee',
    management: ['conservative', 'postop'],
    neuro: false,
    summary: '',
    pearls: ['التدرج في الأحمال وفق استجابة الألم والارتشاح خلال 24 ساعة'],
    redFlags: ['ألم ليلي متزايد أو أعراض عصبية حادة'],
    rom: { label: 'المدى الحركي الوظيفي', target: 120 },
    phases: [
      {
        title: PHASE_TITLES[0],
        weeks: [0, 2],
        goals: ['السيطرة على الألم والارتشاح', 'حماية الأنسجة الملتئمة'],
        contraindications: ['ممنوع التحميل العنيف أو الصدمات', 'ممنوع الإطالة المؤلمة'],
        criteria: ['ألم ≤ 3/10 في الأنشطة اليومية', 'عدم وجود ارتشاح متزايد'],
        exercises: ['quad_sets', 'ankle_pumps', 'cryo', 'elevation'],
      },
      {
        title: PHASE_TITLES[1],
        weeks: [2, 6],
        goals: ['استعادة المدى الحركي الكامل', 'بدء التحميل المبكر المحمي'],
        contraindications: ['ممنوع الجري والقفز'],
        criteria: ['مدى حركي ≥ 85% من الجهة السليمة', 'توازن على رجل واحدة > 30 ثانية'],
        exercises: ['bike_easy', 'mini_squat', 'bridge', 'sl_balance'],
      },
      {
        title: PHASE_TITLES[2],
        weeks: [6, 12],
        goals: ['استعادة القوة العضلية ≥ 80%', 'التحكم العصبي العضلي الديناميكي'],
        contraindications: ['ممنوع الرياضات التنافسية قبل استيفاء القوة'],
        criteria: ['قوة العضلات LSI ≥ 80%', 'جري خفيف 15 دقيقة بدون ألم أو ارتشاح'],
        exercises: ['bike_mod', 'leg_press', 'split_squat', 'rdl', 'y_balance', 'jog_tread'],
      },
      {
        title: PHASE_TITLES[3],
        weeks: [12, 20],
        goals: ['قوة وقفز LSI ≥ 90%', 'العودة الآمنة للرياضة والوقاية من التكرار'],
        contraindications: ['ممنوع اللعب التنافسي الكامل قبل اجتياز اختبارات العودة'],
        criteria: ['قوة وقفز LSI ≥ 90%', 'إكمال أسبوعين تدريب كامل بدون أعراض'],
        exercises: ['dyn_warmup', 'back_squat', 'sl_hop', 'agility_ladder', 'cutting', 'sport_specific'],
      },
    ],
  };
}

export function CustomProtocolModal({ open, onClose, initialInjury = null, onSaved }) {
  const { state, dispatch, toast } = useApp();
  const [draft, setDraft] = useState(makeEmptyInjury);
  const [activePhase, setActivePhase] = useState(0);
  const [exSearch, setExSearch] = useState('');
  const [exSectionFilter, setExSectionFilter] = useState('all');
  const [newExName, setNewExName] = useState('');
  const [newExSection, setNewExSection] = useState('strength');
  const [newExSets, setNewExSets] = useState(3);
  const [newExReps, setNewExReps] = useState('12');

  const isEditingBuiltin = Boolean(initialInjury && !initialInjury.custom);

  useEffect(() => {
    if (!open) return;
    if (initialInjury) {
      setDraft(JSON.parse(JSON.stringify(initialInjury)));
    } else {
      setDraft(makeEmptyInjury());
    }
    setActivePhase(0);
  }, [open, initialInjury]);

  const allLibraryExercises = useMemo(
    () => [...EXERCISE_LIST, ...(state.customExercises || [])],
    [state.customExercises]
  );

  const setField = (k, v) => setDraft((d) => ({ ...d, [k]: v }));

  const updatePhase = (idx, fn) => {
    setDraft((d) => ({
      ...d,
      phases: d.phases.map((p, i) => (i === idx ? fn(p) : p)),
    }));
  };

  const addListItem = (idx, key, text) => {
    if (!text.trim()) return;
    updatePhase(idx, (p) => ({ ...p, [key]: [...(p[key] || []), text.trim()] }));
  };

  const removeListItem = (idx, key, itemIdx) => {
    updatePhase(idx, (p) => ({ ...p, [key]: p[key].filter((_, i) => i !== itemIdx) }));
  };

  const toggleExerciseInPhase = (idx, exId) => {
    updatePhase(idx, (p) => {
      const exists = p.exercises.some((e) => (typeof e === 'string' ? e === exId : e.id === exId));
      return {
        ...p,
        exercises: exists
          ? p.exercises.filter((e) => (typeof e === 'string' ? e !== exId : e.id !== exId))
          : [...p.exercises, exId],
      };
    });
  };

  const handleAddCustomExercise = () => {
    if (!newExName.trim()) return;
    const customEx = {
      id: newId('ex_custom'),
      name: newExName.trim(),
      en: 'Custom Exercise',
      section: newExSection,
      sets: Number(newExSets) || 3,
      reps: newExReps || '10',
      load: 'حسب التحمل',
      rest: '60ث',
      custom: true,
    };
    dispatch({ type: 'ADD_LIBRARY_EXERCISE', exercise: customEx });
    updatePhase(activePhase, (p) => ({ ...p, exercises: [...p.exercises, customEx] }));
    setNewExName('');
    toast('تمت إضافة التمرين المخصص إلى المرحلة والمكتبة');
  };

  const handleSave = () => {
    if (!draft.name.trim()) {
      toast('يرجى إدخال اسم الإصابة بالعربية', 'warning');
      return;
    }
    const clean = {
      ...draft,
      name: draft.name.trim(),
      en: draft.en.trim() || draft.name.trim(),
      summary: draft.summary.trim() || `بروتوكول تأهيلي مخصص لـ ${draft.name.trim()}`,
    };
    if (isEditingBuiltin) {
      dispatch({ type: 'SAVE_INJURY_OVERRIDE', injury: clean });
      toast('تم حفظ تعديلات البروتوكول بنجاح');
    } else {
      dispatch({ type: 'SAVE_CUSTOM_INJURY', injury: { ...clean, custom: true } });
      toast('تم حفظ الإصابة والبروتوكول المخصص في الموسوعة');
    }
    onSaved?.(clean);
    onClose?.();
  };

  const handleResetBuiltin = () => {
    if (!isEditingBuiltin) return;
    dispatch({ type: 'RESET_INJURY_OVERRIDE', id: draft.id });
    toast('تمت استعادة البروتوكول الافتراضي', 'info');
    onClose?.();
  };

  const phase = draft.phases[activePhase] || draft.phases[0];

  const filteredExercises = useMemo(() => {
    const q = exSearch.trim().toLowerCase();
    return allLibraryExercises.filter((e) => {
      if (exSectionFilter !== 'all' && e.section !== exSectionFilter) return false;
      if (!q) return true;
      return e.name.toLowerCase().includes(q) || (e.en || '').toLowerCase().includes(q);
    });
  }, [allLibraryExercises, exSearch, exSectionFilter]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      icon={FilePlus2}
      title={initialInjury ? `تعديل بروتوكول: ${initialInjury.name}` : 'بناء إصابة وبروتوكول تأهيلي مخصص'}
      subtitle="تحكم كامل في المراحل الأربعة، الممنوعات، شروط الترقية (Gatekeeper Criteria)، والتمارين العلاجية"
      size="xl"
      footer={
        <div className="flex w-full flex-wrap items-center justify-between gap-2">
          <div>
            {isEditingBuiltin && state.injuryOverrides?.[draft.id] && (
              <Button variant="danger" size="sm" icon={RotateCcw} onClick={handleResetBuiltin}>
                استعادة النسخة الأصلية
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={onClose}>
              إلغاء
            </Button>
            <Button icon={Check} onClick={handleSave}>
              حفظ البروتوكول في الموسوعة
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-6">
        {/* بيانات الإصابة */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="اسم الإصابة (عربي)" required className="sm:col-span-2">
            <Input
              placeholder="مثال: متلازمة الألم الفخذي الرضفي / إصلاح الشفا..."
              value={draft.name}
              onChange={(e) => setField('name', e.target.value)}
            />
          </Field>
          <Field label="المصطلح الطبي (English)">
            <Input
              placeholder="e.g., Patellofemoral Pain Syndrome"
              value={draft.en}
              onChange={(e) => setField('en', e.target.value)}
            />
          </Field>
          <Field label="التصنيف النسيجي">
            <Select value={draft.category} onChange={(e) => setField('category', e.target.value)}>
              {Object.entries(CATEGORIES).map(([k, v]) => (
                <option key={k} value={k}>
                  {v.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="المنطقة التشريحية">
            <Select value={draft.region} onChange={(e) => setField('region', e.target.value)}>
              {Object.entries(REGIONS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="مؤشر المدى الحركي المتابع">
            <Input
              placeholder="مثال: ثني الركبة"
              value={draft.rom?.label || ''}
              onChange={(e) => setField('rom', { ...(draft.rom || {}), label: e.target.value })}
            />
          </Field>
          <Field label="زاوية الهدف للمدى الحركي (°)">
            <Input
              type="number"
              value={draft.rom?.target ?? 120}
              onChange={(e) => setField('rom', { ...(draft.rom || {}), target: Number(e.target.value) })}
            />
          </Field>
          <Field label="حالة عصبية (تفعيل مراقبة التنميل/الكهرباء)">
            <Select value={draft.neuro ? 'yes' : 'no'} onChange={(e) => setField('neuro', e.target.value === 'yes')}>
              <option value="no">لا (إصابة عضلية هيكلية)</option>
              <option value="yes">نعم (إصابة عصبية / عمود فقري)</option>
            </Select>
          </Field>
          <Field label="ملخص البروتوكول والمبادئ الإكلينيكية" className="sm:col-span-2 lg:col-span-4">
            <Textarea
              rows={2}
              placeholder="وصف مختصر للإصابة وخطة التدرج التأهيلي..."
              value={draft.summary}
              onChange={(e) => setField('summary', e.target.value)}
            />
          </Field>
        </div>

        {/* تبويبات المراحل الأربعة */}
        <div>
          <Tabs
            value={activePhase}
            onChange={setActivePhase}
            tabs={draft.phases.map((p, idx) => ({
              value: idx,
              label: `المرحلة ${idx + 1}: ${p.title || PHASE_TITLES[idx]}`,
              count: p.exercises?.length || 0,
            }))}
          />

          <div className="mt-4 space-y-5 rounded-2xl border border-slate-200 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-950/40">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <Field label="عنوان المرحلة">
                <Input
                  value={phase.title || ''}
                  onChange={(e) => updatePhase(activePhase, (p) => ({ ...p, title: e.target.value }))}
                />
              </Field>
              <Field label="من الأسبوع">
                <Input
                  type="number"
                  min="0"
                  step="0.5"
                  value={phase.weeks?.[0] ?? 0}
                  onChange={(e) =>
                    updatePhase(activePhase, (p) => ({ ...p, weeks: [Number(e.target.value), p.weeks?.[1] ?? 4] }))
                  }
                />
              </Field>
              <Field label="إلى الأسبوع">
                <Input
                  type="number"
                  min="0.5"
                  step="0.5"
                  value={phase.weeks?.[1] ?? 4}
                  onChange={(e) =>
                    updatePhase(activePhase, (p) => ({ ...p, weeks: [p.weeks?.[0] ?? 0, Number(e.target.value)] }))
                  }
                />
              </Field>
            </div>

            {/* القوائم الثلاث: الأهداف، الممنوعات، شروط الترقية */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              <EditableListCard
                title="أهداف المرحلة"
                tone="sky"
                items={phase.goals || []}
                placeholder="أضف هدفاً علاجياً..."
                onAdd={(txt) => addListItem(activePhase, 'goals', txt)}
                onRemove={(i) => removeListItem(activePhase, 'goals', i)}
              />
              <EditableListCard
                title="الممنوعات الصارمة (Contraindications)"
                icon={ShieldAlert}
                tone="rose"
                items={phase.contraindications || []}
                placeholder="أضف ممنوعاً في هذه المرحلة..."
                onAdd={(txt) => addListItem(activePhase, 'contraindications', txt)}
                onRemove={(i) => removeListItem(activePhase, 'contraindications', i)}
              />
              <EditableListCard
                title="شروط الترقية (Gatekeeper Criteria)"
                icon={CheckCircle2}
                tone="emerald"
                items={phase.criteria || []}
                placeholder="أضف شرط انتقال للمرحلة التالية..."
                onAdd={(txt) => addListItem(activePhase, 'criteria', txt)}
                onRemove={(i) => removeListItem(activePhase, 'criteria', i)}
              />
            </div>

            {/* التمارين المخصصة للمرحلة */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <h5 className="flex items-center gap-2 text-sm font-bold">
                  <Dumbbell size={16} className="text-emerald-500" />
                  تمارين المرحلة {activePhase + 1} المختارة ({phase.exercises?.length || 0} تمرين)
                </h5>
              </div>

              {/* التمارين المختارة حالياً */}
              <div className="mb-4 flex flex-wrap gap-1.5">
                {(phase.exercises || []).map((ref, idx) => {
                  const ex = resolveExercise(ref);
                  if (!ex) return null;
                  return (
                    <span
                      key={`${ex.id}_${idx}`}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300"
                    >
                      {ex.name}
                      <span className="text-[10px] opacity-75">
                        ({ex.sets}×{ex.reps})
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          updatePhase(activePhase, (p) => ({
                            ...p,
                            exercises: p.exercises.filter((_, i) => i !== idx),
                          }))
                        }
                        className="text-rose-500 hover:text-rose-700"
                        title="إزالة"
                      >
                        ×
                      </button>
                    </span>
                  );
                })}
                {!phase.exercises?.length && (
                  <span className="text-xs text-slate-400">لم يتم اختيار تمارين بعد — اختر من القائمة بالأسفل</span>
                )}
              </div>

              {/* إضافة تمرين مخصص سريع */}
              <div className="mb-3 grid grid-cols-1 gap-2 rounded-xl bg-slate-50 p-3 sm:grid-cols-5 dark:bg-slate-950/60">
                <Input
                  placeholder="اسم تمرين مخصص جديد..."
                  value={newExName}
                  onChange={(e) => setNewExName(e.target.value)}
                  className="sm:col-span-2"
                />
                <Select value={newExSection} onChange={(e) => setNewExSection(e.target.value)}>
                  {Object.entries(SECTIONS).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v.label}
                    </option>
                  ))}
                </Select>
                <div className="flex gap-1.5">
                  <Input
                    type="number"
                    min="1"
                    max="10"
                    value={newExSets}
                    onChange={(e) => setNewExSets(e.target.value)}
                    title="المجموعات"
                  />
                  <Input
                    placeholder="التكرار"
                    value={newExReps}
                    onChange={(e) => setNewExReps(e.target.value)}
                    title="التكرارات / المدة"
                  />
                </div>
                <Button variant="secondary" icon={Plus} onClick={handleAddCustomExercise}>
                  إضافة تمرين جديد
                </Button>
              </div>

              {/* مكتبة التمارين للبحث والاختيار */}
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <div className="relative flex-1">
                  <Search size={15} className="pointer-events-none absolute right-3 top-2.5 text-slate-400" />
                  <Input
                    placeholder="ابحث في 120+ تمرين علاجي (عربي أو إنجليزي)..."
                    value={exSearch}
                    onChange={(e) => setExSearch(e.target.value)}
                    className="pr-9"
                  />
                </div>
                <Select
                  value={exSectionFilter}
                  onChange={(e) => setExSectionFilter(e.target.value)}
                  className="w-auto min-w-[160px]"
                >
                  <option value="all">كل أقسام التمارين</option>
                  {Object.entries(SECTIONS).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v.label}
                    </option>
                  ))}
                </Select>
              </div>

              <div className="grid max-h-48 grid-cols-1 gap-1.5 overflow-y-auto sm:grid-cols-2 lg:grid-cols-3">
                {filteredExercises.map((ex) => {
                  const selected = (phase.exercises || []).some((r) =>
                    typeof r === 'string' ? r === ex.id : r.id === ex.id
                  );
                  return (
                    <button
                      key={ex.id}
                      type="button"
                      onClick={() => toggleExerciseInPhase(activePhase, ex.id)}
                      className={`flex items-center justify-between rounded-xl border px-3 py-2 text-right text-xs transition ${
                        selected
                          ? 'border-emerald-500/50 bg-emerald-500/10 font-bold text-emerald-700 dark:text-emerald-300'
                          : 'border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/60'
                      }`}
                    >
                      <div className="truncate">
                        <p className="truncate">{ex.name}</p>
                        <p className="truncate text-[10px] text-slate-400">
                          {SECTIONS[ex.section]?.label} • {ex.sets}×{ex.reps}
                        </p>
                      </div>
                      <Badge tone={selected ? 'emerald' : 'slate'}>{selected ? 'مضاف' : '+'}</Badge>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}

function EditableListCard({ title, icon: Icon, tone = 'emerald', items = [], placeholder, onAdd, onRemove }) {
  const [txt, setTxt] = useState('');
  const submit = () => {
    if (!txt.trim()) return;
    onAdd(txt);
    setTxt('');
  };
  return (
    <div className="flex flex-col rounded-2xl border border-slate-200 bg-white p-3.5 dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-2 flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-xs font-bold">
          {Icon && <Icon size={14} />}
          {title}
        </span>
        <Badge tone={tone}>{items.length}</Badge>
      </div>
      <ul className="mb-3 flex-1 space-y-1.5 text-xs">
        {items.map((it, idx) => (
          <li
            key={idx}
            className="flex items-start justify-between gap-2 rounded-lg bg-slate-50 px-2.5 py-1.5 dark:bg-slate-950/60"
          >
            <span className="leading-5">{it}</span>
            <button
              type="button"
              onClick={() => onRemove(idx)}
              className="shrink-0 text-slate-400 hover:text-rose-500"
              title="حذف"
            >
              <Trash2 size={13} />
            </button>
          </li>
        ))}
      </ul>
      <div className="flex gap-1.5">
        <Input
          placeholder={placeholder}
          value={txt}
          onChange={(e) => setTxt(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              submit();
            }
          }}
        />
        <Button size="sm" variant="secondary" icon={Plus} onClick={submit}>
          إضافة
        </Button>
      </div>
    </div>
  );
}
