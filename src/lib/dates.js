/** أدوات التاريخ والحسابات الزمنية */

const DAY = 24 * 60 * 60 * 1000;

export const todayISO = () => toISODate(new Date());

export function toISODate(d) {
  const dt = d instanceof Date ? d : new Date(d);
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, '0');
  const day = String(dt.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function daysAgoISO(n) {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() - n);
  return toISODate(d);
}

export function parseDate(s) {
  if (!s) return null;
  const [y, m, d] = String(s).slice(0, 10).split('-').map(Number);
  if (!y) return null;
  return new Date(y, m - 1, d, 12, 0, 0, 0);
}

export function daysBetween(a, b = new Date()) {
  const da = a instanceof Date ? a : parseDate(a);
  const db = b instanceof Date ? b : parseDate(b);
  if (!da || !db) return null;
  const na = new Date(da.getFullYear(), da.getMonth(), da.getDate());
  const nb = new Date(db.getFullYear(), db.getMonth(), db.getDate());
  return Math.round((nb - na) / DAY);
}

const AR_MONTHS = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
const AR_DAYS = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

export function formatDate(s, { withDay = false } = {}) {
  const d = s instanceof Date ? s : parseDate(s);
  if (!d) return '—';
  const base = `${d.getDate()} ${AR_MONTHS[d.getMonth()]} ${d.getFullYear()}`;
  return withDay ? `${AR_DAYS[d.getDay()]}، ${base}` : base;
}

export function formatShort(s) {
  const d = s instanceof Date ? s : parseDate(s);
  if (!d) return '—';
  return `${d.getDate()}/${d.getMonth() + 1}`;
}

export function relativeDays(s) {
  const n = daysBetween(s);
  if (n === null) return '—';
  if (n === 0) return 'اليوم';
  if (n === 1) return 'أمس';
  if (n === -1) return 'غداً';
  if (n > 0) return `منذ ${n} يوم`;
  return `بعد ${Math.abs(n)} يوم`;
}
