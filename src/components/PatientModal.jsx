import { useEffect, useMemo, useState } from 'react';
import { UserPlus, Calendar, Activity, Stethoscope, Sparkles, AlertCircle } from 'lucide-react';
import { Modal, Field, Input, Select, Textarea, Button, Badge, Segmented } from './ui';
import { CATEGORIES, REGIONS, TISSUES } from '../data/injuries';
import { STATUS, ACTIVITY_LEVELS, allInjuries, timeline, expectedPhase, formatWeeks } from '../lib/protocol';
import { todayISO } from '../lib/dates';
import { useApp } from '../store/AppContext';

const SIDES = {
  right: 'الأيمن',
  left: 'الأيسر',
  bilateral: 'مزدوج (الجانبين)',
  axial: 'محوري / مركزي',
};

const EMPTY_FORM = {
  name: '',
  age: 25,
  weight: 75,
  height: 175,
  gender: 'male',
  phone: '',
  sport: '',
  activityLevel: 'competitive',
  region: 'knee',
  side: 'right',
  tissue: 'ligament',
  injuryId: 'acl_recon',
  customDiagnosisMode: false,
  diagnosis: '',
  status: 'postop',
  injuryDate: todayISO(),
  surgeryDate: todayISO(),
  rehabStartDate: todayISO(),
  currentPhase: 1,
  notes: '',
};

export function PatientModal({ open, onClose, initialPatient = null, preselectedInjuryId = null, onSaved }) {
  const { state, dispatch, toast } = useApp();
  const injuries = useMemo(() => allInjuries(state), [state]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [filterBySelection, setFilterBySelection] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (initialPatient) {
      setForm({
        ...EMPTY_FORM,
        ...initialPatient,
        customDiagnosisMode: !initialPatient.injuryId || !injuries.some((i) => i.id === initialPatient.injuryId),
      });
    } else if (preselectedInjuryId) {
      const inj = injuries.find((i) => i.id === preselectedInjuryId);
      setForm({
        ...EMPTY_FORM,
        tissue: inj?.category || 'ligament',
        region: inj?.region || 'knee',
        injuryId: inj?.id || 'acl_recon',
        status: inj?.management?.[0] || 'postop',
        diagnosis: inj ? `${inj.name}` : '',
      });
    } else {
      setForm(EMPTY_FORM);
    }
  }, [open, initialPatient, preselectedInjuryId, injuries]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const matchingInjuries = useMemo(() => {
    if (!filterBySelection) return injuries;
    const filtered = injuries.filter((i) => i.category === form.tissue && i.region === form.region);
    return filtered.length ? filtered : injuries.filter((i) => i.category === form.tissue || i.region === form.region);
  }, [injuries, filterBySelection, form.tissue, form.region]);

  const selectedInjury = useMemo(
    () => injuries.find((i) => i.id === form.injuryId) || matchingInjuries[0] || injuries[0],
    [injuries, form.injuryId, matchingInjuries]
  );

  const handleInjurySelect = (id) => {
    const inj = injuries.find((i) => i.id === id);
    if (!inj) return;
    setForm((f) => ({
      ...f,
      injuryId: id,
      tissue: inj.category,
      region: inj.region,
      status: inj.management?.includes(f.status) ? f.status : inj.management?.[0] || f.status,
      diagnosis: f.diagnosis && f.customDiagnosisMode ? f.diagnosis : `${inj.name} (${SIDES[f.side] || ''})`.trim(),
    }));
  };

  // الحساب الزمني التلقائي المباشر
  const liveTimeline = useMemo(() => timeline(form, selectedInjury), [form, selectedInjury]);
  const suggestedPhase = useMemo(
    () => expectedPhase(selectedInjury, liveTimeline.days),
    [selectedInjury, liveTimeline.days]
  );

  const handleSubmit = (e) => {
    e?.preventDefault?.();
    if (!form.name.trim()) {
      toast('يرجى إدخال اسم المريض', 'warning');
      return;
    }
    const finalDiagnosis =
      form.diagnosis.trim() ||
      `${selectedInjury?.name || 'إصابة رياضية'} - ${REGIONS[form.region] || ''} (${SIDES[form.side] || ''})`;

    const payload = {
      ...form,
      name: form.name.trim(),
      age: Number(form.age) || 25,
      weight: Number(form.weight) || 70,
      height: Number(form.height) || 175,
      currentPhase: Number(form.currentPhase) || 1,
      injuryId: selectedInjury?.id || 'acl_recon',
      diagnosis: finalDiagnosis,
      surgeryDate: form.status === 'conservative' ? '' : form.surgeryDate,
    };

    if (initialPatient) {
      dispatch({ type: 'UPDATE_PATIENT', id: initialPatient.id, patch: payload });
      toast('تم تحديث بيانات المريض بنجاح');
      onSaved?.(initialPatient.id);
    } else {
      dispatch({ type: 'ADD_PATIENT', patient: payload });
      toast('تمت إضافة المريض وتوليد مساره التأهيلي بنجاح');
      onSaved?.();
    }
    onClose?.();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      icon={UserPlus}
      title={initialPatient ? 'تعديل بيانات المريض' : 'إضافة مريض جديد (فتح ملف إكلينيكي)'}
      subtitle="أدخل البيانات الديموغرافية والتشخيص والتواريخ ليقوم النظام بحساب الأسبوع التأهيلي والمرحلة تلقائياً"
      size="xl"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            إلغاء
          </Button>
          <Button icon={Sparkles} onClick={handleSubmit}>
            {initialPatient ? 'حفظ التعديلات' : 'إنشاء ملف المريض وبدء التأهيل'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 1. البيانات الأساسية والرياضية */}
        <div>
          <h4 className="mb-3 flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
            <Activity size={15} /> البيانات الشخصية والنشاط الرياضي
          </h4>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Field label="اسم المريض ثلاثياً" required className="sm:col-span-2">
              <Input
                placeholder="مثال: كابتن محمد عبد الله..."
                value={form.name}
                onChange={(e) => set('name', e.target.value)}
                required
              />
            </Field>
            <Field label="العمر (سنة)">
              <Input type="number" min="8" max="95" value={form.age} onChange={(e) => set('age', e.target.value)} />
            </Field>
            <Field label="الوزن (كجم)">
              <Input type="number" min="25" max="200" value={form.weight} onChange={(e) => set('weight', e.target.value)} />
            </Field>
            <Field label="الطول (سم)">
              <Input type="number" min="100" max="230" value={form.height} onChange={(e) => set('height', e.target.value)} />
            </Field>
            <Field label="الجنس">
              <Select value={form.gender} onChange={(e) => set('gender', e.target.value)}>
                <option value="male">ذكر</option>
                <option value="female">أنثى</option>
              </Select>
            </Field>
            <Field label="الرياضة / التخصص الوظيفي">
              <Input
                placeholder="مثال: كرة قدم (جناح)، سباحة، عمل مكتبي..."
                value={form.sport}
                onChange={(e) => set('sport', e.target.value)}
              />
            </Field>
            <Field label="مستوى النشاط">
              <Select value={form.activityLevel} onChange={(e) => set('activityLevel', e.target.value)}>
                {Object.entries(ACTIVITY_LEVELS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
        </div>

        {/* 2. التصنيف التشريحي والنسيجي والتشخيص */}
        <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 dark:border-slate-800 dark:bg-slate-950/40">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h4 className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-sky-600 dark:text-sky-400">
              <Stethoscope size={15} /> المنطقة التشريحية ونوع النسيج والتشخيص
            </h4>
            <label className="flex cursor-pointer items-center gap-2 text-xs text-slate-500">
              <input
                type="checkbox"
                checked={filterBySelection}
                onChange={(e) => setFilterBySelection(e.target.checked)}
                className="rounded accent-emerald-500"
              />
              تصفية البروتوكولات حسب النسيج والمنطقة فقط
            </label>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Field label="المنطقة التشريحية">
              <Select value={form.region} onChange={(e) => set('region', e.target.value)}>
                {Object.entries(REGIONS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="نوع النسيج المصاب">
              <Select value={form.tissue} onChange={(e) => set('tissue', e.target.value)}>
                {Object.entries(TISSUES).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v} ({CATEGORIES[k]?.label})
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="الجهة المصابة">
              <Select value={form.side} onChange={(e) => set('side', e.target.value)}>
                {Object.entries(SIDES).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field
              label="البروتوكول المرجعي من موسوعة الإصابات"
              hint="يحدد المراحل الأربعة، الممنوعات، شروط الترقية، والتمارين التلقائية"
            >
              <Select value={selectedInjury?.id || ''} onChange={(e) => handleInjurySelect(e.target.value)}>
                {Object.entries(CATEGORIES).map(([catKey, cat]) => {
                  const list = matchingInjuries.filter((i) => i.category === catKey);
                  if (!list.length) return null;
                  return (
                    <optgroup key={catKey} label={cat.label}>
                      {list.map((inj) => (
                        <option key={inj.id} value={inj.id}>
                          {inj.name} ({inj.en})
                        </option>
                      ))}
                    </optgroup>
                  );
                })}
              </Select>
            </Field>

            <Field
              label="التشخيص الإكلينيكي التفصيلي (قابل للتخصيص)"
              hint="يمكنك كتابة تشخيص مخصص مع الاحتفاظ بالبروتوكول المرجعي أعلاه"
            >
              <Input
                placeholder={selectedInjury ? `${selectedInjury.name} - ${SIDES[form.side]}` : 'اكتب التشخيص التفصيلي...'}
                value={form.diagnosis}
                onChange={(e) => {
                  set('diagnosis', e.target.value);
                  set('customDiagnosisMode', true);
                }}
              />
            </Field>
          </div>
        </div>

        {/* 3. الحالة العلاجية والخط الزمني */}
        <div>
          <h4 className="mb-3 flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-violet-600 dark:text-violet-400">
            <Calendar size={15} /> الحالة العلاجية والخط الزمني (حساب تلقائي للأسبوع التأهيلي)
          </h4>

          <Field label="مسار التأهيل (Status)" className="mb-4">
            <Segmented
              value={form.status}
              onChange={(v) => set('status', v)}
              options={[
                { value: 'postop', label: 'تأهيل بعد العملية (Post-Op)', tone: 'violet' },
                { value: 'preop', label: 'تأهيل قبل العملية (Pre-Op)', tone: 'sky' },
                { value: 'conservative', label: 'تأهيل تحفظي بدون جراحة', tone: 'emerald' },
              ]}
            />
          </Field>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
            <Field label="تاريخ الإصابة">
              <Input type="date" value={form.injuryDate} onChange={(e) => set('injuryDate', e.target.value)} />
            </Field>

            {form.status !== 'conservative' && (
              <Field label={form.status === 'preop' ? 'تاريخ العملية المقرر (اختياري)' : 'تاريخ إجراء العملية'}>
                <Input type="date" value={form.surgeryDate} onChange={(e) => set('surgeryDate', e.target.value)} />
              </Field>
            )}

            <Field label="تاريخ بدء التأهيل">
              <Input type="date" value={form.rehabStartDate} onChange={(e) => set('rehabStartDate', e.target.value)} />
            </Field>

            <Field
              label="المرحلة الحالية"
              hint={`المقترح زمنياً: المرحلة ${suggestedPhase}`}
            >
              <div className="flex gap-1.5">
                <Select value={form.currentPhase} onChange={(e) => set('currentPhase', Number(e.target.value))}>
                  {(selectedInjury?.phases || [1, 2, 3, 4]).map((p, idx) => (
                    <option key={idx} value={idx + 1}>
                      المرحلة {idx + 1}: {p.title || ''} ({formatWeeks(p.weeks || [0, 2])})
                    </option>
                  ))}
                </Select>
                {Number(form.currentPhase) !== suggestedPhase && (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => set('currentPhase', suggestedPhase)}
                    title="تطبيق المرحلة المقترحة حسب التاريخ"
                  >
                    تلقائي
                  </Button>
                )}
              </div>
            </Field>
          </div>

          {/* بطاقة الحساب التلقائي المباشر */}
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4">
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-emerald-500 font-extrabold text-white shadow">
                W{liveTimeline.week}
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-extrabold text-slate-900 dark:text-white">{liveTimeline.label}</span>
                  <Badge tone="emerald">{liveTimeline.days} يوم من تاريخ المرجع</Badge>
                  {liveTimeline.surgeryCountdown !== null && (
                    <Badge tone="sky">متبقي {liveTimeline.surgeryCountdown} يوم على العملية</Badge>
                  )}
                </div>
                <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-300">
                  البروتوكول المختار: <b>{selectedInjury?.name}</b> — المرحلة المتوقعة زمنياً:{' '}
                  <b>
                    المرحلة {suggestedPhase} ({selectedInjury?.phases?.[suggestedPhase - 1]?.title})
                  </b>
                </p>
              </div>
            </div>
            {selectedInjury?.redFlags?.length > 0 && (
              <div className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400">
                <AlertCircle size={15} />
                <span>تأكد من فحص العلامات التحذيرية ({selectedInjury.redFlags.length})</span>
              </div>
            )}
          </div>
        </div>

        {/* 4. ملاحظات وتعليمات الجراح */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Field label="رقم الهاتف / التواصل (اختياري)">
            <Input placeholder="01xxxxxxxxx" value={form.phone} onChange={(e) => set('phone', e.target.value)} />
          </Field>
          <Field label="ملاحظات إكلينيكية / تعليمات الجراح الخاصة" className="sm:col-span-2">
            <Textarea
              rows={2}
              placeholder="مثال: نوع الطُعم، حدود المدى الحركي المسموحة من الجراح، أدوية أو تحذيرات..."
              value={form.notes}
              onChange={(e) => set('notes', e.target.value)}
            />
          </Field>
        </div>
      </form>
    </Modal>
  );
}
