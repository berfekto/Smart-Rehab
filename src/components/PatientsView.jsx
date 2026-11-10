import { useMemo, useState } from 'react';
import {
  Users,
  UserPlus,
  Search,
  Play,
  FolderOpen,
  Calendar,
  Award,
  Flame,
  Droplets,
} from 'lucide-react';
import {
  Card,
  Badge,
  Button,
  Input,
  Select,
  Segmented,
  ProgressBar,
  PhaseStepper,
  Avatar,
  LightDot,
  EmptyState,
  LIGHT_TONE,
} from './ui';
import { Sparkline } from './charts';
import { CATEGORIES, REGIONS, TISSUES } from '../data/injuries';
import {
  STATUS,
  getPatientProtocol,
  timeline,
  phaseProgress,
  lastSession,
  sortedSessions,
} from '../lib/protocol';
import { EFFUSION_LEVELS, LIGHTS } from '../lib/engine';
import { relativeDays } from '../lib/dates';
import { useApp } from '../store/AppContext';

export function PatientsView({
  onSelectPatient,
  onStartSession,
  onAddPatient,
}) {
  const { state } = useApp();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [tissueFilter, setTissueFilter] = useState('all');
  const [regionFilter, setRegionFilter] = useState('all');
  const [lightFilter, setLightFilter] = useState('all');

  const enriched = useMemo(() => {
    return state.patients.map((p) => {
      const { injury } = getPatientProtocol(state, p);
      const tl = timeline(p, injury);
      const pp = phaseProgress(p, injury);
      const last = lastSession(p);
      const asc = sortedSessions(p, 'asc');
      return { p, injury, tl, pp, last, asc };
    });
  }, [state]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return enriched.filter(({ p, injury, last }) => {
      if (statusFilter !== 'all' && p.status !== statusFilter) return false;
      if (tissueFilter !== 'all' && p.tissue !== tissueFilter) return false;
      if (regionFilter !== 'all' && p.region !== regionFilter) return false;
      if (lightFilter !== 'all' && (last?.light || 'green') !== lightFilter) return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        (p.diagnosis || '').toLowerCase().includes(q) ||
        (p.sport || '').toLowerCase().includes(q) ||
        (injury?.name || '').toLowerCase().includes(q)
      );
    });
  }, [enriched, search, statusFilter, tissueFilter, regionFilter, lightFilter]);

  return (
    <div className="space-y-6">
      {/* شريط الفلترة والبحث وإضافة مريض */}
      <Card className="p-4">
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Segmented
              value={statusFilter}
              onChange={setStatusFilter}
              options={[
                { value: 'all', label: `الكل (${state.patients.length})` },
                { value: 'postop', label: 'بعد العملية (Post-Op)', tone: 'violet' },
                { value: 'preop', label: 'قبل العملية (Pre-Op)', tone: 'sky' },
                { value: 'conservative', label: 'تأهيل تحفظي', tone: 'emerald' },
              ]}
            />
            <Button icon={UserPlus} onClick={onAddPatient}>
              إضافة مريض جديد
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-5">
            <div className="relative lg:col-span-2">
              <Search size={16} className="pointer-events-none absolute right-3 top-2.5 text-slate-400" />
              <Input
                placeholder="ابحث باسم المريض، التشخيص، أو الرياضة..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pr-9"
              />
            </div>

            <Select value={tissueFilter} onChange={(e) => setTissueFilter(e.target.value)}>
              <option value="all">كل الأنسجة المصابة</option>
              {Object.entries(TISSUES).map(([k, v]) => (
                <option key={k} value={k}>
                  {v} ({CATEGORIES[k]?.label})
                </option>
              ))}
            </Select>

            <Select value={regionFilter} onChange={(e) => setRegionFilter(e.target.value)}>
              <option value="all">كل المناطق التشريحية</option>
              {Object.entries(REGIONS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </Select>

            <Select value={lightFilter} onChange={(e) => setLightFilter(e.target.value)}>
              <option value="all">كل حالات الإشارة الضوئية</option>
              <option value="green">إشارة خضراء (مستقر)</option>
              <option value="yellow">إشارة صفراء (حذر -30%)</option>
              <option value="red">إشارة حمراء (استشفاء حاد)</option>
            </Select>
          </div>
        </div>
      </Card>

      {/* شبكة بطاقات المرضى */}
      {filtered.length === 0 ? (
        <Card>
          <EmptyState
            icon={Users}
            title="لا يوجد مرضى مطابقون لمعايير البحث"
            text="يمكنك تعديل الفلاتر أو إضافة مريض جديد للنظام"
            action={
              <Button icon={UserPlus} onClick={onAddPatient}>
                إضافة مريض جديد
              </Button>
            }
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {filtered.map(({ p, injury, tl, pp, last, asc }) => {
            const st = STATUS[p.status] || STATUS.conservative;
            const cat = CATEGORIES[p.tissue] || CATEGORIES.ligament;
            const phaseObj = injury?.phases?.[(p.currentPhase || 1) - 1];

            return (
              <Card
                key={p.id}
                className="flex flex-col justify-between p-5 transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div>
                  {/* رأس البطاقة */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <Avatar name={p.name} />
                      <div>
                        <div className="flex flex-wrap items-center gap-1.5">
                          <h3
                            onClick={() => onSelectPatient(p.id)}
                            className="cursor-pointer font-extrabold text-slate-900 hover:text-emerald-600 dark:text-white dark:hover:text-emerald-400"
                          >
                            {p.name}
                          </h3>
                          <Badge tone={st.color}>{st.short}</Badge>
                          <Badge tone={cat.color}>{TISSUES[p.tissue]}</Badge>
                          <Badge tone="sky">{REGIONS[p.region]}</Badge>
                        </div>
                        <p className="mt-1 text-xs font-semibold text-slate-600 dark:text-slate-300">
                          {p.diagnosis}
                        </p>
                        <p className="mt-0.5 text-[11px] text-slate-400">
                          {p.age} سنة • {p.weight} كجم {p.sport ? `• ${p.sport}` : ''}
                        </p>
                      </div>
                    </div>

                    {last && (
                      <div className="flex items-center gap-1.5 rounded-full border border-slate-200 px-2.5 py-1 text-xs font-bold dark:border-slate-800">
                        <LightDot light={last.light} />
                        <span>{LIGHTS[last.light]?.label}</span>
                      </div>
                    )}
                  </div>

                  {/* شريط الأسبوع والمرحلة */}
                  <div className="mt-4 rounded-2xl bg-slate-50 p-3.5 dark:bg-slate-950/60">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                      <span className="flex items-center gap-1.5 font-extrabold text-emerald-600 dark:text-emerald-400">
                        <Calendar size={14} /> {tl.label} ({tl.days} يوم)
                      </span>
                      <span className="font-bold text-slate-700 dark:text-slate-200">
                        المرحلة {p.currentPhase} من {injury?.phases?.length || 4}: {phaseObj?.title}
                      </span>
                    </div>

                    <div className="mt-2.5">
                      <PhaseStepper
                        total={injury?.phases?.length || 4}
                        current={p.currentPhase}
                        discharged={p.discharged}
                      />
                    </div>

                    <div className="mt-2.5 flex items-center justify-between text-xs text-slate-500">
                      <span>
                        شروط الترقية: <b>{pp.criteriaDone}/{pp.criteriaTotal}</b>
                        {pp.allMet && (
                          <span className="mr-1 font-bold text-emerald-600 dark:text-emerald-400">
                            (جاهز للترقية ✓)
                          </span>
                        )}
                      </span>
                      <span>إنجاز المرحلة: <b>{pp.percent}%</b></span>
                    </div>
                    <ProgressBar value={pp.percent} tone="emerald" className="mt-1.5" />
                  </div>

                  {/* مؤشرات آخر جلسة + Sparkline */}
                  <div className="mt-3.5 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
                    {last ? (
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="flex items-center gap-1">
                          <Flame size={13} className="text-rose-500" />
                          ألم: <b className="text-slate-800 dark:text-slate-100">{last.pain}/10</b>
                        </span>
                        <span className="flex items-center gap-1">
                          <Droplets size={13} className="text-sky-500" />
                          ارتشاح: <b className="text-slate-800 dark:text-slate-100">{EFFUSION_LEVELS[last.effusion]?.label}</b>
                        </span>
                        <span>آخر جلسة: {relativeDays(last.date)}</span>
                      </div>
                    ) : (
                      <span>لم تسجل جلسات بعد</span>
                    )}

                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-slate-400">اتجاه الألم:</span>
                      <Sparkline values={asc.map((s) => Number(s.pain) || 0)} />
                    </div>
                  </div>
                </div>

                {/* أزرار الإجراءات */}
                <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3.5 dark:border-slate-800">
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={FolderOpen}
                    onClick={() => onSelectPatient(p.id)}
                  >
                    السجل وشروط الترقية ({asc.length} جلسات)
                  </Button>
                  <Button
                    size="sm"
                    icon={Play}
                    onClick={() => onStartSession(p.id)}
                  >
                    بدء جلسة اليوم (Traffic Light)
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
