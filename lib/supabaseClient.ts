import { createClient } from '@supabase/supabase-js';
import { EXERCISES_FULL } from './exercises-full';

// Tự động lưu trữ trên trình duyệt (localStorage) độc lập, không cần file ngoài
const memoryStorage = new Map<string, string>();
const authStorage = {
  getItem(key: string): string | null {
    if (typeof window === 'undefined') return null;
    if (memoryStorage.has(key)) return memoryStorage.get(key) ?? null;
    for (const store of ['localStorage', 'sessionStorage'] as const) {
      try {
        const val = window[store].getItem(key);
        if (val !== null) return val;
      } catch {}
    }
    return null;
  },
  setItem(key: string, value: string) {
    if (typeof window === 'undefined') return;
    memoryStorage.set(key, value);
    try {
      window.localStorage.setItem(key, value);
    } catch {}
  },
  removeItem(key: string) {
    memoryStorage.delete(key);
    if (typeof window === 'undefined') return;
    for (const store of ['localStorage', 'sessionStorage'] as const) {
      try {
        window[store].removeItem(key);
      } catch {}
    }
  },
};

const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const rawKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isRealSupabaseConfigured =
  typeof rawUrl === 'string' &&
  rawUrl.length > 0 &&
  rawUrl !== 'undefined' &&
  !rawUrl.includes('placeholder') &&
  rawUrl.startsWith('http') &&
  typeof rawKey === 'string' &&
  rawKey.length > 0 &&
  rawKey !== 'undefined' &&
  !rawKey.includes('placeholder');

export const isSupabaseConfigured = true;

const STORAGE_DB_KEY = 'pogym_mock_database_v4';
const STORAGE_SESSION_KEY = 'pogym_mock_session_v2';

const DEMO_USER = {
  id: 'usr_demo_1',
  email: 'athlete@pogym.app',
  user_metadata: { name: 'Demo Athlete' },
};

function getTodayOffset(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().split('T')[0];
}

function getInitialDatabase() {
  return {
    // Full 70 bài verified từ Lyfta (giữ nguyên id ex_1..ex_12 cho routine/state cũ)
    exercises_library: EXERCISES_FULL,
    workout_routines: [
      { id: 'rt_push', user_id: 'usr_demo_1', name: 'Đẩy ngực & Vai (Push A)', created_at: '2026-03-01T08:00:00Z' },
      { id: 'rt_legs', user_id: 'usr_demo_1', name: 'Chân & Bụng (Legs Focus)', created_at: '2026-03-02T08:00:00Z' },
      { id: 'rt_pull', user_id: 'usr_demo_1', name: 'Lưng & Tay trước (Pull A)', created_at: '2026-03-03T08:00:00Z' },
    ],
    routine_exercises: [
      { id: 're_1', routine_id: 'rt_push', exercise_id: 'ex_1', order_index: 1 },
      { id: 're_2', routine_id: 'rt_push', exercise_id: 'ex_2', order_index: 2 },
      { id: 're_3', routine_id: 'rt_push', exercise_id: 'ex_3', order_index: 3 },
      { id: 're_4', routine_id: 'rt_push', exercise_id: 'ex_9', order_index: 4 },
      { id: 're_5', routine_id: 'rt_legs', exercise_id: 'ex_4', order_index: 1 },
      { id: 're_6', routine_id: 'rt_legs', exercise_id: 'ex_5', order_index: 2 },
      { id: 're_7', routine_id: 'rt_legs', exercise_id: 'ex_11', order_index: 3 },
      { id: 're_8', routine_id: 'rt_legs', exercise_id: 'ex_12', order_index: 4 },
      { id: 're_9', routine_id: 'rt_pull', exercise_id: 'ex_6', order_index: 1 },
      { id: 're_10', routine_id: 'rt_pull', exercise_id: 'ex_7', order_index: 2 },
      { id: 're_11', routine_id: 'rt_pull', exercise_id: 'ex_10', order_index: 3 },
    ],
    user_exercise_state: [
      { id: 'ues_1', user_id: 'usr_demo_1', exercise_id: 'ex_1', current_weight: 60, target_reps: [10, 10, 10], plateau_count: 0, is_calibrating: false, last_reps: [10, 10, 10] },
      { id: 'ues_2', user_id: 'usr_demo_1', exercise_id: 'ex_2', current_weight: 22, target_reps: [10, 9, 8], plateau_count: 0, is_calibrating: false, last_reps: [10, 9, 8] },
      { id: 'ues_3', user_id: 'usr_demo_1', exercise_id: 'ex_3', current_weight: 40, target_reps: [8, 8, 8], plateau_count: 0, is_calibrating: false, last_reps: [8, 8, 8] },
      { id: 'ues_4', user_id: 'usr_demo_1', exercise_id: 'ex_9', current_weight: 25, target_reps: [12, 12, 11], plateau_count: 0, is_calibrating: false, last_reps: [12, 12, 11] },
      { id: 'ues_5', user_id: 'usr_demo_1', exercise_id: 'ex_4', current_weight: 80, target_reps: [8, 8, 7, 6], plateau_count: 0, is_calibrating: false, last_reps: [8, 8, 7, 6] },
      { id: 'ues_6', user_id: 'usr_demo_1', exercise_id: 'ex_5', current_weight: 70, target_reps: [10, 10, 10], plateau_count: 0, is_calibrating: false, last_reps: [10, 10, 10] },
      { id: 'ues_7', user_id: 'usr_demo_1', exercise_id: 'ex_11', current_weight: 120, target_reps: [12, 12, 12], plateau_count: 0, is_calibrating: false, last_reps: [12, 12, 12] },
      { id: 'ues_8', user_id: 'usr_demo_1', exercise_id: 'ex_12', current_weight: 45, target_reps: [15, 14, 12, 12], plateau_count: 0, is_calibrating: false, last_reps: [15, 14, 12, 12] },
      { id: 'ues_9', user_id: 'usr_demo_1', exercise_id: 'ex_6', current_weight: 55, target_reps: [10, 10, 10], plateau_count: 0, is_calibrating: false, last_reps: [10, 10, 10] },
      { id: 'ues_10', user_id: 'usr_demo_1', exercise_id: 'ex_7', current_weight: 50, target_reps: [8, 8, 8], plateau_count: 0, is_calibrating: false, last_reps: [8, 8, 8] },
      { id: 'ues_11', user_id: 'usr_demo_1', exercise_id: 'ex_10', current_weight: 14, target_reps: [12, 10, 10], plateau_count: 0, is_calibrating: false, last_reps: [12, 10, 10] },
    ],
    workout_logs: [
      { id: 'log_1', user_id: 'usr_demo_1', workout_date: getTodayOffset(1), routine_name: 'Đẩy ngực & Vai (Push A)', level: 2, summary: 'Hoàn thành trọn vẹn 4 bài tập.' },
      { id: 'log_2', user_id: 'usr_demo_1', workout_date: getTodayOffset(2), routine_name: 'Chân & Bụng (Legs Focus)', level: 2, summary: 'Tập tốt, squat chạm trần rep.' },
      { id: 'log_3', user_id: 'usr_demo_1', workout_date: getTodayOffset(4), routine_name: 'Lưng & Tay trước (Pull A)', level: 1, summary: 'Kẹt rep bài chèo lưng.' },
      { id: 'log_4', user_id: 'usr_demo_1', workout_date: getTodayOffset(5), routine_name: 'Đẩy ngực & Vai (Push A)', level: 2, summary: 'Hoàn thành tốt set tạ nặng.' },
      { id: 'log_5', user_id: 'usr_demo_1', workout_date: getTodayOffset(7), routine_name: 'Chân & Bụng (Legs Focus)', level: 2, summary: 'Chân lên tạ đều đặn.' },
      { id: 'log_6', user_id: 'usr_demo_1', workout_date: getTodayOffset(9), routine_name: 'Lưng & Tay trước (Pull A)', level: 2, summary: 'Khóa tạ chuẩn form.' },
      { id: 'log_7', user_id: 'usr_demo_1', workout_date: getTodayOffset(12), routine_name: 'Đẩy ngực & Vai (Push A)', level: 2, summary: 'Buổi tập năng lượng cao.' },
      { id: 'log_8', user_id: 'usr_demo_1', workout_date: getTodayOffset(14), routine_name: 'Chân & Bụng (Legs Focus)', level: 1, summary: 'Thiếu 1 rep bài RDL.' },
      { id: 'log_9', user_id: 'usr_demo_1', workout_date: getTodayOffset(16), routine_name: 'Lưng & Tay trước (Pull A)', level: 2, summary: 'Tay trước pump căng.' },
      { id: 'log_10', user_id: 'usr_demo_1', workout_date: getTodayOffset(20), routine_name: 'Đẩy ngực & Vai (Push A)', level: 2, summary: 'Hoàn thành buổi tập.' },
    ],
    profiles: [
      { id: 'usr_demo_1', email: 'athlete@pogym.app', has_microplates: true },
    ],
  };
}

let inMemoryDb: any = null;

function getMockDb(): any {
  if (typeof window === 'undefined') {
    if (!inMemoryDb) inMemoryDb = getInitialDatabase();
    return inMemoryDb;
  }
  try {
    const raw = localStorage.getItem(STORAGE_DB_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  const initial = getInitialDatabase();
  saveMockDb(initial);
  return initial;
}

function saveMockDb(db: any) {
  if (typeof window === 'undefined') {
    inMemoryDb = db;
    return;
  }
  try {
    localStorage.setItem(STORAGE_DB_KEY, JSON.stringify(db));
  } catch {}
}

function getStoredSession() {
  const raw = authStorage.getItem(STORAGE_SESSION_KEY);
  if (raw) {
    try {
      return JSON.parse(raw);
    } catch {}
  }
  const defaultSession = {
    user: DEMO_USER,
    access_token: 'mock_access_token_demo',
    expires_at: Date.now() + 86400000 * 30,
  };
  authStorage.setItem(STORAGE_SESSION_KEY, JSON.stringify(defaultSession));
  return defaultSession;
}

function setStoredSession(session: any) {
  if (session) {
    authStorage.setItem(STORAGE_SESSION_KEY, JSON.stringify(session));
  } else {
    authStorage.removeItem(STORAGE_SESSION_KEY);
  }
}

const authListeners = new Set<(event: string, session: any) => void>();

class MockQueryBuilder {
  private table: string;
  private action: 'select' | 'insert' | 'update' | 'upsert' | 'delete' = 'select';
  private payload: any = null;
  private filters: Array<(row: any) => boolean> = [];
  private orderCol: string | null = null;
  private orderAsc: boolean = true;
  private isSingle: boolean = false;
  private upsertConflictCols: string[] = [];

  constructor(table: string) {
    this.table = table;
  }

  select(_columns: string = '*') {
    if (this.action !== 'insert') this.action = 'select';
    return this;
  }

  eq(column: string, value: any) {
    this.filters.push((row) => String(row[column]) === String(value));
    return this;
  }

  in(column: string, values: any[]) {
    const valSet = new Set(values.map(String));
    this.filters.push((row) => valSet.has(String(row[column])));
    return this;
  }

  order(column: string, options?: { ascending?: boolean }) {
    this.orderCol = column;
    this.orderAsc = options?.ascending !== false;
    return this;
  }

  single() {
    this.isSingle = true;
    return this;
  }

  insert(data: any) {
    this.action = 'insert';
    this.payload = data;
    return this;
  }

  update(data: any) {
    this.action = 'update';
    this.payload = data;
    return this;
  }

  upsert(data: any, options?: { onConflict?: string }) {
    this.action = 'upsert';
    this.payload = data;
    if (options?.onConflict) {
      this.upsertConflictCols = options.onConflict.split(',').map((s) => s.trim());
    }
    return this;
  }

  delete() {
    this.action = 'delete';
    return this;
  }

  async execute() {
    const db = getMockDb();
    const rows = (db[this.table] = db[this.table] || []);

    if (this.action === 'select') {
      let filtered = rows.filter((row: any) => this.filters.every((f) => f(row)));
      if (this.orderCol) {
        filtered = [...filtered].sort((a: any, b: any) => {
          const valA = a[this.orderCol!];
          const valB = b[this.orderCol!];
          if (valA === valB) return 0;
          if (valA === undefined) return 1;
          if (valB === undefined) return -1;
          const res = valA > valB ? 1 : -1;
          return this.orderAsc ? res : -res;
        });
      }
      return {
        data: this.isSingle ? (filtered[0] ?? null) : filtered,
        error: null,
      };
    }

    if (this.action === 'insert') {
      const items = Array.isArray(this.payload) ? this.payload : [this.payload];
      const inserted = items.map((item) => ({
        id: item.id || `id_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        created_at: item.created_at || new Date().toISOString(),
        ...item,
      }));
      rows.push(...inserted);
      saveMockDb(db);
      return {
        data: this.isSingle ? inserted[0] : (Array.isArray(this.payload) ? inserted : inserted[0]),
        error: null,
      };
    }

    if (this.action === 'update') {
      let count = 0;
      rows.forEach((row: any, i: number) => {
        if (this.filters.every((f) => f(row))) {
          rows[i] = { ...row, ...this.payload };
          count++;
        }
      });
      saveMockDb(db);
      return { data: count, error: null };
    }

    if (this.action === 'delete') {
      const remaining = rows.filter((row: any) => !this.filters.every((f) => f(row)));
      db[this.table] = remaining;
      saveMockDb(db);
      return { data: null, error: null };
    }

    if (this.action === 'upsert') {
      const items = Array.isArray(this.payload) ? this.payload : [this.payload];
      const conflictKeys = this.upsertConflictCols.length > 0 ? this.upsertConflictCols : ['id'];
      items.forEach((item) => {
        const existingIdx = rows.findIndex((r: any) =>
          conflictKeys.every((key) => String(r[key]) === String(item[key]))
        );
        if (existingIdx !== -1) {
          rows[existingIdx] = { ...rows[existingIdx], ...item };
        } else {
          rows.push({
            id: item.id || `id_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
            created_at: item.created_at || new Date().toISOString(),
            ...item,
          });
        }
      });
      saveMockDb(db);
      return { data: items, error: null };
    }

    return { data: null, error: null };
  }

  then<TResult1 = any, TResult2 = never>(
    onfulfilled?: ((value: any) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null
  ): Promise<TResult1 | TResult2> {
    return this.execute().then(onfulfilled, onrejected);
  }
}

function createMockSupabaseClient(): any {
  return {
    auth: {
      async getSession() {
        const session = getStoredSession();
        return { data: { session }, error: null };
      },
      async getUser() {
        const session = getStoredSession();
        return { data: { user: session?.user ?? null }, error: null };
      },
      onAuthStateChange(callback: (event: string, session: any) => void) {
        authListeners.add(callback);
        return {
          data: {
            subscription: {
              unsubscribe: () => {
                authListeners.delete(callback);
              },
            },
          },
        };
      },
      async signInWithPassword({ email }: { email: string; password?: string }) {
        const user = { id: `usr_${Date.now().toString(36)}`, email, user_metadata: { name: email.split('@')[0] } };
        const session = { user, access_token: 'mock_jwt_token', expires_at: Date.now() + 86400000 };
        setStoredSession(session);
        authListeners.forEach((fn) => fn('SIGNED_IN', session));
        return { data: { user, session }, error: null };
      },
      async signUp({ email }: { email: string; password?: string; options?: any }) {
        const user = { id: `usr_${Date.now().toString(36)}`, email, user_metadata: { name: email.split('@')[0] } };
        const session = { user, access_token: 'mock_jwt_token', expires_at: Date.now() + 86400000 };
        setStoredSession(session);
        authListeners.forEach((fn) => fn('SIGNED_IN', session));
        return { data: { user, session }, error: null };
      },
      async resetPasswordForEmail(_email: string, _options?: any) {
        return { data: {}, error: null };
      },
      async updateUser({ password: _password }: { password?: string }) {
        const session = getStoredSession();
        return { data: { user: session?.user ?? DEMO_USER }, error: null };
      },
      async resend({ email: _email }: { type?: string; email?: string }) {
        return { data: {}, error: null };
      },
      async signInWithOAuth({ provider: _provider }: { provider: string; options?: any }) {
        const session = { user: DEMO_USER, access_token: 'mock_jwt_token', expires_at: Date.now() + 86400000 };
        setStoredSession(session);
        authListeners.forEach((fn) => fn('SIGNED_IN', session));
        return { data: { user: DEMO_USER, session }, error: null };
      },
      async signOut() {
        setStoredSession(null);
        authListeners.forEach((fn) => fn('SIGNED_OUT', null));
        return { error: null };
      },
    },
    from(table: string) {
      return new MockQueryBuilder(table);
    },
  };
}

const createRealSupabaseClient = () =>
  createClient(rawUrl!, rawKey!, {
    auth: { storage: authStorage },
  });

const browserCache = globalThis as typeof globalThis & {
  gymProgressionSupabase?: any;
};

export const supabase: any = isRealSupabaseConfigured
  ? (process.env.NODE_ENV === 'development' && typeof window !== 'undefined'
      ? (browserCache.gymProgressionSupabase ??= createRealSupabaseClient())
      : createRealSupabaseClient())
  : createMockSupabaseClient();
