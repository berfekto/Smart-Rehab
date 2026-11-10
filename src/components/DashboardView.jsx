import { useMemo, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  Award,
  Droplets,
  Flame,
  FolderOpen,
  Play,
  Search,
  UserPlus,
  Users,
} from 'lucide-react';
import {
  Card,
  Badge,
  Button,
  Input,
  StatCard,
  ProgressBar,
  Avatar,
  LightDot,
  cx,
} from './ui';
import { REGIONS } from '../data/injuries';
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

export function DashboardView({
  onSelectPatient,
  onStartSession,
  onAddPatient,
}) {
  const { state } = useApp();
  const [quickFilter, setQuickFilter] = useState('all');
  const [search, setSearch] = useState('');

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

  const metrics = useMemo(() => {
    const totalPatients = enriched.length;
    const totalSessions = enriched.reduce((sum, x) => sum + x.asc.length, 0);
    const attentionCount = enriched.filter(
      (x) => x.last?.light === 'red' || x.last?.light === 'yellow'
    ).length;
    const readyCount = enriched.filter((x) => x.pp.allMet && !x.p.discharged).length;
    return { totalPatients, totalSessions, attentionCount, readyCount };
  }, [enriched]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return enriched.filter(({ p, last, pp }) => {
      if (quickFilter === 'attention' && last?.light !== 'red' && last?.light !== 'yellow') return false;
      if (quickFilter === 'ready' && !pp.allMet) return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        (p.diagnosis || '').toLowerCase().includes(q) ||
        (p.sport || '').toLowerCase().includes(q)
      );
    });
  }, [enriched, quickFilter, search]);

  return (
    <div className="space-y-6">
      {/* ملخص سريع وبسيط — اضغط على أي بطاقة لتصفية الحالات فوراً */}
      <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-4">
        <StatCard
          icon={Users}
          tone="emerald"
          label="إجمالي المرضى"
          value={metrics.totalPatients}
          sub="كل الحالات النشطة"
          onClick={() => setQuickFilter('all')}
        />
        <StatCard
          icon={AlertTriangle}
          tone={metrics.attentionCount > 0 ? 'amber' : 'emerald'}
          label="تحتاج انتباه اليوم"
          value={metrics.attentionCount}
          sub="إشارة صفراء أو حمراء"
          onClick={() => setQuickFilter(quickFilter === 'attention' ? 'all' : 'attention')}
        />
        <StatCard
          icon={Award}
          tone="violet"
          label="جاهزون للترقية"
          value={metrics.readyCount}
          sub="أتموا شروط المرحلة"
          onClick={() => setQuickFilter(quickFilter === 'ready' ? 'all' : 'ready')}
        />
        <StatCard
          icon={Activity}
          tone="sky"
          label="الجلسات المسجلة"
          value={metrics.totalSessions}
          sub="إجمالي الجلسات المنفذة"
        />
      </div>

      {/* شريط بحث وتصفية بسيط ومباشر */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-1 flex-wrap items-center gap-2">
          <div className="relative min-w-[240px] flex-1 max-w-md">
            <Search size={16} className="pointer-events-none absolute right-3.5 top-2.5 text-slate-400" />
            <Input
              placeholder="ابحث باسم المريض أو الإصابة..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pr-10"
            />
          </div>

          <div className="flex items-center gap-1 rounded-xl bg-slate-200/70 p-1 text-xs font-bold dark:bg-slate-900">
            {[
              { id: 'all', label: `الكل (${enriched.length})` },
              { id: 'attention', label: `يحتاج انتباه (${metrics.attentionCount})` },
              { id: 'ready', label: `جاهز للترقية (${metrics.readyCount})` },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setQuickFilter(f.id)}
                className={cx(
                  'rounded-lg px-3 py-1.5 transition',
                  quickFilter === f.id
                    ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-white'
                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <Button icon={UserPlus} onClick={onAddPatient}>
          إضافة مريض جديد
        </Button>
      </div>

      {/* بطاقات المرضى — واضحة ومباشرة بدون أي تشتيت */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {filtered.map(({ p, injury, tl, pp, last, asc }) => {
          const st = STATUS[p.status] || STATUS.conservative;
          const phaseObj = injury?.phases?.[(p.currentPhase || 1) - 1];

          return (
            <Card
              key={p.id}
              className="flex flex-col justify-between p-5 transition hover:border-slate-300 dark:hover:border-slate-700"
            >
              <div>
                {/* الاسم والتشخيص وإشارة آخر جلسة */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Avatar name={p.name} />
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3
                          onClick={() => onSelectPatient(p.id)}
                          className="cursor-pointer text-base font-extrabold text-slate-900 hover:text-emerald-500 dark:text-white"
                        >
                          {p.name}
                        </h3>
                        <Badge tone={st.color}>{st.short}</Badge>
                        <Badge tone="slate">{REGIONS[p.region]}</Badge>
                      </div>
                      <p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">
                        {p.diagnosis}
                      </p>
                    </div>
                  </div>

                  {last && (
                    <div className="flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-bold dark:bg-slate-800">
                      <LightDot light={last.light} />
                      <span>{LIGHTS[last.light]?.label}</span>
                    </div>
                  )}
                </div>

                {/* الأسبوع الحالي والمرحلة */}
                <div className="mt-4 rounded-2xl bg-slate-50 p-3.5 dark:bg-slate-950/50">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-extrabold text-emerald-600 dark:text-emerald-400">
                      {tl.label}
                    </span>
                    <span className="font-bold text-slate-700 dark:text-slate-200">
                      المرحلة {p.currentPhase} من {injury?.phases?.length || 4}: {phaseObj?.title}
                    </span>
                  </div>

                  <div className="mt-2.5">
                    <ProgressBar value={pp.percent} tone="emerald" />
                  </div>

                  <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
                    <span>
                      شروط الترقية: <b>{pp.criteriaDone} من {pp.criteriaTotal}</b>
                    </span>
                    <span>اكتمال المرحلة: <b>{pp.percent}%</b></span>
                  </div>
                </div>

                {/* سطر مختصر لآخر جلسة */}
                {last && (
                  <div className="mt-3 flex flex-wrap items-center justify-between text-xs text-slate-500">
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1">
                        <Flame size={13} className="text-rose-500" />
                        الألم: <b className="text-slate-800 dark:text-slate-200">{last.pain}/10</b>
                      </span>
                      <span className="flex items-center gap-1">
                        <Droplets size={13} className="text-sky-500" />
                        التورم: <b className="text-slate-800 dark:text-slate-200">{EFFUSION_LEVELS[last.effusion]?.label}</b>
                      </span>
                    </div>
                    <span>آخر جلسة: {relativeDays(last.date)}</span>
                  </div>
                )}
              </div>

              {/* أزرار واضحة ومباشرة */}
              <div className="mt-4 grid grid-cols-2 gap-2.5 border-t border-slate-100 pt-3.5 dark:border-slate-800">
                <Button
                  variant="secondary"
                  icon={FolderOpen}
                  onClick={() => onSelectPatient(p.id)}
                >
                  ملف المريض ({asc.length})
                </Button>
                <Button
                  icon={Play}
                  onClick={() => onStartSession(p.id)}
                >
                  بدء جلسة اليوم
                </Button>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
