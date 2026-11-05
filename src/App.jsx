import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import { Clock, Map as MapIcon, Users, BrainCircuit, Info, UserCircle2, ShieldCheck, LayoutDashboard, LogOut, Menu, X } from 'lucide-react';
import { AuthProvider, useAuth } from './auth';
import { DataProvider } from './store';
import Home from './components/Home';
import TimelineMaster from './components/TimelineMaster';
import MapExplorer from './components/MapExplorer';
import CharacterHub from './components/CharacterHub';
import QuizArena from './components/QuizArena';
import About from './components/About';
import Account from './components/Account';
import ErrorBoundary from './components/ErrorBoundary';

// Bảng quản trị rất nặng (nhiều màn hình) → tách khỏi bundle chính,
// chỉ tải khi admin thực sự mở tab Quản trị.
const AdminCMS = lazy(() => import('./components/AdminCMS'));

// Đường dẫn cho từng tab: cho phép F5 / chia sẻ link mở đúng màn hình.
const PATH_BY_TAB = {
  home: '/',
  timeline: '/dong-thoi-gian',
  maps: '/ban-do',
  characters: '/nhan-vat',
  quiz: '/chrono-quiz',
  about: '/ve-du-an',
  account: '/tai-khoan',
  admin: '/admin',
};
const TAB_BY_PATH = Object.fromEntries(Object.entries(PATH_BY_TAB).map(([k, p]) => [p, k]));

const normPath = (p) => p.replace(/\/+$/, '') || '/';
function tabFromPath(pathname) {
  return TAB_BY_PATH[normPath(pathname)] || null;
}

const NAV = [
  ['home', 'Trang chủ', Clock],
  ['timeline', 'Dòng thời gian', Clock],
  ['maps', 'Bản đồ', MapIcon],
  ['characters', 'Thẻ nhân vật', Users],
  ['quiz', 'Chrono-Quiz', BrainCircuit],
  ['about', 'Về dự án', Info],
  ['account', 'Tài khoản', UserCircle2],
];

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <DataProvider>
          <Shell />
        </DataProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

function Shell() {
  const { user, isAdmin, signOut, loading } = useAuth();
  const [tab, setTab] = useState(() => tabFromPath(window.location.pathname) || 'home');
  const [opts, setOpts] = useState(() => window.history.state?.opts ?? null);
  const [menuOpen, setMenuOpen] = useState(false);

  // Mỗi tab có URL riêng (Vercel SPA rewrite → index.html, đọc location.pathname)
  function go(next, o = null) {
    setTab(next); setOpts(o); setMenuOpen(false); window.scrollTo({ top: 0 });
    const path = PATH_BY_TAB[next];
    if (path && normPath(window.location.pathname) !== normPath(path)) {
      window.history.pushState({ tab: next, opts: o }, '', path);
    }
  }

  // Nút Back/Forward của trình duyệt điều hướng giữa các tab
  useEffect(() => {
    function onPop(e) {
      setTab(tabFromPath(window.location.pathname) || 'home');
      setOpts(e.state?.opts ?? null);
      setMenuOpen(false);
    }
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  // Tab "admin" chỉ hiện khi thực sự có quyền (role kiểm tra qua Supabase, không mật khẩu cứng)
  const tabs = useMemo(() => (isAdmin ? [...NAV, ['admin', 'Quản trị', LayoutDashboard]] : NAV), [isAdmin]);

  return (
    <div className="app-shell">
      <header className="topbar">
        <button className="brand" onClick={() => go('home')}>
          <span className="brand-mark">
            <img src="/images/avatar.png" alt="HISTORLOG-Z Logo" />
          </span>
          <span className="brand-text"><b>HISTORLOG-Z</b><small>History and Technology</small></span>
        </button>

        <nav className={`main-nav ${menuOpen ? 'open' : ''}`}>
          {tabs.map(([k, label, Icon]) => (
            <button key={k} className={tab === k ? 'on' : ''} onClick={() => go(k, k === 'admin' ? { tab: 'dashboard' } : null)}>
              <Icon size={15} /> {label}
            </button>
          ))}
          {user && !isAdmin && (
            <button className="nav-signout" onClick={() => { signOut(); go('home'); }}><LogOut size={14} /> Đăng xuất</button>
          )}
        </nav>

        <div className="topbar-right">
          {!loading && !user && <button className="btn-ghost small" onClick={() => go('account')}>Đăng nhập</button>}
          {user && <span className="who" title={user.email}>{isAdmin ? <ShieldCheck size={14} /> : <UserCircle2 size={14} />} {user.email.split('@')[0]}</span>}
          <button className="burger" onClick={() => setMenuOpen(!menuOpen)} aria-label="Menu">{menuOpen ? <X size={20} /> : <Menu size={20} />}</button>
        </div>
      </header>

      <main className="main-area">
        {tab === 'home' && <Home go={go} />}
        {tab === 'timeline' && <TimelineMaster go={go} focus={opts?.focus} />}
        {tab === 'maps' && <MapExplorer go={go} focus={opts?.focus} />}
        {tab === 'characters' && <CharacterHub go={go} focus={opts?.focus} />}
        {tab === 'quiz' && <QuizArena go={go} focus={opts} />}
        {tab === 'about' && <About go={go} />}
        {tab === 'account' && <Account go={go} />}
        {tab === 'admin' && (
          <Suspense fallback={<div className="page"><div className="page-panel"><p className="muted">Đang tải bảng quản trị…</p></div></div>}>
            <AdminCMS go={go} opts={opts} />
          </Suspense>
        )}
      </main>
    </div>
  );
}
