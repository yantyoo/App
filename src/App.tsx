import { useEffect, useMemo, useRef, useState } from "react";
import "./App.css";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import type { LatLngTuple } from "leaflet";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import { buildCalendar, toISODate } from "./utils/date";
import { storage } from "./utils/storage";
import type { CalendarEvent, DiaryEntry, TodoItem, User } from "./utils/storage";
import type { FormEvent } from "react";

type AuthMode = "login" | "signup";
type ViewKey = "schedule" | "places" | "diary" | "mypage";

type SignupForm = {
  name: string;
  email: string;
  password: string;
};

type LoginForm = {
  email: string;
  password: string;
};

type EventForm = {
  title: string;
  description: string;
  imageFile: File | null;
  locationName: string;
  locationLat: number | null;
  locationLon: number | null;
};

type ProfileForm = {
  name: string;
  password: string;
  confirmPassword: string;
};

type DiaryForm = {
  date: string;
  content: string;
};

type PlaceResult = {
  id: string;
  title: string;
  displayName: string;
  lat: number;
  lon: number;
};

L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const initialSignup: SignupForm = { name: "", email: "", password: "" };
const initialLogin: LoginForm = { email: "", password: "" };
const initialEventForm: EventForm = {
  title: "",
  description: "",
  imageFile: null,
  locationName: "",
  locationLat: null,
  locationLon: null,
};
const initialProfileForm: ProfileForm = {
  name: "",
  password: "",
  confirmPassword: "",
};
const initialDiaryForm: DiaryForm = {
  date: toISODate(new Date()),
  content: "",
};

const formatMonthLabel = (date: Date) =>
  `${date.getFullYear()}/${date.getMonth() + 1}`;

const fileToDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
function App() {
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [signupForm, setSignupForm] = useState<SignupForm>(initialSignup);
  const [loginForm, setLoginForm] = useState<LoginForm>(initialLogin);
  const [eventForm, setEventForm] = useState<EventForm>(initialEventForm);
  const [todoText, setTodoText] = useState("");
  const [users, setUsers] = useState<User[]>(() => storage.users.load());
  const [events, setEvents] = useState<CalendarEvent[]>(() => storage.events.load());
  const [todos, setTodos] = useState<TodoItem[]>(() => storage.todos.load());
  const [diaries, setDiaries] = useState<DiaryEntry[]>(() => storage.diaries.load());
  const [profileForm, setProfileForm] = useState<ProfileForm>(initialProfileForm);
  const [diaryForm, setDiaryForm] = useState<DiaryForm>(initialDiaryForm);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [monthCursor, setMonthCursor] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });
  const [selectedDate, setSelectedDate] = useState(() => toISODate(new Date()));
  const [activeView, setActiveView] = useState<ViewKey>("schedule");
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [placeQuery, setPlaceQuery] = useState("");
  const [placeResults, setPlaceResults] = useState<PlaceResult[]>([]);
  const [isSearchingPlaces, setIsSearchingPlaces] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState<PlaceResult | null>(null);
  const [mapCenter, setMapCenter] = useState<LatLngTuple>([37.5665, 126.978]);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const seededUsersRef = useRef(false);

  useEffect(() => storage.users.save(users), [users]);
  useEffect(() => {
    if (seededUsersRef.current) return;
    if (users.length === 0) {
      const defaultUser: User = {
        id: crypto.randomUUID(),
        name: "Demo User",
        email: "1234",
        password: "1234",
      };
      setUsers([defaultUser]);
    }
    seededUsersRef.current = true;
  }, [users]);
  useEffect(() => storage.events.save(events), [events]);
  useEffect(() => storage.todos.save(todos), [todos]);
  useEffect(() => storage.diaries.save(diaries), [diaries]);

  const calendarCells = useMemo(
    () => buildCalendar(monthCursor.getFullYear(), monthCursor.getMonth()),
    [monthCursor],
  );

  const eventsForSelectedDate = useMemo(
    () => events.filter((item) => item.date === selectedDate),
    [events, selectedDate],
  );

  const eventsByDate = useMemo(() => {
    const counts = new Map<string, number>();
    events.forEach((item) => {
      counts.set(item.date, (counts.get(item.date) ?? 0) + 1);
    });
    return counts;
  }, [events]);

  const todosSorted = useMemo(
    () => [...todos].sort((a, b) => Number(a.completed) - Number(b.completed)),
    [todos],
  );

  const diariesForUser = useMemo(() => {
    if (!currentUser) return [];
    return [...diaries]
      .filter((entry) => entry.createdBy === currentUser.name)
      .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));
  }, [diaries, currentUser]);

  useEffect(() => {
    if (currentUser) {
      setProfileForm({
        name: currentUser.name,
        password: "",
        confirmPassword: "",
      });
    } else {
      setProfileForm(initialProfileForm);
    }
  }, [currentUser]);

  useEffect(() => {
    if (!isMoreOpen) return;
    const handleClick = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMoreOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [isMoreOpen]);

  const handleSignupChange = (field: keyof SignupForm, value: string) => {
    setSignupForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleLoginChange = (field: keyof LoginForm, value: string) => {
    setLoginForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSignup = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedName = signupForm.name.trim();
    const trimmedEmail = signupForm.email.trim();
    const password = signupForm.password.trim();

    if (!trimmedName || !trimmedEmail || !password) {
      setError("모든 필드를 입력해 주세요.");
      return;
    }

    if (password.length < 6) {
      setError("비밀번호는 6자 이상이어야 합니다.");
      return;
    }

    const emailInUse = users.some((user) => user.email === trimmedEmail);
    if (emailInUse) {
      setError("이미 가입된 이메일입니다.");
      return;
    }

    const newUser: User = {
      id: crypto.randomUUID(),
      name: trimmedName,
      email: trimmedEmail,
      password,
    };

    setUsers((prev) => [...prev, newUser]);
    setSignupForm(initialSignup);
    setError(null);
    setSuccessMessage("가입이 완료되었습니다.");
    setCurrentUser(newUser);
    setActiveView("schedule");
  };

  const handleLogin = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedEmail = loginForm.email.trim();
    const password = loginForm.password.trim();

    if (!trimmedEmail || !password) {
      setError("이메일과 비밀번호를 입력해 주세요.");
      return;
    }

    const existing = users.find(
      (user) => user.email === trimmedEmail && user.password === password,
    );

    if (!existing) {
      setError("이메일 혹은 비밀번호가 올바르지 않습니다.");
      return;
    }

    setCurrentUser(existing);
    setLoginForm(initialLogin);
    setError(null);
    setSuccessMessage(null);
    setActiveView("schedule");
  };

  const handleViewChange = (view: ViewKey) => {
    setActiveView(view);
    setError(null);
    setSuccessMessage(null);
    setIsMoreOpen(false);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setError(null);
    setSuccessMessage(null);
    setActiveView("schedule");
    setIsMoreOpen(false);
  };

  const goToPreviousMonth = () => {
    setMonthCursor((prev) => {
      const next = new Date(prev.getFullYear(), prev.getMonth() - 1, 1);
      setSelectedDate(toISODate(next));
      return next;
    });
  };

  const goToNextMonth = () => {
    setMonthCursor((prev) => {
      const next = new Date(prev.getFullYear(), prev.getMonth() + 1, 1);
      setSelectedDate(toISODate(next));
      return next;
    });
  };

  const handleSelectDate = (iso: string | null) => {
    if (!iso) return;
    setSelectedDate(iso);
  };

  const handleAddEvent = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!currentUser) return;

    const trimmedTitle = eventForm.title.trim();
    const trimmedDescription = eventForm.description.trim();
    const trimmedLocation = eventForm.locationName.trim();

    if (!trimmedTitle) {
      setError("일정 제목을 입력해 주세요.");
      return;
    }

    let imageDataUrl: string | null = null;
    if (eventForm.imageFile) {
      try {
        imageDataUrl = await fileToDataUrl(eventForm.imageFile);
      } catch (readError) {
        console.error(readError);
        setError("이미지를 불러오는데 실패했습니다.");
        return;
      }
    }

    const newEvent: CalendarEvent = {
      id: crypto.randomUUID(),
      date: selectedDate,
      title: trimmedTitle,
      description: trimmedDescription,
      imageDataUrl,
      createdBy: currentUser.name,
      locationName: trimmedLocation || null,
      locationLat: eventForm.locationLat,
      locationLon: eventForm.locationLon,
    };

    setEvents((prev) => [...prev, newEvent]);
    setEventForm(initialEventForm);
    setIsEventModalOpen(false);
    setError(null);
    setSuccessMessage("일정이 추가되었습니다.");
  };
  const handleDeleteEvent = (id: string) => {
    setEvents((prev) => prev.filter((item) => item.id !== id));
  };

  const handleAddTodo = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!currentUser) return;
    const trimmed = todoText.trim();
    if (!trimmed) {
      setError("할 일을 입력해 주세요.");
      return;
    }

    const newTodo: TodoItem = {
      id: crypto.randomUUID(),
      text: trimmed,
      completed: false,
      createdBy: currentUser.name,
    };

    setTodos((prev) => [...prev, newTodo]);
    setTodoText("");
    setError(null);
    setSuccessMessage("할 일이 추가되었습니다.");
  };

  const handleToggleTodo = (id: string) => {
    setTodos((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, completed: !item.completed } : item,
      ),
    );
  };

  const handleDeleteTodo = (id: string) => {
    setTodos((prev) => prev.filter((item) => item.id !== id));
  };

  const handleProfileChange = (field: keyof ProfileForm, value: string) => {
    setProfileForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleUpdateProfile = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!currentUser) return;

    const trimmedName = profileForm.name.trim();
    const newPassword = profileForm.password.trim();
    const confirmPassword = profileForm.confirmPassword.trim();

    if (!trimmedName) {
      setError("이름은 비워둘 수 없습니다.");
      setSuccessMessage(null);
      return;
    }

    if (newPassword || confirmPassword) {
      if (newPassword.length < 6) {
        setError("새 비밀번호는 6자 이상이어야 합니다.");
        setSuccessMessage(null);
        return;
      }
      if (newPassword !== confirmPassword) {
        setError("비밀번호 확인이 일치하지 않습니다.");
        setSuccessMessage(null);
        return;
      }
    }

    const updatedUser: User = {
      ...currentUser,
      name: trimmedName,
      password: newPassword || currentUser.password,
    };

    setUsers((prev) =>
      prev.map((user) => (user.id === currentUser.id ? updatedUser : user)),
    );
    setCurrentUser(updatedUser);
    setProfileForm((prev) => ({
      ...prev,
      password: "",
      confirmPassword: "",
    }));
    setError(null);
    setSuccessMessage("프로필이 업데이트되었습니다.");
  };

  const totalEventsByUser = events.filter(
    (item) => item.createdBy === currentUser?.name,
  ).length;
  const totalTodosByUser = todos.filter(
    (item) => item.createdBy === currentUser?.name,
  ).length;
  const handlePlaceSearch = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const query = placeQuery.trim();
    if (!query) {
      setPlaceResults([]);
      return;
    }

    setIsSearchingPlaces(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
          query,
        )}&format=jsonv2&limit=5`,
        {
          headers: { "Accept-Language": "ko" },
        },
      );
      const data = (await response.json()) as Array<{
        place_id: number;
        display_name: string;
        name?: string;
        lat: string;
        lon: string;
      }>;

      const mapped: PlaceResult[] = data.map((item) => ({
        id: String(item.place_id),
        title: item.name || item.display_name.split(",")[0],
        displayName: item.display_name,
        lat: Number(item.lat),
        lon: Number(item.lon),
      }));

      setPlaceResults(mapped);
      if (mapped.length > 0) {
        const first = mapped[0];
        setSelectedPlace(first);
        setMapCenter([first.lat, first.lon]);
      }
      setSuccessMessage(mapped.length ? "장소 검색 결과를 불러왔습니다." : null);
    } catch (fetchError) {
      console.error(fetchError);
      setError("장소 검색 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      setIsSearchingPlaces(false);
    }
  };

  const handleSelectPlace = (place: PlaceResult) => {
    setSelectedPlace(place);
    setMapCenter([place.lat, place.lon]);
    setSuccessMessage(`${place.title} 위치로 이동했습니다.`);
    setError(null);
  };

  const handleApplySelectedPlace = () => {
    if (!selectedPlace) return;
    setEventForm((prev) => ({
      ...prev,
      locationName: selectedPlace.title,
      locationLat: selectedPlace.lat,
      locationLon: selectedPlace.lon,
    }));
  };

  const handleDiaryChange = (field: keyof DiaryForm, value: string) => {
    setDiaryForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddDiary = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!currentUser) return;
    const trimmedContent = diaryForm.content.trim();
    if (!trimmedContent) {
      setError("일기 내용을 적어 주세요.");
      return;
    }

    const newEntry: DiaryEntry = {
      id: crypto.randomUUID(),
      date: diaryForm.date,
      content: trimmedContent,
      createdBy: currentUser.name,
      createdAt: new Date().toISOString(),
    };

    setDiaries((prev) => [...prev, newEntry]);
    setDiaryForm({ date: diaryForm.date, content: "" });
    setError(null);
    setSuccessMessage("일기가 저장되었습니다.");
  };

  const handleDeleteDiary = (id: string) => {
    setDiaries((prev) => prev.filter((entry) => entry.id !== id));
  };
  if (!currentUser) {
    return (
      <div className="auth-wrapper">
        <div className="auth-card">
          <h1 className="app-title">Shared Schedule App</h1>
          <p className="app-subtitle">둘이 함께 쓰는 일정 · 투두 공유 서비스</p>

          <div className="tab-switch">
            {authMode === "login" ? (
              <>
                <span className="tab active">Login</span>
                <button
                  type="button"
                  className="tab"
                  onClick={() => {
                    setAuthMode("signup");
                    setError(null);
                    setSuccessMessage(null);
                  }}
                >
                  Sign Up
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  className="tab"
                  onClick={() => {
                    setAuthMode("login");
                    setError(null);
                    setSuccessMessage(null);
                  }}
                >
                  Login
                </button>
                <span className="tab active">Sign Up</span>
              </>
            )}
          </div>

          {error && <div className="error-box">{error}</div>}
          {successMessage && <div className="success-box">{successMessage}</div>}

          {authMode === "signup" ? (
            <form className="form" onSubmit={handleSignup}>
              <label className="input-field">
                Name
                <input
                  type="text"
                  value={signupForm.name}
                  onChange={(e) => handleSignupChange("name", e.target.value)}
                  placeholder="Enter display name"
                />
              </label>
              <label className="input-field">
                User ID
                <input
                  type="text"
                  value={signupForm.email}
                  onChange={(e) => handleSignupChange("email", e.target.value)}
                  placeholder="e.g. 1234"
                />
              </label>
              <label className="input-field">
                Password
                <input
                  type="password"
                  value={signupForm.password}
                  onChange={(e) => handleSignupChange("password", e.target.value)}
                  placeholder="At least 6 characters"
                />
              </label>
              <button type="submit" className="primary-button">
                Sign up and start
              </button>
            </form>
          ) : (
            <form className="form" onSubmit={handleLogin}>
              <label className="input-field">
                User ID
                <input
                  type="text"
                  value={loginForm.email}
                  onChange={(e) => handleLoginChange("email", e.target.value)}
                  placeholder="Enter your test ID (e.g. 1234)"
                />
              </label>
              <label className="input-field">
                Password
                <input
                  type="password"
                  value={loginForm.password}
                  onChange={(e) => handleLoginChange("password", e.target.value)}
                  placeholder="Enter your password"
                />
              </label>
              <button type="submit" className="primary-button">
                Login
              </button>
            </form>
          )}
        </div>
      </div>
    );
  }
  return (
    <div className="app-shell">
      <header className="app-header">
        <button
          type="button"
          className="logo-button"
          onClick={() => handleViewChange("schedule")}
        >
          <span className="logo-mark">SS</span>
          <span className="logo-text">
            <span className="logo-title">Shared Schedule App</span>
            <span className="logo-subtitle">
              {currentUser.name}님, 서로의 일정을 같이 관리해 보세요.
            </span>
          </span>
        </button>
        <div className="header-actions" ref={menuRef}>
          <button
            type="button"
            className="menu-button"
            onClick={() => setIsMoreOpen((prev) => !prev)}
            aria-haspopup="true"
            aria-expanded={isMoreOpen}
            aria-label="더보기"
          >
            ?
          </button>
          {isMoreOpen && (
            <div className="more-menu" role="menu">
              <button
                type="button"
                className="menu-item"
                role="menuitem"
                onClick={() => handleViewChange("places")}
              >
                장소 탐색
              </button>
              <button
                type="button"
                className="menu-item"
                role="menuitem"
                onClick={() => handleViewChange("mypage")}
              >
                마이페이지
              </button>
              <button
                type="button"
                className="menu-item"
                role="menuitem"
                onClick={handleLogout}
              >
                로그아웃
              </button>
            </div>
          )}
        </div>
      </header>

      {error && <div className="error-box">{error}</div>}
      {successMessage && <div className="success-box">{successMessage}</div>}

      <main className="main-content">
        {activeView === "schedule" && (
          <>
            <section className="calendar-section">
              <div className="section-header">
                <h2>일정 달력</h2>
                <div className="month-controls">
                  <button
                    type="button"
                    onClick={goToPreviousMonth}
                    aria-label="이전 달"
                  >
                    ←
                  </button>
                  <span>{formatMonthLabel(monthCursor)}</span>
                  <button type="button" onClick={goToNextMonth} aria-label="다음 달">
                    →
                  </button>
                </div>
              </div>

              <div className="calendar-grid">
                {["일", "월", "화", "수", "목", "금", "토"].map((weekday) => (
                  <div key={weekday} className="weekday">
                    {weekday}
                  </div>
                ))}

                {calendarCells.map((cell) => {
                  const hasEvents =
                    !!cell.iso && (eventsByDate.get(cell.iso) ?? 0) > 0;
                  return (
                    <button
                      type="button"
                      key={cell.id}
                      className={[
                        "calendar-cell",
                        cell.iso === selectedDate ? "selected" : "",
                        cell.isToday ? "today" : "",
                        cell.isCurrentMonth ? "" : "dimmed",
                        hasEvents ? "has-event" : "",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                      onClick={() => handleSelectDate(cell.iso)}
                      disabled={!cell.iso}
                    >
                      <span className="day-number">
                        {cell.date?.getDate() ?? ""}
                      </span>
                      {hasEvents && <span className="event-dot" aria-hidden />}
                    </button>
                  );
                })}
              </div>
            </section>

            <section className="events-section">
              <div className="section-header">
                <h3>
                  {selectedDate} 일정 ({eventsForSelectedDate.length}개)
                </h3>
              </div>
              <ul className="event-list">
                {eventsForSelectedDate.length === 0 && (
                  <li className="empty">아직 등록된 일정이 없습니다.</li>
                )}
                {eventsForSelectedDate.map((item) => (
                  <li key={item.id} className="event-item">
                    <div className="event-header">
                      <div>
                        <p className="event-title">{item.title}</p>
                        {item.description && (
                          <p className="event-description">{item.description}</p>
                        )}
                      </div>
                      <button
                        type="button"
                        className="icon-button"
                        onClick={() => handleDeleteEvent(item.id)}
                      >
                        ?
                      </button>
                    </div>
                    <div className="event-meta">등록자: {item.createdBy}</div>
                    {(item.locationName ||
                      (item.locationLat !== undefined && item.locationLat !== null)) && (
                      <div className="event-location">
                        📍{" "}
                        {item.locationName
                          ? item.locationName
                          : `${item.locationLat?.toFixed(4)}, ${item.locationLon?.toFixed(4)}`}
                      </div>
                    )}
                    {item.imageDataUrl && (
                      <img
                        className="event-image"
                        src={item.imageDataUrl}
                        alt={`${item.title} 이미지`}
                      />
                    )}
                  </li>
                ))}
              </ul>
            </section>
            <section className="todo-section">
              <div className="section-header">
                <h3>공유 투두 리스트</h3>
              </div>
              <form className="form" onSubmit={handleAddTodo}>
                <label className="input-field">
                  새로운 할 일
                  <input
                    type="text"
                    value={todoText}
                    onChange={(e) => setTodoText(e.target.value)}
                    placeholder="예: 디자인 시안 검토"
                  />
                </label>
                <button type="submit" className="primary-button">
                  추가
                </button>
              </form>
              <ul className="todo-list">
                {todosSorted.length === 0 && (
                  <li className="empty">할 일을 추가해 보세요.</li>
                )}
                {todosSorted.map((item) => (
                  <li key={item.id} className="todo-item">
                    <label>
                      <input
                        type="checkbox"
                        checked={item.completed}
                        onChange={() => handleToggleTodo(item.id)}
                      />
                      <span className={item.completed ? "completed" : ""}>
                        {item.text}
                      </span>
                    </label>
                    <div className="todo-meta">
                      작성: {item.createdBy}
                      <button
                        type="button"
                        className="icon-button"
                        onClick={() => handleDeleteTodo(item.id)}
                      >
                        ?
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </section>

            <button
              type="button"
              className="floating-button"
              onClick={() => {
                setEventForm({
                  ...initialEventForm,
                  locationName: selectedPlace ? selectedPlace.title : "",
                  locationLat: selectedPlace ? selectedPlace.lat : null,
                  locationLon: selectedPlace ? selectedPlace.lon : null,
                });
                setIsEventModalOpen(true);
                setSuccessMessage(null);
                setError(null);
              }}
            >
              +
            </button>

            {isEventModalOpen && (
              <div
                className="modal-backdrop"
                role="dialog"
                aria-modal="true"
                aria-label="일정 추가"
              >
                <div className="modal-card">
                  <header className="modal-header">
                    <h3>새 일정 추가</h3>
                    <button
                      type="button"
                      className="icon-button"
                      onClick={() => setIsEventModalOpen(false)}
                    >
                      ?
                    </button>
                  </header>
                  <form className="form" onSubmit={handleAddEvent}>
                    <label className="input-field">
                      선택 날짜
                      <input type="text" value={selectedDate} disabled />
                    </label>
                    <label className="input-field">
                      일정 제목
                      <input
                        type="text"
                        value={eventForm.title}
                        onChange={(e) =>
                          setEventForm((prev) => ({ ...prev, title: e.target.value }))
                        }
                        placeholder="예: 프로젝트 회의"
                      />
                    </label>
                    <label className="input-field">
                      메모
                      <textarea
                        rows={3}
                        value={eventForm.description}
                        onChange={(e) =>
                          setEventForm((prev) => ({
                            ...prev,
                            description: e.target.value,
                          }))
                        }
                        placeholder="필요한 준비물, 장소 등을 기록하세요"
                      />
                    </label>
                    <label className="input-field">
                      Location
                      <div className="location-input-row">
                        <input
                          type="text"
                          value={eventForm.locationName}
                          onChange={(e) =>
                            setEventForm((prev) => ({
                              ...prev,
                              locationName: e.target.value,
                            }))
                          }
                          placeholder="e.g. Meeting room or cafe"
                        />
                        <button
                          type="button"
                          className="location-apply-button"
                          onClick={handleApplySelectedPlace}
                          disabled={!selectedPlace}
                        >
                          Use selected
                        </button>
                      </div>
                      {selectedPlace && (
                        <p className="location-hint">
                          Current from Places tab: {selectedPlace.title}
                        </p>
                      )}
                    </label>
                    <label className="input-field">
                      이미지
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) =>
                          setEventForm((prev) => ({
                            ...prev,
                            imageFile: e.target.files?.[0] ?? null,
                          }))
                        }
                      />
                    </label>
                    <div className="modal-actions">
                      <button
                        type="button"
                        className="secondary-button"
                        onClick={() => setIsEventModalOpen(false)}
                      >
                        취소
                      </button>
                      <button type="submit" className="primary-button">
                        일정 등록
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </>
        )}
        {activeView === "places" && (
          <section className="places-section">
            <div className="section-header">
              <h2>장소 탐색</h2>
              <p className="section-description">검색 후 지도에서 위치를 확인하세요.</p>
            </div>
            <form className="places-search" onSubmit={handlePlaceSearch}>
              <input
                type="text"
                value={placeQuery}
                onChange={(e) => setPlaceQuery(e.target.value)}
                placeholder="검색어를 입력하세요 (예: 강남역, 카페)"
              />
              <button
                type="submit"
                className="primary-button"
                disabled={isSearchingPlaces}
              >
                {isSearchingPlaces ? "검색 중..." : "검색"}
              </button>
            </form>

            <div className="places-layout">
              <div className="place-results">
                {placeResults.length === 0 && (
                  <div className="empty">검색 결과가 여기에 표시됩니다.</div>
                )}
                {placeResults.map((place) => (
                  <button
                    type="button"
                    key={place.id}
                    className={[
                      "place-item",
                      selectedPlace?.id === place.id ? "selected" : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    onClick={() => handleSelectPlace(place)}
                  >
                    <strong>{place.title}</strong>
                    <span>{place.displayName}</span>
                  </button>
                ))}
              </div>
              <div className="map-wrapper">
                <MapContainer
                  key={mapCenter.join(",")}
                  center={mapCenter}
                  zoom={14}
                  scrollWheelZoom
                  className="map-container"
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  {selectedPlace && (
                    <Marker position={[selectedPlace.lat, selectedPlace.lon]}>
                      <Popup>
                        <strong>{selectedPlace.title}</strong>
                        <br />
                        {selectedPlace.displayName}
                      </Popup>
                    </Marker>
                  )}
                </MapContainer>
              </div>
            </div>
          </section>
        )}
        {activeView === "diary" && (
          <section className="diary-section">
            <div className="section-header">
              <h2>일기 작성</h2>
              <p className="section-description">오늘의 감정과 기록을 자유롭게 적어 보세요.</p>
            </div>
            <form className="form diary-form" onSubmit={handleAddDiary}>
              <div className="diary-meta">
                <label className="input-field">
                  날짜
                  <input
                    type="date"
                    value={diaryForm.date}
                    onChange={(e) => handleDiaryChange("date", e.target.value)}
                  />
                </label>
              </div>
              <label className="input-field">
                내용
                <textarea
                  rows={6}
                  value={diaryForm.content}
                  onChange={(e) => handleDiaryChange("content", e.target.value)}
                  placeholder="오늘 하루는 어땠나요?"
                />
              </label>
              <button type="submit" className="primary-button">
                일기 저장
              </button>
            </form>

            <div className="diary-list">
              {diariesForUser.length === 0 && (
                <div className="empty">작성한 일기가 없습니다.</div>
              )}
              {diariesForUser.map((entry) => (
                <article key={entry.id} className="diary-item">
                  <header>
                    <h3>{entry.date}</h3>
                    <button
                      type="button"
                      className="icon-button"
                      onClick={() => handleDeleteDiary(entry.id)}
                    >
                      ?
                    </button>
                  </header>
                  <p>{entry.content}</p>
                  <footer>
                    <span>작성자: {entry.createdBy}</span>
                    <span>
                      작성 시간:{" "}
                      {new Date(entry.createdAt).toLocaleString("ko-KR", {
                        dateStyle: "short",
                        timeStyle: "short",
                      })}
                    </span>
                  </footer>
                </article>
              ))}
            </div>
          </section>
        )}
        {activeView === "mypage" && (
          <section className="my-page">
            <div className="section-header">
              <h2>마이페이지</h2>
              <p className="section-description">
                내 정보와 활동 기록을 확인하고 수정할 수 있어요.
              </p>
            </div>

            <div className="profile-summary">
              <div>
                <p className="profile-label">이름</p>
                <p className="profile-value">{currentUser.name}</p>
              </div>
              <div>
                <p className="profile-label">이메일</p>
                <p className="profile-value">{currentUser.email}</p>
              </div>
              <div className="profile-stats">
                <div>
                  <p className="profile-label">등록한 일정</p>
                  <span className="profile-stat">{totalEventsByUser}개</span>
                </div>
                <div>
                  <p className="profile-label">등록한 투두</p>
                  <span className="profile-stat">{totalTodosByUser}개</span>
                </div>
                <div>
                  <p className="profile-label">작성한 일기</p>
                  <span className="profile-stat">{diariesForUser.length}개</span>
                </div>
              </div>
            </div>

            <form className="form" onSubmit={handleUpdateProfile}>
              <h3>프로필 수정</h3>
              <label className="input-field">
                이름
                <input
                  type="text"
                  value={profileForm.name}
                  onChange={(e) => handleProfileChange("name", e.target.value)}
                  placeholder="표시 이름"
                />
              </label>
              <label className="input-field">
                새 비밀번호
                <input
                  type="password"
                  value={profileForm.password}
                  onChange={(e) => handleProfileChange("password", e.target.value)}
                  placeholder="변경하지 않으려면 비워두세요"
                />
              </label>
              <label className="input-field">
                비밀번호 확인
                <input
                  type="password"
                  value={profileForm.confirmPassword}
                  onChange={(e) =>
                    handleProfileChange("confirmPassword", e.target.value)
                  }
                  placeholder="새 비밀번호와 동일하게 입력"
                />
              </label>
              <button type="submit" className="primary-button">
                변경사항 저장
              </button>
            </form>

            <div className="info-box">
              <h4>안내</h4>
              <p>
                이메일은 계정 식별에 사용되므로 변경할 수 없습니다. 비밀번호를 바꾸려면
                새 비밀번호와 확인란을 모두 채워 주세요.
              </p>
              <p>
                로그아웃 후에는 로그인 화면에서 다시 접속할 수 있고, 같은 브라우저를
                사용하는 다른 사람과 일정과 할 일을 함께 관리할 수 있습니다.
              </p>
            </div>
          </section>
        )}
      </main>

      <nav className="tab-bar">
        {[
          { key: "schedule" as ViewKey, label: "Home", icon: "home" as IconName },
          { key: "places" as ViewKey, label: "Places", icon: "places" as IconName },
          { key: "diary" as ViewKey, label: "Diary", icon: "diary" as IconName },
          { key: "mypage" as ViewKey, label: "Menu", icon: "menu" as IconName },
        ].map((item) => {
          const active = activeView === item.key;
          return (
            <button
              type="button"
              key={item.key}
              className={active ? "tab-button active" : "tab-button"}
              onClick={() => handleViewChange(item.key)}
            >
              <TabIcon name={item.icon} active={active} />
              <span className={active ? "tab-label active" : "tab-label"}>
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}

type IconName = "home" | "places" | "diary" | "menu";

const TabIcon = ({ name, active }: { name: IconName; active: boolean }) => {
  const color = active ? "#2563eb" : "#8a94ab";
  switch (name) {
    case "home":
      return (
        <svg
          className="tab-icon"
          viewBox="0 0 24 24"
          fill={active ? color : "none"}
          stroke={color}
          strokeWidth={1.8}
        >
          <path d="M3 10.4 11.3 3a1 1 0 0 1 1.4 0L21 10.4V20a1 1 0 0 1-1 1h-5.5a.5.5 0 0 1-.5-.5V15h-4v5.5a.5.5 0 0 1-.5.5H4a1 1 0 0 1-1-1z" />
        </svg>
      );
    case "places":
      return (
        <svg
          className="tab-icon"
          viewBox="0 0 24 24"
          fill={active ? color : "none"}
          stroke={color}
          strokeWidth={1.8}
        >
          <path d="M12 21s6-5.25 6-10a6 6 0 1 0-12 0c0 4.75 6 10 6 10z" />
          <circle cx="12" cy="11" r="2.3" />
        </svg>
      );
    case "diary":
      return (
        <svg
          className="tab-icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke={color}
          strokeWidth={1.8}
        >
          <path d="M6 4.5h11.5a1.5 1.5 0 0 1 1.5 1.5v13H7a2 2 0 0 1-2-2V6a1.5 1.5 0 0 1 1.5-1.5Z" />
          <path d="M6 9h12" />
          <path d="M9 13h4" />
        </svg>
      );
    case "menu":
    default:
      return (
        <svg
          className="tab-icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke={color}
          strokeWidth={1.8}
        >
          <path d="M4 7h16M4 12h16M4 17h16" />
        </svg>
      );
  }
};

export default App;








