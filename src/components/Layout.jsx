import { useRef, useState } from 'react';
import {
  Activity,
  BookOpen,
  Download,
  FilePlus2,
  LayoutDashboard,
  Menu,
  Moon,
  RotateCcw,
  Sparkles,
  Sun,
  Upload,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import { IconButton, LightDot, Avatar, cx } from './ui';
import { exportJSON, readJSONFile } from '../lib/storage';
import { lastSession, timeline, getPatientProtocol } from '../lib/protocol';
import { formatDate, todayISO } from '../lib/dates';
import { useApp } from '../store/AppContext';

export function Layout({
  activeNav,
  onNavigate,
  onAddPatient,
  onCreateCustomInjury,
  onSelectPatient,
  selectedPatientId,
  children,
}) {
  const { state, dispatch, toast } = useApp();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'));
  const fileRef = useRef(null);

  const toggleTheme = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle('dark', next);
    try {
      localStorage.setItem('sros.theme', next ? 'dark' : 'light');
    } catch {}
  };

  const handleImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const data = await readJSONFile(file);
      dispatch({ type: 'IMPORT_STATE', state: data });
      toast('تمت استعادة النسخة الاحتياطية بنجاح');
    } catch (err) {
      toast(err.message || 'تعذر استيراد الملف', 'error');
    } finally {
      e.target.value = '';
    }
  };

  const navItems = [
    { id: 'dashboard', label: 'الرئيسية', icon: LayoutDashboard },
    { id: 'patients', label: 'المرضى', icon: Users, badge: state.patients.length },
    { id: 'generator', label: 'جلسة اليوم', icon: Sparkles },
    { id: 'encyclopedia', label: 'موسوعة الإصابات', icon: BookOpen },
  ];

  const SidebarContent = () => (
    <div className="flex h-full flex-col justify-between p-4">
      <div className="space-y-5">
        {/* شعار النظام */}
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-emerald-500 text-white shadow-sm">
              <Activity size={20} />
            </div>
            <div>
              <h1 className="text-base font-extrabold text-slate-900 dark:text-white">
                Smart Rehab
              </h1>
              <p className="text-[11px] font-medium text-slate-400">
                عيادة التأهيل الرياضي
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="rounded-lg p-1 text-slate-400 lg:hidden"
          >
            <X size={20} />
          </button>
        </div>

        {/* أزرار الإضافة السريعة */}
        <div className="grid grid-cols-2 gap-1.5">
          <button
            type="button"
            onClick={() => {
              onAddPatient();
              setMobileOpen(false);
            }}
            className="flex items-center justify-center gap-1.5 rounded-xl bg-emerald-500 px-3 py-2.5 text-xs font-bold text-white transition hover:bg-emerald-600"
          >
            <UserPlus size={15} />
            مريض جديد
          </button>
          <button
            type="button"
            onClick={() => {
              onCreateCustomInjury();
              setMobileOpen(false);
            }}
            className="flex items-center justify-center gap-1.5 rounded-xl bg-slate-100 px-3 py-2.5 text-xs font-bold text-slate-700 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            <FilePlus2 size={15} />
            إصابة مخصصة
          </button>
        </div>

        {/* روابط التنقل الرئيسية */}
        <nav className="space-y-1">
          {navItems.map((it) => {
            const Icon = it.icon;
            const active = activeNav === it.id;
            return (
              <button
                key={it.id}
                type="button"
                onClick={() => {
                  onNavigate(it.id);
                  setMobileOpen(false);
                }}
                className={cx(
                  'flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-bold transition',
                  active
                    ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                    : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800/70'
                )}
              >
                <span className="flex items-center gap-3">
                  <Icon size={18} />
                  {it.label}
                </span>
                {it.badge !== undefined && (
                  <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                    {it.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* وصول سريع للمرضى النشطين */}
        <div>
          <p className="px-2 pb-2 text-xs font-bold text-slate-400">
            المرضى الحاليون
          </p>
          <div className="max-h-64 space-y-1 overflow-y-auto pr-1">
            {state.patients.map((p) => {
              const last = lastSession(p);
              const { injury } = getPatientProtocol(state, p);
              const tl = timeline(p, injury);
              const isSelected = activeNav === 'patient-detail' && selectedPatientId === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    onSelectPatient(p.id);
                    setMobileOpen(false);
                  }}
                  className={cx(
                    'flex w-full items-center justify-between rounded-xl px-2.5 py-2 text-right text-xs transition',
                    isSelected
                      ? 'bg-emerald-500/15 font-extrabold text-emerald-600 dark:text-emerald-300'
                      : 'hover:bg-slate-100 dark:hover:bg-slate-800/60'
                  )}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <Avatar name={p.name} size="sm" />
                    <div className="truncate">
                      <p className="truncate font-bold text-slate-800 dark:text-slate-100">{p.name}</p>
                      <p className="truncate text-[10px] text-slate-400">
                        المرحلة {p.currentPhase} • الأسبوع {tl.week}
                      </p>
                    </div>
                  </div>
                  <LightDot light={last?.light || 'green'} size={9} />
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* تذييل الشريط الجانبي المبسط */}
      <div className="border-t border-slate-200 pt-3 dark:border-slate-800">
        <div className="flex items-center justify-between gap-1">
          <button
            type="button"
            onClick={() => exportJSON(state)}
            className="flex flex-1 items-center justify-center gap-1 rounded-xl bg-slate-100 px-2 py-1.5 text-[11px] font-semibold text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
            title="حفظ نسخة احتياطية"
          >
            <Download size={13} /> حفظ نسخة
          </button>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="flex flex-1 items-center justify-center gap-1 rounded-xl bg-slate-100 px-2 py-1.5 text-[11px] font-semibold text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
            title="استعادة نسخة احتياطية"
          >
            <Upload size={13} /> استعادة
          </button>
          <button
            type="button"
            onClick={() => {
              dispatch({ type: 'RESET_DEMO' });
              toast('تمت استعادة الحالات التجريبية', 'info');
            }}
            className="flex items-center justify-center gap-1 rounded-xl bg-slate-100 px-2.5 py-1.5 text-[11px] font-semibold text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
            title="إعادة ضبط البيانات التجريبية"
          >
            <RotateCcw size={13} />
          </button>
          <input ref={fileRef} type="file" accept=".json" onChange={handleImport} className="hidden" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-[#0b1220]" dir="rtl">
      {/* الشريط الجانبي لسطح المكتب */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 border-l border-slate-200 bg-white lg:block dark:border-slate-800 dark:bg-slate-900">
        <SidebarContent />
      </aside>

      {/* الشريط الجانبي للموبايل */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        >
          <aside
            className="h-full w-64 bg-white dark:bg-slate-900"
            onClick={(e) => e.stopPropagation()}
          >
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* المحتوى الرئيسي */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* شريط علوي هادئ ونظيف */}
        <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur sm:px-6 dark:border-slate-800 dark:bg-slate-900/90">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="grid h-9 w-9 place-items-center rounded-xl border border-slate-200 text-slate-600 lg:hidden dark:border-slate-800 dark:text-slate-300"
            >
              <Menu size={18} />
            </button>
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
              {activeNav === 'dashboard' && 'الرئيسية'}
              {activeNav === 'patients' && 'قائمة المرضى'}
              {activeNav === 'encyclopedia' && 'موسوعة الإصابات والبروتوكولات'}
              {activeNav === 'generator' && 'تجهيز جلسة اليوم'}
              {activeNav === 'patient-detail' && 'ملف المريض'}
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden text-xs font-medium text-slate-400 sm:inline">
              {formatDate(todayISO(), { withDay: true })}
            </span>
            <IconButton
              icon={dark ? Sun : Moon}
              title={dark ? 'الوضع الفاتح' : 'الوضع الداكن'}
              onClick={toggleTheme}
            />
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
