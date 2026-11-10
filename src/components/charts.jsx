import { useState } from 'react';
import { formatShort, formatDate } from '../lib/dates';
import { EFFUSION_LEVELS, NERVE_LEVELS } from '../lib/engine';

const LIGHT_HEX = { green: '#10b981', yellow: '#f59e0b', red: '#f43f5e' };

/**
 * مخطط اتجاه الأعراض: الألم (خط) + الارتشاح (أعمدة) + مناطق الإشارة الضوئية
 */
export function SymptomTrendChart({ sessions = [], height = 240, showNerve = false }) {
  const [hover, setHover] = useState(null);
  if (!sessions.length) {
    return <div className="grid h-40 place-items-center text-sm text-slate-400">لا توجد جلسات مسجلة بعد لعرض الاتجاه</div>;
  }
  const W = 640;
  const H = height;
  const pad = { l: 34, r: 34, t: 16, b: 34 };
  const iw = W - pad.l - pad.r;
  const ih = H - pad.t - pad.b;
  const n = sessions.length;
  const x = (i) => pad.l + (n === 1 ? iw / 2 : (i / (n - 1)) * iw);
  const y = (v) => pad.t + ih - (v / 10) * ih;
  const barW = Math.max(6, Math.min(26, (iw / Math.max(n, 1)) * 0.45));

  const painPts = sessions.map((s, i) => [x(i), y(Number(s.pain) || 0)]);
  const path = painPts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
  const area = `${path} L${painPts[n - 1][0]},${y(0)} L${painPts[0][0]},${y(0)} Z`;
  const nervePath = sessions.map((s, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(((Number(s.nerve) || 0) / 3) * 10).toFixed(1)}`).join(' ');
  const h = hover !== null ? sessions[hover] : null;

  return (
    <div className="relative" dir="ltr">
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full select-none" onMouseLeave={() => setHover(null)}>
        <defs>
          <linearGradient id="painArea" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="#f43f5e" stopOpacity="0.28" />
            <stop offset="1" stopColor="#f43f5e" stopOpacity="0" />
          </linearGradient>
        </defs>
        {/* zones */}
        <rect x={pad.l} y={y(10)} width={iw} height={y(6.5) - y(10)} fill="#f43f5e" opacity="0.06" />
        <rect x={pad.l} y={y(6.5)} width={iw} height={y(3.5) - y(6.5)} fill="#f59e0b" opacity="0.06" />
        <rect x={pad.l} y={y(3.5)} width={iw} height={y(0) - y(3.5)} fill="#10b981" opacity="0.05" />
        {[0, 2, 4, 6, 8, 10].map((v) => (
          <g key={v}>
            <line x1={pad.l} x2={W - pad.r} y1={y(v)} y2={y(v)} stroke="currentColor" className="text-slate-200 dark:text-slate-800" strokeDasharray={v === 0 ? '' : '3 4'} />
            <text x={pad.l - 8} y={y(v) + 4} textAnchor="end" fontSize="10" className="fill-slate-400">{v}</text>
          </g>
        ))}
        {[0, 1, 2, 3].map((v) => (
          <text key={v} x={W - pad.r + 8} y={y((v / 3) * 10) + 4} fontSize="10" className="fill-sky-400">{EFFUSION_LEVELS[v].short}</text>
        ))}
        {/* effusion bars */}
        {sessions.map((s, i) => {
          const v = ((Number(s.effusion) || 0) / 3) * 10;
          return <rect key={`b${i}`} x={x(i) - barW / 2} y={y(v)} width={barW} height={Math.max(0, y(0) - y(v))} rx="4" fill="#0ea5e9" opacity={hover === i ? 0.55 : 0.3} />;
        })}
        <path d={area} fill="url(#painArea)" />
        <path d={path} fill="none" stroke="#f43f5e" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
        {showNerve && <path d={nervePath} fill="none" stroke="#8b5cf6" strokeWidth="2" strokeDasharray="5 4" />}
        {sessions.map((s, i) => (
          <g key={`p${i}`}>
            <circle cx={painPts[i][0]} cy={painPts[i][1]} r={hover === i ? 7 : 5} fill={LIGHT_HEX[s.light] || '#94a3b8'} stroke="white" strokeWidth="2" />
            <text x={x(i)} y={H - 12} textAnchor="middle" fontSize="10" className="fill-slate-400">{formatShort(s.date)}</text>
            <rect x={x(i) - iw / Math.max(n, 1) / 2} y={pad.t} width={iw / Math.max(n, 1)} height={ih} fill="transparent" onMouseEnter={() => setHover(i)} onTouchStart={() => setHover(i)} />
          </g>
        ))}
      </svg>
      {h && (
        <div className="pointer-events-none absolute top-2 rounded-xl border border-slate-200 bg-white/95 px-3 py-2 text-xs shadow-xl dark:border-slate-700 dark:bg-slate-900/95" style={{ left: `${Math.min(70, Math.max(2, (x(hover) / W) * 100 - 10))}%` }} dir="rtl">
          <p className="mb-1 font-bold">{formatDate(h.date)}</p>
          <p>الألم: <b className="text-rose-500">{h.pain}/10</b></p>
          <p>الارتشاح: <b className="text-sky-500">{EFFUSION_LEVELS[h.effusion]?.label}</b></p>
          {showNerve && <p>عصبي: <b className="text-violet-500">{NERVE_LEVELS[h.nerve || 0]?.label}</b></p>}
          {h.rom !== '' && h.rom !== undefined && h.rom !== null && <p>المدى: <b>{h.rom}</b></p>}
        </div>
      )}
      <div className="mt-2 flex flex-wrap items-center justify-center gap-4 text-[11px] text-slate-500" dir="rtl">
        <span className="flex items-center gap-1.5"><span className="h-0.5 w-4 bg-rose-500" /> الألم (0-10)</span>
        <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-sky-500/40" /> الارتشاح/التورم</span>
        {showNerve && <span className="flex items-center gap-1.5"><span className="h-0.5 w-4 border-t-2 border-dashed border-violet-500" /> الأعراض العصبية</span>}
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /><span className="h-2.5 w-2.5 rounded-full bg-amber-500" /><span className="h-2.5 w-2.5 rounded-full bg-rose-500" /> إشارة الجلسة</span>
      </div>
    </div>
  );
}

/** مخطط تطور المدى الحركي */
export function RomChart({ sessions = [], target, unit = '°', inverted = false, height = 150 }) {
  const data = sessions.filter((s) => s.rom !== '' && s.rom !== null && s.rom !== undefined && !Number.isNaN(Number(s.rom)));
  if (data.length < 1) return <div className="grid h-28 place-items-center text-sm text-slate-400">لا توجد قياسات للمدى الحركي</div>;
  const W = 640;
  const H = height;
  const pad = { l: 34, r: 16, t: 14, b: 28 };
  const vals = data.map((d) => Number(d.rom));
  const all = target !== undefined ? [...vals, Number(target)] : vals;
  let min = Math.min(...all);
  let max = Math.max(...all);
  if (max - min < 10) { max += 5; min -= 5; }
  min = Math.max(0, Math.floor(min - 5));
  max = Math.ceil(max + 5);
  const iw = W - pad.l - pad.r;
  const ih = H - pad.t - pad.b;
  const n = data.length;
  const x = (i) => pad.l + (n === 1 ? iw / 2 : (i / (n - 1)) * iw);
  const y = (v) => pad.t + ih - ((v - min) / (max - min)) * ih;
  const path = data.map((d, i) => `${i ? 'L' : 'M'}${x(i)},${y(Number(d.rom))}`).join(' ');
  return (
    <div dir="ltr">
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full">
        {[min, (min + max) / 2, max].map((v, i) => (
          <g key={i}>
            <line x1={pad.l} x2={W - pad.r} y1={y(v)} y2={y(v)} stroke="currentColor" className="text-slate-200 dark:text-slate-800" strokeDasharray="3 4" />
            <text x={pad.l - 6} y={y(v) + 4} textAnchor="end" fontSize="10" className="fill-slate-400">{Math.round(v)}</text>
          </g>
        ))}
        {target !== undefined && (
          <g>
            <line x1={pad.l} x2={W - pad.r} y1={y(Number(target))} y2={y(Number(target))} stroke="#10b981" strokeWidth="1.5" strokeDasharray="6 4" />
            <text x={W - pad.r} y={y(Number(target)) - 5} textAnchor="end" fontSize="10" fill="#10b981">الهدف {target}{unit}</text>
          </g>
        )}
        <path d={path} fill="none" stroke="#0ea5e9" strokeWidth="2.5" strokeLinejoin="round" />
        {data.map((d, i) => (
          <g key={i}>
            <circle cx={x(i)} cy={y(Number(d.rom))} r="4.5" fill="#0ea5e9" stroke="white" strokeWidth="2" />
            <text x={x(i)} y={y(Number(d.rom)) - 9} textAnchor="middle" fontSize="10" className="fill-slate-500 dark:fill-slate-300">{d.rom}</text>
            <text x={x(i)} y={H - 8} textAnchor="middle" fontSize="10" className="fill-slate-400">{formatShort(d.date)}</text>
          </g>
        ))}
      </svg>
      {inverted && <p className="text-center text-[11px] text-slate-400" dir="rtl">القيمة الأقل = تحسن</p>}
    </div>
  );
}

/** حلقة دائرية للتوزيع */
export function Donut({ segments, size = 150, stroke = 18, center }) {
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  let offset = 0;
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" strokeWidth={stroke} className="text-slate-100 dark:text-slate-800" />
        {segments.map((s, i) => {
          const len = (s.value / total) * c;
          const el = (
            <circle key={i} cx={size / 2} cy={size / 2} r={r} fill="none" stroke={s.color} strokeWidth={stroke} strokeDasharray={`${len} ${c - len}`} strokeDashoffset={-offset} strokeLinecap={s.value ? 'butt' : 'butt'} />
          );
          offset += len;
          return el;
        })}
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">{center}</div>
    </div>
  );
}

/** مؤشر دائري للتقدم */
export function RingProgress({ value = 0, size = 88, stroke = 9, color = '#10b981', children }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const len = (Math.max(0, Math.min(100, value)) / 100) * c;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" strokeWidth={stroke} className="text-slate-100 dark:text-slate-800" />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeDasharray={`${len} ${c}`} strokeLinecap="round" style={{ transition: 'stroke-dasharray .7s' }} />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">{children}</div>
    </div>
  );
}

/** خط صغير (Sparkline) */
export function Sparkline({ values = [], width = 90, height = 28, color = '#f43f5e', max = 10 }) {
  if (values.length < 2) return <span className="text-xs text-slate-400">—</span>;
  const x = (i) => (i / (values.length - 1)) * (width - 4) + 2;
  const y = (v) => height - 2 - (v / max) * (height - 4);
  const d = values.map((v, i) => `${i ? 'L' : 'M'}${x(i)},${y(v)}`).join(' ');
  return (
    <svg width={width} height={height} dir="ltr">
      <path d={d} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={x(values.length - 1)} cy={y(values[values.length - 1])} r="3" fill={color} />
    </svg>
  );
}
