import { useEffect, useMemo, useState } from 'react';
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
import AdminCMS from './components/AdminCMS';

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
    <AuthProvider>
      <DataProvider>
        <Shell />
      </DataProvider>
    </AuthProvider>
  );
}

function Shell() {
  const { user, isAdmin, signOut, loading } = useAuth();
  const [tab, setTab] = useState('home');
  const [opts, setOpts] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);

  function go(next, o = null) { setTab(next); setOpts(o); setMenuOpen(false); window.scrollTo({ top: 0 }); }

  // Deep-link /admin (Vercel SPA rewrite → index.html, đọc location.pathname)
  useEffect(() => {
    if (window.location.pathname.replace(/\/+$/, '') === '/admin') setTab('admin');
  }, []);

  // Tab "admin" chỉ hiện khi thực sự có quyền (role kiểm tra qua Supabase, không mật khẩu cứng)
  const tabs = useMemo(() => (isAdmin ? [...NAV, ['admin', 'Quản trị', LayoutDashboard]] : NAV), [isAdmin]);

  return (
    <div className="app-shell">
      <header className="topbar">
        <button className="brand" onClick={() => go('home')}>
          <span className="brand-mark">H</span>
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
        {tab === 'admin' && <AdminCMS go={go} opts={opts} />}
      </main>
    </div>
  );
}
