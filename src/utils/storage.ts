export type User = {
  id: string;
  name: string;
  email: string;
  password: string;
};

export type CalendarEvent = {
  id: string;
  date: string; // ISO format YYYY-MM-DD
  title: string;
  description: string;
  imageDataUrl?: string | null;
  createdBy: string;
  locationName?: string | null;
  locationLat?: number | null;
  locationLon?: number | null;
};

export type TodoItem = {
  id: string;
  text: string;
  completed: boolean;
  createdBy: string;
};

export type DiaryEntry = {
  id: string;
  date: string; // ISO format YYYY-MM-DD
  content: string;
  createdBy: string;
  createdAt: string;
};

const USERS_KEY = 'shared-app-users';
const EVENTS_KEY = 'shared-app-events';
const TODOS_KEY = 'shared-app-todos';
const DIARY_KEY = 'shared-app-diaries';

function loadFromStorage<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined' || !window.localStorage) {
    return fallback;
  }

  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch (error) {
    console.error(`Failed to load "${key}" from localStorage`, error);
    return fallback;
  }
}

function saveToStorage<T>(key: string, value: T) {
  if (typeof window === 'undefined' || !window.localStorage) {
    return;
  }

  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Failed to save "${key}" to localStorage`, error);
  }
}

export const storage = {
  users: {
    load: () => loadFromStorage<User[]>(USERS_KEY, []),
    save: (users: User[]) => saveToStorage(USERS_KEY, users),
  },
  events: {
    load: () => loadFromStorage<CalendarEvent[]>(EVENTS_KEY, []),
    save: (events: CalendarEvent[]) => saveToStorage(EVENTS_KEY, events),
  },
  todos: {
    load: () => loadFromStorage<TodoItem[]>(TODOS_KEY, []),
    save: (todos: TodoItem[]) => saveToStorage(TODOS_KEY, todos),
  },
  diaries: {
    load: () => loadFromStorage<DiaryEntry[]>(DIARY_KEY, []),
    save: (entries: DiaryEntry[]) => saveToStorage(DIARY_KEY, entries),
  },
};
