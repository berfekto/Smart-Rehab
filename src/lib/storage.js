/**
 * طبقة التخزين (Storage Adapter)
 * الافتراضي: LocalStorage. الواجهة موحدة (load / save / clear) بحيث يمكن استبدالها
 * بمحول Supabase أو IndexedDB دون تعديل باقي التطبيق — راجع supabase/schema.sql.
 */

const KEY = 'sros.state.v1';

export const localStorageAdapter = {
  name: 'localStorage',
  load() {
    try {
      const raw = localStorage.getItem(KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      console.error('Storage load failed', e);
      return null;
    }
  },
  save(state) {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
      return true;
    } catch (e) {
      console.error('Storage save failed', e);
      return false;
    }
  },
  clear() {
    localStorage.removeItem(KEY);
  },
};

export const storage = localStorageAdapter;

export function exportJSON(state) {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `smart-rehab-backup-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function readJSONFile(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => {
      try {
        resolve(JSON.parse(r.result));
      } catch (e) {
        reject(new Error('ملف غير صالح'));
      }
    };
    r.onerror = () => reject(new Error('تعذر قراءة الملف'));
    r.readAsText(file);
  });
}
