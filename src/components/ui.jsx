import { useEffect, useRef } from 'react';
import { X, CheckCircle2, AlertTriangle, Info, XCircle } from 'lucide-react';
import { useApp } from '../store/AppContext';

/** خريطة الألوان (أسماء كاملة لكي يلتقطها Tailwind) */
export const TONES = {
  emerald: { soft: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 ring-emerald-500/25', solid: 'bg-emerald-500', text: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-500/40', bar: 'bg-gradient-to-l from-emerald-400 to-emerald-600' },
  amber: { soft: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 ring-amber-500/25', solid: 'bg-amber-500', text: 'text-amber-600 dark:text-amber-400', border: 'border-amber-500/40', bar: 'bg-gradient-to-l from-amber-300 to-amber-500' },
  rose: { soft: 'bg-rose-500/15 text-rose-700 dark:text-rose-300 ring-rose-500/25', solid: 'bg-rose-500', text: 'text-rose-600 dark:text-rose-400', border: 'border-rose-500/40', bar: 'bg-gradient-to-l from-rose-400 to-rose-600' },
  sky: { soft: 'bg-sky-500/15 text-sky-700 dark:text-sky-300 ring-sky-500/25', solid: 'bg-sky-500', text: 'text-sky-600 dark:text-sky-400', border: 'border-sky-500/40', bar: 'bg-gradient-to-l from-sky-400 to-sky-600' },
  violet: { soft: 'bg-violet-500/15 text-violet-700 dark:text-violet-300 ring-violet-500/25', solid: 'bg-violet-500', text: 'text-violet-600 dark:text-violet-400', border: 'border-violet-500/40', bar: 'bg-gradient-to-l from-violet-400 to-violet-600' },
  teal: { soft: 'bg-teal-500/15 text-teal-700 dark:text-teal-300 ring-teal-500/25', solid: 'bg-teal-500', text: 'text-teal-600 dark:text-teal-400', border: 'border-teal-500/40', bar: 'bg-gradient-to-l from-teal-400 to-teal-600' },
  cyan: { soft: 'bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 ring-cyan-500/25', solid: 'bg-cyan-500', text: 'text-cyan-600 dark:text-cyan-400', border: 'border-cyan-500/40', bar: 'bg-gradient-to-l from-cyan-400 to-cyan-600' },
  indigo: { soft: 'bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 ring-indigo-500/25', solid: 'bg-indigo-500', text: 'text-indigo-600 dark:text-indigo-400', border: 'border-indigo-500/40', bar: 'bg-gradient-to-l from-indigo-400 to-indigo-600' },
  slate: { soft: 'bg-slate-500/15 text-slate-700 dark:text-slate-300 ring-slate-500/25', solid: 'bg-slate-500', text: 'text-slate-600 dark:text-slate-400', border: 'border-slate-500/40', bar: 'bg-gradient-to-l from-slate-400 to-slate-600' },
};

export const LIGHT_TONE = { green: 'emerald', yellow: 'amber', red: 'rose' };

export function cx(...a) {
  return a.filter(Boolean).join(' ');
}

export function Card({ className, children, ...rest }) {
  return (
    <div className={cx('rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900/60 dark:shadow-none', className)} {...rest}>
      {children}
    </div>
  );
}

export function CardHeader({ icon: Icon, title, subtitle, action, tone = 'emerald' }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-4 dark:border-slate-800">
      <div className="flex items-center gap-3">
        {Icon && (
          <div className={cx('grid h-9 w-9 shrink-0 place-items-center rounded-xl ring-1', TONES[tone].soft)}>
            <Icon className="h-4.5 w-4.5" size={18} />
          </div>
        )}
        <div>
          <h3 className="font-bold text-slate-900 dark:text-white">{title}</h3>
          {subtitle && <p className="text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}

export function Badge({ tone = 'slate', children, className, icon: Icon }) {
  return (
    <span className={cx('inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1', TONES[tone]?.soft, className)}>
      {Icon && <Icon size={12} />}
      {children}
    </span>
  );
}

const BTN = {
  primary: 'bg-gradient-to-l from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/20 hover:brightness-110',
  secondary: 'bg-slate-100 text-slate-800 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700',
  ghost: 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800',
  danger: 'bg-rose-500/10 text-rose-600 ring-1 ring-rose-500/30 hover:bg-rose-500/20 dark:text-rose-400',
  outline: 'ring-1 ring-slate-300 text-slate-700 hover:bg-slate-50 dark:ring-slate-700 dark:text-slate-200 dark:hover:bg-slate-800',
  sky: 'bg-sky-500 text-white hover:bg-sky-600 shadow-lg shadow-sky-500/20',
  amber: 'bg-amber-500 text-white hover:bg-amber-600',
  rose: 'bg-rose-500 text-white hover:bg-rose-600',
};

export function Button({ variant = 'primary', size = 'md', icon: Icon, children, className, ...rest }) {
  const sz = size === 'sm' ? 'px-3 py-1.5 text-xs gap-1.5' : size === 'lg' ? 'px-5 py-3 text-base gap-2' : 'px-4 py-2 text-sm gap-2';
  return (
    <button
      type="button"
      className={cx('inline-flex items-center justify-center rounded-xl font-semibold transition disabled:cursor-not-allowed disabled:opacity-40 disabled:saturate-0', sz, BTN[variant], className)}
      {...rest}
    >
      {Icon && <Icon size={size === 'sm' ? 14 : 16} />}
      {children}
    </button>
  );
}

export function IconButton({ icon: Icon, title, className, ...rest }) {
  return (
    <button type="button" title={title} aria-label={title} className={cx('grid h-9 w-9 place-items-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white', className)} {...rest}>
      <Icon size={18} />
    </button>
  );
}

export function ProgressBar({ value = 0, tone = 'emerald', className, height = 'h-2', showLabel = false }) {
  const v = Math.max(0, Math.min(100, value));
  return (
    <div className={cx('flex items-center gap-2', className)}>
      <div className={cx('w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800', height)}>
        <div className={cx('h-full rounded-full transition-all duration-700', TONES[tone].bar)} style={{ width: `${v}%` }} />
      </div>
      {showLabel && <span className="w-10 shrink-0 text-left text-xs font-bold tabular-nums">{v}%</span>}
    </div>
  );
}

export function PhaseStepper({ total = 4, current = 1, discharged = false, titles = [] }) {
  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: total }).map((_, i) => {
        const n = i + 1;
        const done = discharged || n < current;
        const active = !discharged && n === current;
        return (
          <div key={n} className="flex flex-1 flex-col gap-1" title={titles[i]}>
            <div className={cx('h-1.5 rounded-full', done ? 'bg-emerald-500' : active ? 'bg-sky-500' : 'bg-slate-200 dark:bg-slate-800')} />
          </div>
        );
      })}
    </div>
  );
}

export function Modal({ open, onClose, title, subtitle, icon: Icon, children, footer, size = 'lg' }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === 'Escape' && onClose?.();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);
  if (!open) return null;
  const w = { sm: 'max-w-md', md: 'max-w-xl', lg: 'max-w-3xl', xl: 'max-w-5xl' }[size];
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/60 p-0 backdrop-blur-sm sm:items-center sm:p-4" onMouseDown={(e) => e.target === e.currentTarget && onClose?.()}>
      <div ref={ref} className={cx('animate-in flex max-h-[94vh] w-full flex-col overflow-hidden rounded-t-3xl border border-slate-200 bg-white shadow-2xl sm:rounded-3xl dark:border-slate-800 dark:bg-slate-900', w)}>
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-6 py-4 dark:border-slate-800">
          <div className="flex items-center gap-3">
            {Icon && (
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                <Icon size={20} />
              </div>
            )}
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">{title}</h2>
              {subtitle && <p className="text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>}
            </div>
          </div>
          <IconButton icon={X} title="إغلاق" onClick={onClose} />
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
        {footer && <div className="flex flex-wrap items-center justify-end gap-2 border-t border-slate-100 bg-slate-50/60 px-6 py-3 dark:border-slate-800 dark:bg-slate-950/40">{footer}</div>}
      </div>
    </div>
  );
}

export function ConfirmModal({ open, onClose, onConfirm, title, message, confirmText = 'تأكيد', tone = 'rose' }) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>إلغاء</Button>
          <Button variant={tone === 'rose' ? 'rose' : 'primary'} onClick={() => { onConfirm(); onClose(); }}>{confirmText}</Button>
        </>
      }
    >
      <p className="text-sm leading-7 text-slate-600 dark:text-slate-300">{message}</p>
    </Modal>
  );
}

export function Field({ label, hint, children, className, required }) {
  return (
    <label className={cx('flex flex-col gap-1.5', className)}>
      {label && (
        <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
          {label} {required && <span className="text-rose-500">*</span>}
        </span>
      )}
      {children}
      {hint && <span className="text-[11px] text-slate-400">{hint}</span>}
    </label>
  );
}

const inputCls = 'w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-950/60 dark:text-slate-100';

export function Input({ className, ...rest }) {
  return <input className={cx(inputCls, className)} {...rest} />;
}
export function Select({ className, children, ...rest }) {
  return (
    <select className={cx(inputCls, 'cursor-pointer', className)} {...rest}>
      {children}
    </select>
  );
}
export function Textarea({ className, ...rest }) {
  return <textarea className={cx(inputCls, 'min-h-[90px] leading-7', className)} {...rest} />;
}

export function Segmented({ options, value, onChange, className, size = 'md' }) {
  return (
    <div className={cx('flex flex-wrap gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-950/60', className)}>
      {options.map((o) => {
        const active = o.value === value;
        const tone = o.tone ? TONES[o.tone] : null;
        return (
          <button
            key={String(o.value)}
            type="button"
            onClick={() => onChange(o.value)}
            className={cx(
              'flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg font-semibold transition',
              size === 'sm' ? 'px-2 py-1 text-xs' : 'px-3 py-2 text-sm',
              active
                ? tone
                  ? cx(tone.solid, 'text-white shadow')
                  : 'bg-white text-slate-900 shadow dark:bg-slate-800 dark:text-white'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'
            )}
          >
            {o.icon && <o.icon size={14} />}
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

export function Tabs({ tabs, value, onChange }) {
  return (
    <div className="flex gap-1 overflow-x-auto border-b border-slate-200 dark:border-slate-800">
      {tabs.map((t) => (
        <button
          key={t.value}
          type="button"
          onClick={() => onChange(t.value)}
          className={cx(
            '-mb-px flex items-center gap-2 whitespace-nowrap border-b-2 px-4 py-2.5 text-sm font-semibold transition',
            value === t.value ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400' : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'
          )}
        >
          {t.icon && <t.icon size={16} />}
          {t.label}
          {t.count !== undefined && <span className="rounded-full bg-slate-200 px-1.5 text-[10px] dark:bg-slate-800">{t.count}</span>}
        </button>
      ))}
    </div>
  );
}

export function EmptyState({ icon: Icon, title, text, action }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-12 text-center">
      {Icon && (
        <div className="grid h-14 w-14 place-items-center rounded-2xl bg-slate-100 text-slate-400 dark:bg-slate-800">
          <Icon size={26} />
        </div>
      )}
      <div>
        <p className="font-bold text-slate-800 dark:text-slate-100">{title}</p>
        {text && <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{text}</p>}
      </div>
      {action}
    </div>
  );
}

export function StatCard({ icon: Icon, label, value, sub, tone = 'emerald', onClick }) {
  return (
    <Card className={cx('relative overflow-hidden p-5', onClick && 'cursor-pointer transition hover:-translate-y-0.5 hover:shadow-lg')} onClick={onClick}>
      <div className={cx('absolute -left-6 -top-6 h-24 w-24 rounded-full opacity-20 blur-2xl', TONES[tone].solid)} />
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">{label}</p>
          <p className="mt-2 text-3xl font-extrabold tabular-nums text-slate-900 dark:text-white">{value}</p>
          {sub && <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{sub}</p>}
        </div>
        <div className={cx('grid h-11 w-11 place-items-center rounded-2xl ring-1', TONES[tone].soft)}>
          <Icon size={22} />
        </div>
      </div>
    </Card>
  );
}

export function LightDot({ light, size = 10, pulse = false }) {
  const c = { green: 'bg-emerald-500 text-emerald-500', yellow: 'bg-amber-500 text-amber-500', red: 'bg-rose-500 text-rose-500' }[light] || 'bg-slate-400 text-slate-400';
  return <span className={cx('inline-block shrink-0 rounded-full', c, pulse && 'pulse-ring')} style={{ width: size, height: size }} />;
}

export function Avatar({ name = '', size = 'md', tone }) {
  const initials = name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join('');
  const palette = ['from-emerald-500 to-teal-600', 'from-sky-500 to-indigo-600', 'from-violet-500 to-fuchsia-600', 'from-amber-500 to-orange-600', 'from-rose-500 to-pink-600'];
  const idx = tone ?? [...name].reduce((s, c) => s + c.charCodeAt(0), 0) % palette.length;
  const sz = size === 'lg' ? 'h-16 w-16 text-xl' : size === 'sm' ? 'h-8 w-8 text-xs' : 'h-11 w-11 text-sm';
  return <div className={cx('grid shrink-0 place-items-center rounded-2xl bg-gradient-to-br font-bold text-white shadow', palette[idx], sz)}>{initials}</div>;
}

export function Toasts() {
  const { toasts } = useApp();
  const icons = { success: CheckCircle2, warning: AlertTriangle, info: Info, error: XCircle };
  const tones = { success: 'emerald', warning: 'amber', info: 'sky', error: 'rose' };
  return (
    <div className="pointer-events-none fixed bottom-4 left-4 z-[60] flex flex-col gap-2">
      {toasts.map((t) => {
        const I = icons[t.type] || Info;
        return (
          <div key={t.id} className={cx('animate-in pointer-events-auto flex items-center gap-2 rounded-xl border bg-white px-4 py-3 text-sm font-semibold shadow-xl dark:bg-slate-900', TONES[tones[t.type]].border)}>
            <I size={18} className={TONES[tones[t.type]].text} />
            {t.msg}
          </div>
        );
      })}
    </div>
  );
}

export function SectionTitle({ children, action }) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200">{children}</h3>
      {action}
    </div>
  );
}
