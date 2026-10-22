import { useEffect, useRef, useState } from 'react';
import {
  LayoutDashboard, Home as HomeIcon, Clock, Map as MapIcon, Users, HelpCircle, Image as ImageIcon,
  Megaphone, Mail, FlaskConical, ScrollText, DatabaseBackup, KeyRound, Save, Trash2,
  Eye, EyeOff, Plus, Upload, Download, GripVertical, X, Check, RefreshCw, ShieldCheck, AlertTriangle,
  Trophy, MapPin, Star, Sparkles,
} from 'lucide-react';
import { supabase } from '../supabase';
import { useAuth } from '../auth';
import { useData } from '../store';
import {
  listItems, upsertItem, removeItem, toggleVisibility, uploadImage, importLegacy,
} from '../cms';
import { LEGACY_MAPS } from '../mapSamples';
import { PERIODS, RARITY, downloadCSV, downloadJSON, fmtDate, basicStats, pairedTTest } from '../utils';

// ================= ADMIN CMS — 15 màn hình, mọi thao tác không cần code =================
const TABS = [
  ['dashboard', 'Tổng quan', LayoutDashboard],
  ['bootstrap', 'Tạo Admin đầu tiên', KeyRound],
  ['home', 'Trang chủ', HomeIcon],
  ['timeline', 'Dòng thời gian', Clock],
  ['maps', 'Map Studio', MapIcon],
  ['characters', 'Character Studio', Users],
  ['questions', 'Ngân hàng câu hỏi', HelpCircle],
  ['media', 'Media Library', ImageIcon],
  ['announcements', 'Thông báo', Megaphone],
  ['accounts', 'Tài khoản & vai trò', ShieldCheck],
  ['points', 'Điểm & thành tựu', Trophy],
  ['feedback', 'Góp ý', Mail],
  ['research', 'Nghiên cứu KHKT', FlaskConical],
  ['audit', 'Nhật ký quản trị', ScrollText],
  ['backup', 'Sao lưu & khôi phục', DatabaseBackup],
];

export default function AdminCMS({ go, opts }) {
  const { isAdmin, loading } = useAuth();
  const [tab, setTab] = useState(opts?.tab || 'dashboard');
  const { refresh } = useData();

  useEffect(() => { if (opts?.tab) setTab(opts.tab); }, [opts?.tab]);

  if (loading) return <p className="muted pad">Đang kiểm tra quyền…</p>;
  if (!isAdmin) return (
    <div className="page center-pad page-panel">
      <ShieldCheck size={30} />
      <h2 className="museum-h2">Khu vực Quản trị</h2>
      <p className="muted">Bạn phải đăng nhập bằng tài khoản có vai trò <b>admin</b> (kiểm tra bằng Row Level Security trên Supabase — không có mật khẩu admin chung).</p>
      <button className="btn-primary" onClick={() => go('account')}>Tới trang đăng nhập</button>
    </div>
  );

  return (
    <div className="page admin-cms">
      <header className="page-head">
        <div>
          <h2 className="museum-h2">Bảng điều khiển Quản trị</h2>
          <p className="muted">Mọi chỉnh sửa được ghi log + lưu phiên bản tự động (khôi phục được 20 bản gần nhất mỗi nội dung).</p>
        </div>
        <button className="btn-ghost" onClick={() => go('home')}>← Xem trang học sinh</button>
      </header>

      <nav className="admin-tabs">
        {TABS.map(([k, l, Icon]) => (
          <button key={k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}><Icon size={15} /> {l}</button>
        ))}
      </nav>

      <AdminBody tab={tab} refresh={refresh} go={go} focus={opts?.focus} />
    </div>
  );
}

// Trophy icon import separately (lucide has it)

function AdminBody({ tab, refresh, go, focus }) {
  const [tick, setTick] = useState(0);
  const done = async () => { setTick(t => t + 1); await refresh(); };
  switch (tab) {
    case 'dashboard': return <Dashboard key={tick} go={go} />;
    case 'bootstrap': return <Bootstrap />;
    case 'home': return <HomeManager key={tick} done={done} />;
    case 'timeline': return <ItemManager kind="events" key={tick} done={done} focus={focus} />;
    case 'characters': return <ItemManager kind="characters" key={tick} done={done} />;
    case 'questions': return <QuestionManager key={tick} done={done} />;
    case 'maps': return <MapStudio key={tick} done={done} focus={focus} />;
    case 'media': return <MediaLibrary key={tick} done={done} />;
    case 'announcements': return <ItemManager kind="announcements" key={tick} done={done} />;
    case 'accounts': return <Accounts key={tick} done={done} />;
    case 'points': return <PointsScreen key={tick} done={done} />;
    case 'feedback': return <Feedback key={tick} done={done} />;
    case 'research': return <Research key={tick} done={done} />;
    case 'audit': return <AuditLog key={tick} />;
    case 'backup': return <BackupScreen done={done} />;
    default: return <Dashboard go={go} />;
  }
}

// ---------- 1. Dashboard ----------
async function safeRpc(fn, ...args) {
  const { data, error } = await supabase.rpc(fn, ...args);
  if (error) throw error;
  return typeof data === 'string' ? JSON.parse(data) : data;
}

function Dashboard({ go }) {
  const [stats, setStats] = useState(null);
  const [err, setErr] = useState('');
  const { status } = useData();
  useEffect(() => {
    safeRpc('admin_stats').then(setStats).catch(e => setErr(
      /admin_stats|does not exist|function/i.test(e.message)
        ? 'Chưa chạy migration 002 trên Supabase → thống kê chưa có. Vào mục “Tạo Admin đầu tiên” để xem hướng dẫn chạy SQL.'
        : e.message));
  }, []);
  return (
    <section>
      <div className="stat-grid">
        {(stats ? [
          ['Người dùng', stats.users], ['Sự kiện', stats.events], ['Câu hỏi', stats.questions],
          ['Thẻ nhân vật', stats.characters], ['Bản đồ', stats.maps], ['Lượt làm bài', stats.attempts],
          ['Thẻ đã mở', stats.unlocks], ['Điểm TB các bài', stats.avg_score + '%'],
          ['Góp ý mới', stats.feedback_new], ['Phiên nghiên cứu', stats.research],
        ] : Array(8).fill(['—', '…'])).map(([l, v], i) => (
          <div key={i} className="stat-card page-panel"><small>{l}</small><b>{v}</b></div>
        ))}
      </div>
      {err && <p className="fail">{err}</p>}
      {Object.keys(status).length > 0 && <p className="warn-badge"><AlertTriangle size={13} /> Lỗi tải dữ liệu (kiểm tra Supabase/env): {JSON.stringify(status)}</p>}
      <div className="quick-links">
        <button className="btn-ghost" onClick={() => go('admin', { tab: 'timeline' })}>+ Thêm sự kiện</button>
        <button className="btn-ghost" onClick={() => go('admin', { tab: 'maps' })}>+ Tạo bản đồ mới (bản đồ thứ 5)</button>
        <button className="btn-ghost" onClick={() => go('admin', { tab: 'characters' })}>+ Tạo thẻ nhân vật</button>
        <button className="btn-ghost" onClick={() => go('admin', { tab: 'questions' })}>+ Nhập câu hỏi hàng loạt (CSV)</button>
      </div>
    </section>
  );
}

// ---------- 2. Bootstrap admin (an toàn, không mật khẩu chung) ----------
function Bootstrap() {
  const { user } = useAuth();
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  async function run() {
    if (!user) { setMsg('Bạn chưa đăng nhập. Hãy đăng nhập bằng email sẽ làm admin trước.'); return; }
    setBusy(true); setMsg('');
    try {
      const out = await safeRpc('bootstrap_admin');
      setMsg('✔ ' + out + ' (RPC chỉ hoạt động khi hệ thống chưa có admin nào — lần sau sẽ bị từ chối.)');
    } catch (e) { setMsg('✖ ' + e.message); }
    setBusy(false);
  }
  return (
    <section className="page-panel guide">
      <h3 className="museum-h3"><KeyRound size={16} /> Tạo tài khoản Admin đầu tiên (quy trình an toàn)</h3>
      <ol>
        <li><b>Cách A — SQL Editor (khuyên dùng, 100% chắc chắn):</b> vào Supabase → SQL Editor, chạy câu lệnh dưới đây thay email của bạn, rồi đăng xuất/đăng nhập lại trên web.</li>
        <pre className="code-block">{`update public.profiles set role = 'admin'
 where id = (select id from auth.users
              where email = 'email-cua-ban@vidu.com');`}</pre>
        <li><b>Cách B — nút này:</b> đăng nhập tài khoản định làm admin, bấm nút. RPC <code>bootstrap_admin()</code> chỉ cấp quyền khi CHƯA tồn tại admin nào → không ai leo quyền được về sau.</li>
        <li><b>Chạy migration:</b> paste toàn bộ <code>supabase/001_historlogz.sql</code> rồi <code>002_security_and_grading.sql</code> vào SQL Editor (idempotent, chạy lại nhiều lần an toàn, không chứa secret).</li>
      </ol>
      <button className="btn-primary" disabled={busy || !user} onClick={run}>{busy ? '…' : 'Tôi đang đăng nhập tài khoản này — cấp Admin cho tôi'}</button>
      {!user && <p className="muted">Chưa đăng nhập.</p>}
      {msg && <p role="status">{msg}</p>}
      <p className="muted small">Không có mật khẩu admin chung, không check email ở frontend, không service-role key trong mã nguồn.</p>
    </section>
  );
}

// ---------- 3. Trang chủ CMS (hero/giới thiệu/hướng dẫn) ----------
function HomeManager({ done }) {
  const [rows, setRows] = useState([]);
  const [busy, setBusy] = useState('');
  const load = () => listItems('pages', true).then(setRows).catch(e => setBusy(e.message));
  useEffect(() => { load(); }, []);
  async function save(section, payload) {
    const existing = rows.find(r => r.payload?.section === section);
    await upsertItem({ ...(existing || {}), kind: 'pages', title: payload.title || section, body: '', published: true, visible: true, legacy_id: existing?.legacy_id || `page-${section}`, payload: { ...payload, section } });
    await done(); load();
  }
  const [hero, setHero] = useState({ title: 'HISTORLOG-Z', subtitle: 'History and Technology', desc: '', image: '' });
  const [intro, setIntro] = useState({ title: 'Giới thiệu', content: '' });
  const [guide, setGuide] = useState({ title: 'Hướng dẫn sử dụng', steps: '' });
  useEffect(() => {
    for (const r of rows) {
      const s = r.payload?.section;
      if (s === 'hero') setHero({ title: r.payload.title || r.title, subtitle: r.payload.subtitle || '', desc: r.payload.desc || '', image: r.payload.image || '' });
      if (s === 'intro') setIntro({ title: r.payload.title || r.title, content: r.payload.content || '' });
      if (s === 'guide') setGuide({ title: r.payload.title || r.title, steps: (r.payload.steps || []).join('\n') });
    }
  }, [rows]);
  return (
    <section className="admin-forms">
      <h3 className="museum-h3">Nội dung trang chủ — sửa xong bấm Lưu, học sinh thấy ngay không cần code</h3>
      <div className="page-panel form-col">
        <b>Hero (đầu trang)</b>
        <label>Tiêu đề<input className="field" value={hero.title} onChange={e => setHero({ ...hero, title: e.target.value })} /></label>
        <label>Slogan<input className="field" value={hero.subtitle} onChange={e => setHero({ ...hero, subtitle: e.target.value })} /></label>
        <label>Mô tả<textarea className="field" rows="2" value={hero.desc} onChange={e => setHero({ ...hero, desc: e.target.value })} /></label>
        <label>Ảnh nền (URL từ Media Library)<input className="field" value={hero.image} onChange={e => setHero({ ...hero, image: e.target.value })} /></label>
        <button className="btn-primary" onClick={() => save('hero', hero)}>Lưu Hero</button>
      </div>
      <div className="page-panel form-col">
        <b>Giới thiệu</b>
        <label>Tiêu đề<input className="field" value={intro.title} onChange={e => setIntro({ ...intro, title: e.target.value })} /></label>
        <label>Nội dung<textarea className="field" rows="4" value={intro.content} onChange={e => setIntro({ ...intro, content: e.target.value })} /></label>
        <button className="btn-primary" onClick={() => save('intro', intro)}>Lưu Giới thiệu</button>
      </div>
      <div className="page-panel form-col">
        <b>Hướng dẫn sử dụng (mỗi dòng một bước)</b>
        <label>Tiêu đề<input className="field" value={guide.title} onChange={e => setGuide({ ...guide, title: e.target.value })} /></label>
        <textarea className="field" rows="6" value={guide.steps} onChange={e => setGuide({ ...guide, steps: e.target.value })} />
        <button className="btn-primary" onClick={() => save('guide', { ...guide, steps: guide.steps.split('\n').map(s => s.trim()).filter(Boolean) })}>Lưu Hướng dẫn</button>
      </div>
      {busy && <p className="fail">{busy}</p>}
    </section>
  );
}

// ---------- 4/6/8. Trình quản lý nội dung chung (timeline/characters/announcements) ----------
const EMPTY = { kind: null, title: '', body: '', payload: {}, published: true, visible: true };

function ItemManager({ kind, done, focus }) {
  const [rows, setRows] = useState([]);
  const [editing, setEditing] = useState(null);
  const [busy, setBusy] = useState('');
  const [q, setQ] = useState('');
  const [importing, setImporting] = useState(false);
  const load = () => listItems(kind, true).then(setRows).catch(e => setBusy(e.message));
  useEffect(() => { load(); }, [kind]);
  useEffect(() => { if (focus) { const r = rows.find(x => x.legacy_id === focus || String(x.id) === focus); if (r) setEditing(JSON.parse(JSON.stringify(r))); } }, [focus, rows]);

  async function save(form) {
    setBusy('');
    try {
      await upsertItem({ ...form, kind });
      await done(); load(); setEditing(null);
    } catch (e) { setBusy('Lỗi lưu: ' + e.message); }
  }
  async function del(id) {
    if (!confirm('Xóa nội dung này? (Vẫn khôi phục được qua Lịch sử phiên bản nếu đã từng sửa.)')) return;
    await removeItem(id); await done(); load();
  }
  async function show(r, v) { await toggleVisibility(r.id, v, { published: v }); await done(); load(); }
  async function doImport() {
    setImporting(true); setBusy('');
    try {
      const r = await importLegacy(kind);
      setBusy(`Import: tổng ${r.total} · thêm mới ${r.inserted} · bỏ qua (đã có) ${r.skipped}${r.failed ? ` · lỗi ${r.failed}: ${r.lastErr}` : ''}`);
      load();
    } catch (e) { setBusy('Import lỗi: ' + e.message); }
    setImporting(false);
  }

  const shown = rows.filter(r => !q || r.title.toLowerCase().includes(q.toLowerCase()));
  const meta = KIND_META[kind] || KIND_META.default;

  return (
    <section>
      <div className="row-gap wrap">
        <input className="field grow" placeholder="Tìm theo tiêu đề…" value={q} onChange={e => setQ(e.target.value)} />
        <button className="btn-primary" onClick={() => setEditing({ ...EMPTY, kind, payload: {} })}><Plus size={15} /> Thêm mới</button>
        <button className="btn-ghost" onClick={doImport} disabled={importing || kind === 'announcements'}><RefreshCw size={15} /> {importing ? 'Đang đồng bộ…' : 'Đồng bộ dữ liệu cũ (Import)'}</button>
      </div>
      {busy && <p role="status">{busy}</p>}

      <table className="admin-table">
        <thead><tr><th>Tiêu đề</th><th>{meta.col}</th><th>Trạng thái</th><th></th></tr></thead>
        <tbody>
          {shown.map(r => (
            <tr key={r.id}>
              <td><b>{r.title}</b>{r.legacy_id && <small className="lid"> {r.legacy_id}</small>}</td>
              <td>{meta.summary(r)}</td>
              <td>{r.published && r.visible !== false ? <span className="pill ok">Hiện</span> : <span className="pill">Ẩn/Bản nháp</span>}</td>
              <td className="row-gap">
                {kind === 'events' && (
                  <button
                    title={r.payload?.featured ? 'Bỏ ghim khỏi Trang chủ' : 'Ghim lên Sự kiện nổi bật Trang chủ'}
                    style={{ color: r.payload?.featured ? '#f59e0b' : 'inherit' }}
                    onClick={async () => {
                      const isF = !!r.payload?.featured;
                      await upsertItem({ ...r, payload: { ...(r.payload || {}), featured: !isF } });
                      await done(); load();
                    }}
                  >
                    <Star size={15} fill={r.payload?.featured ? '#f59e0b' : 'none'} />
                  </button>
                )}
                <button title="Sửa" onClick={() => setEditing(JSON.parse(JSON.stringify(r)))}>✏️</button>
                <button title={r.visible === false || !r.published ? 'Cho hiện' : 'Ẩn đi'} onClick={() => show(r, r.visible === false || !r.published)}>{r.visible === false || !r.published ? <Eye size={15} /> : <EyeOff size={15} />}</button>
                <button title="Xóa" onClick={() => del(r.id)}><Trash2 size={15} /></button>
              </td>
            </tr>
          ))}
          {!shown.length && <tr><td colSpan="4" className="muted">Chưa có mục nào — bấm “Thêm mới” hoặc “Đồng bộ dữ liệu cũ”.</td></tr>}
        </tbody>
      </table>

      {editing && <ItemEditor kind={kind} form={editing} setForm={setEditing} onClose={() => setEditing(null)} onSave={save} />}
    </section>
  );
}

const KIND_META = {
  events: { col: 'Thời kỳ', summary: r => `${r.period || ''} ${r.year_start ? `(${r.year_start}–${r.year_end || r.year_start})` : ''}` },
  characters: { col: 'Vai trò', summary: r => (r.body || '').slice(0, 60) },
  announcements: { col: 'Nội dung', summary: r => (r.body || '').slice(0, 70) },
  default: { col: '', summary: () => '' },
};


export function generateCharacterQuestions(character, targetCount = 7, difficulty = "basic") {
  const name = character.title || character.name || "Nhân vật lịch sử";
  const p = character.payload || {};
  const fullText = (p.full_info || "").trim();
  const bio = (p.biography || "").trim();
  const ach = (p.achievements || "").trim();
  const con = (p.contributions || "").trim();
  const qot = (p.quote || "").trim();
  const mot = (p.motivation || "").trim();
  const mod = (p.modern_link || "").trim();
  const role = (p.role || character.body || "").trim();
  const era = (p.era || "").trim();

  const combined = [fullText, bio, ach, con, qot, mot, mod].filter(Boolean).join("\n");
  const questions = [];
  const usedKeys = new Set();

  function addQuestion(qText, options, answer, explanation) {
    if (questions.length >= targetCount) return;
    if (usedKeys.has(qText)) return;
    usedKeys.add(qText);
    const cleanOpts = Array.from(new Set([answer, ...options])).slice(0, 4);
    while (cleanOpts.length < 4) {
      cleanOpts.push("Phương án dự phòng " + (cleanOpts.length + 1));
    }
    const shuffled = [...cleanOpts].sort(() => Math.random() - 0.5);
    questions.push({
      id: "q-auto-" + (questions.length + 1) + "-" + Math.random().toString(36).slice(2, 7),
      question: qText,
      options: shuffled,
      answer: answer,
      explanation: explanation || `Đáp án đúng là: ${answer}.`,
      difficulty: difficulty,
    });
  }

  // 1. Tên húy / tên thật
  const huyMatch = combined.match(/tên hu[ýy] l[àa]\s*([^,.;()]+)/i) || combined.match(/tên th[ậa]t l[àa]\s*([^,.;()]+)/i);
  if (huyMatch && huyMatch[1]) {
    const huy = huyMatch[1].trim();
    addQuestion(
      `Tên húy (tên thật) của ${name} được ghi chép trong sử sách là gì?`,
      [huy, "Lê Lợi", "Lê Khoáng", "Lê Nghi Dân"],
      huy,
      `Theo chính sử ghi chép, ${name} có tên húy là ${huy}.`
    );
  }

  // 2. Vai trò / Triều đại
  if (role) {
    addQuestion(
      `Trong lịch sử dân tộc, ${name} giữ vai trò / vị thế nổi bật nào?`,
      [role, "Vị vua mở đầu triều đại", "Tể tướng nắm quyền phụ chính", "Đại tướng quân tổng chỉ huy"],
      role,
      `${name} được lịch sử tôn vinh với vị thế: ${role}.`
    );
  }

  // 3. Niên đại / Giai đoạn
  if (era) {
    addQuestion(
      `${name} hoạt động tiêu biểu và để lại dấu ấn trong thời kỳ lịch sử nào?`,
      [era, "Thời kỳ Bắc thuộc", "Thời kỳ Trịnh - Nguyễn phân tranh", "Thời kỳ cận - hiện đại"],
      era,
      `${name} gắn liền với giai đoạn lịch sử ${era}.`
    );
  }

  // 4. Năm sinh / Năm mất / Thời gian trị vì
  const yearMatch = combined.match(/(\d{3,4})\s*[–-]\s*(\d{3,4})/);
  if (yearMatch) {
    const periodStr = `${yearMatch[1]} – ${yearMatch[2]}`;
    const alt1 = `${parseInt(yearMatch[1]) - 12} – ${parseInt(yearMatch[2]) - 12}`;
    const alt2 = `${parseInt(yearMatch[1]) + 20} – ${parseInt(yearMatch[2]) + 20}`;
    const alt3 = `${parseInt(yearMatch[1]) + 45} – ${parseInt(yearMatch[2]) + 45}`;
    addQuestion(
      `Theo niên biểu lịch sử, năm sinh – năm mất (hoặc giai đoạn trị vì/hoạt động) của ${name} là:`,
      [periodStr, alt1, alt2, alt3],
      periodStr,
      `Mốc thời gian chính xác gắn liền với ${name} là ${periodStr}.`
    );
  }

  // 5. Câu nói nổi tiếng / Tuyên ngôn
  if (qot) {
    addQuestion(
      `Câu nói / tư tưởng nổi tiếng nào sau đây gắn liền với sự nghiệp của ${name}?`,
      [`“${qot}”`, "“Đầu thần chưa rơi xuống đất, xin bệ hạ đừng lo”", "“Bao giờ người Tây nhổ hết cỏ nước Nam mới hết người Nam đánh Tây”", "“Hiền tài là nguyên khí của quốc gia”"],
      `“${qot}”`,
      `Câu nói bất hủ của ${name} là: “${qot}”.`
    );
  }

  // 6. Luật pháp / Văn bản thể chế
  const lawMatch = combined.match(/(Luật [^,.;()]+|Quốc triều hình luật|bộ luật [^,.;()]+)/i);
  if (lawMatch) {
    const law = lawMatch[0].trim();
    addQuestion(
      `Bộ luật / văn bản thể chế tiêu biểu nào được ban hành hoặc hoàn thiện dưới thời ${name}?`,
      [law, "Hình thư thời Lý", "Hoàng Việt luật lệ thời Nguyễn", "Hình luật thời Trần"],
      law,
      `${law} là đỉnh cao thành tựu pháp chế gắn với tên tuổi của ${name}.`
    );
  }

  // 7. Cải cách hành chính / Đạo thừa tuyên / Lục bộ
  if (/lục bộ|13 đạo|đạo thừa tuyên|tể tướng/i.test(combined)) {
    addQuestion(
      `Điểm đổi mới mang tính đột phá trong bộ máy chính quyền của ${name} là gì?`,
      ["Bãi bỏ chức Tể tướng, đặt Lục bộ trực tiếp dưới quyền hoàng đế, chia cả nước thành 13 đạo thừa tuyên", "Duy trì quyền lực tối thượng cho các chư hầu dòng họ", "Chia cả nước thành 24 lộ như các triều đại trước", "Giao toàn quyền quản trị cho các quan đại thần đầu triều"],
      "Bãi bỏ chức Tể tướng, đặt Lục bộ trực tiếp dưới quyền hoàng đế, chia cả nước thành 13 đạo thừa tuyên",
      `Cuộc cải cách của ${name} đã tập trung quyền lực cao độ, xóa bỏ trung gian và chuyên môn hóa bộ máy cai trị.`
    );
  }

  // 8. Văn hóa - Giáo dục - Khoa cử
  if (/tao đàn|nhị thập bát tú|văn miếu|bia tiến sĩ|khoa cử/i.test(combined)) {
    addQuestion(
      `Đóng góp văn hóa - giáo dục đỉnh cao gắn liền với triều đại của ${name} là:`,
      ["Thành lập Hội Tao Đàn nhị thập bát tú và khuyến khích khoa cử, trọng dụng nhân tài", "Bãi bỏ hoàn toàn các kỳ thi cử Nho học", "Đóng cửa Quốc Tử Giám để giảm chi phí", "Nghiêm cấm sáng tác văn thơ chữ Nôm trong dân gian"],
      "Thành lập Hội Tao Đàn nhị thập bát tú và khuyến khích khoa cử, trọng dụng nhân tài",
      `${name} khởi xướng Hội Tao Đàn và phát triển nền giáo dục khoa cử rực rỡ.`
    );
  }

  // 9. Bản đồ Hồng Đức / Địa lý
  if (/bản đồ/i.test(combined)) {
    addQuestion(
      `Thành tựu mang tính bước ngoặt về địa lý và khẳng định chủ quyền lãnh thổ dưới thời ${name} là gì?`,
      ["Vẽ và ban hành bộ bản đồ địa lý toàn quốc đầu tiên (Hồng Đức bản đồ)", "Chia biên giới thành các khu vực tự trị biệt lập", "Thu hồi tất cả tài liệu địa lý lưu hành trong nước", "Nhờ thương nhân phương Tây vẽ bản đồ Đại Việt"],
      "Vẽ và ban hành bộ bản đồ địa lý toàn quốc đầu tiên (Hồng Đức bản đồ)",
      `Bộ bản đồ Hồng Đức là công trình địa lý khẳng định chủ quyền lãnh thổ toàn vẹn của Đại Việt thời ${name}.`
    );
  }

  // 10. Lý tưởng / Đường lối trị quốc
  if (mot) {
    addQuestion(
      `Tư tưởng cốt lõi và mục tiêu trị quốc của ${name} được thể hiện qua quan điểm nào?`,
      [mot, "Đóng cửa biên giới để tránh can thiệp từ bên ngoài", "Nhượng bộ quyền lợi dân tộc để duy trì hòa khí", "Tập trung xây dựng cung điện lộng lẫy xa hoa"],
      mot,
      `Tư tưởng trị quốc của ${name}: ${mot}.`
    );
  }

  // 11. Bài học kinh nghiệm & Liên hệ ngày nay
  if (mod) {
    addQuestion(
      `Từ cuộc đời và sự nghiệp của ${name}, bài học lịch sử sâu sắc nào còn nguyên giá trị đối với thời đại ngày nay?`,
      [mod, "Tuyển chọn nhân tài chỉ dựa trên quan hệ thân tộc", "Dựa hoàn toàn vào các liên minh ngoại quốc", "Xem nhẹ tính kỷ cương và pháp luật trong quản trị"],
      mod,
      `Ý nghĩa và bài học lịch sử từ ${name}: ${mod}.`
    );
  }

  // 12. Thành tựu & Chiến công
  if (ach) {
    addQuestion(
      `Thành tựu / chiến công tiêu biểu nhất làm nên danh tiếng của ${name} là:`,
      [ach.slice(0, 110), "Để nền kinh tế rơi vào suy thoái kéo dài", "Không để lại dấu ấn nào trong sử sách", "Làm suy yếu khối đại đoàn kết toàn dân"],
      ach.slice(0, 110),
      `Thành tựu nổi bật: ${ach}.`
    );
  }

  // 13. Khai thác từng câu độc lập trong fullText để đạt đúng số lượng
  const sentences = fullText.split(/[.\n;]+/).map(s => s.trim()).filter(s => s.length > 20);
  for (const s of sentences) {
    if (questions.length >= targetCount) break;
    addQuestion(
      `Theo nguồn tư liệu lịch sử về ${name}, nhận định nào sau đây là hoàn toàn chuẩn xác?`,
      [s, `Thời đại của ${name} không chú trọng phát triển đất nước`, `${name} chủ trương bãi bỏ mọi giá trị văn hóa truyền thống`, "Tư liệu không xác nhận công lao"],
      s,
      `Chính sử ghi nhận chuẩn xác: "${s}".`
    );
  }

  // 14. Fallback an toàn để đảm bảo LUÔN ĐỦ 100% đúng số câu yêu cầu
  let step = 1;
  while (questions.length < targetCount) {
    addQuestion(
      `Câu hỏi ôn tập số ${step}: Giá trị lịch sử to lớn nhất mà ${name} để lại cho hậu thế là gì?`,
      [
        `Đóng góp to lớn cho sự độc lập, hưng thịnh và vị thế của dân tộc trong giai đoạn ${era || "lịch sử"}`,
        "Làm cạn kiệt ngân khố quốc gia",
        "Chỉ tập trung vào lợi ích của riêng hoàng tộc",
        "Làm mai một truyền thống yêu nước của dân tộc",
      ],
      `Đóng góp to lớn cho sự độc lập, hưng thịnh và vị thế của dân tộc trong giai đoạn ${era || "lịch sử"}`,
      `${name} là biểu tượng sáng ngời về lòng yêu nước và tài năng lãnh đạo trong lịch sử dân tộc.`
    );
    step++;
  }

  return questions.slice(0, targetCount);
}

function ItemEditor({ kind, form, setForm, onClose, onSave }) {
  const [imgBusy, setImgBusy] = useState('');
  const p = form.payload || {};
  const set = (patch) => setForm({ ...form, ...patch });
  const setP = (patch) => setForm({ ...form, payload: { ...p, ...patch } });
  async function pickFile(e) {
    const f = e.target.files?.[0]; if (!f) return;
    setImgBusy('Đang tải lên…');
    try { const url = await uploadImage(f); setP({ image_upload: url }); set({ image_url: url }); setImgBusy(''); }
    catch (err) { setImgBusy('Lỗi upload: ' + err.message); }
  }
  return (
    <div className="modal-back" onClick={onClose}>
      <div className="modal wide-modal" onClick={e => e.stopPropagation()}>
        <button className="modal-x" onClick={onClose}><X size={18} /></button>
        <h3 className="museum-h3">{form.id ? 'Sửa' : 'Thêm'} {kind === 'events' ? 'sự kiện' : kind === 'characters' ? 'nhân vật' : 'thông báo'}</h3>
        <label className="f-label">Tiêu đề / Tên<input className="field" value={form.title} onChange={e => set({ title: e.target.value })} /></label>

        {kind === 'events' && <>
          <div className="f-row3">
            <label className="f-label">Nhánh<select className="field" value={form.region || 'vietnam'} onChange={e => set({ region: e.target.value })}><option value="vietnam">Việt Nam</option><option value="world">Thế giới</option></select></label>
            <label className="f-label">Thời kỳ<select className="field" value={form.period || ''} onChange={e => set({ period: e.target.value })}><option value="">— chọn —</option>{PERIODS.map(x => <option key={x}>{x}</option>)}</select></label>
            <label className="f-label">Năm từ<input type="number" className="field" value={form.year_start ?? ''} onChange={e => set({ year_start: e.target.value ? +e.target.value : null })} /></label>
            <label className="f-label">đến<input type="number" className="field" value={form.year_end ?? ''} onChange={e => set({ year_end: e.target.value ? +e.target.value : null })} /></label>
          </div>
          <label className="f-label">Mốc thời gian hiển thị (vd “Năm 1945”)<input className="field" value={p.periodText || form.period || ''} onChange={e => setP({ periodText: e.target.value })} /></label>
          <label className="f-label">Thông tin cơ bản<textarea className="field" rows="3" value={form.body} onChange={e => set({ body: e.target.value })} /></label>
          <label className="f-label">Phân tích chuyên sâu<textarea className="field" rows="3" value={p.advanced || ''} onChange={e => setP({ advanced: e.target.value })} /></label>
          <div className="f-row2">
            {['causes', 'course', 'results', 'significance'].map(k => (
              <label key={k} className="f-label">{EVENT_FIELD[k]}<textarea className="field" rows="2" value={p[k] || ''} onChange={e => setP({ [k]: e.target.value })} /></label>
            ))}
          </div>
          <label className="f-label">Toàn văn tư liệu (tùy chọn)<textarea className="field" rows="3" value={p.full_wiki || ''} onChange={e => setP({ full_wiki: e.target.value })} /></label>
          <label className="f-label">Nguồn tham khảo<input className="field" value={p.source || ''} onChange={e => setP({ source: e.target.value })} placeholder="SGK Lịch sử 12, tr.45; Wikimedia…" /></label>
          <label className="chk" style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input type="checkbox" checked={!!p.featured} onChange={e => setP({ featured: e.target.checked })} />
            ⭐ <b>Ghim vào "Sự kiện lịch sử nổi bật" ở Trang chủ</b>
          </label>
        </>}

        {kind === 'characters' && (() => {
          const curRarity = p.rarity || 'basic';
          const rarityInfo = RARITY[curRarity] || RARITY.basic;
          const targetCount = p.unlock_count ?? rarityInfo.count;
          const diffMap = { basic: 'Nhận biết (Dễ)', rare: 'Thông hiểu (Trung bình)', epic: 'Vận dụng (Khó)', legend: 'Vận dụng cao (Rất khó)' };
          const diffLabel = diffMap[curRarity] || 'Nhận biết';
          const diffKey = curRarity === 'legend' ? 'expert' : curRarity === 'epic' ? 'advanced' : curRarity === 'rare' ? 'medium' : 'basic';

          function handleAutoGenerateQuestions() {
            const qs = generateCharacterQuestions(form, targetCount, diffKey);
            setP({ questions: qs, unlock_count: qs.length });
          }

          function patchQuestion(idx, patch) {
            const list = [...(p.questions || [])];
            list[idx] = { ...list[idx], ...patch };
            setP({ questions: list });
          }

          function handleDeleteQuestion(idx) {
            const list = (p.questions || []).filter((_, i) => i !== idx);
            setP({ questions: list, unlock_count: list.length });
          }

          function handleAddEmptyQuestion() {
            const list = [...(p.questions || [])];
            list.push({
              id: 'q-manual-' + (list.length + 1) + '-' + Math.random().toString(36).slice(2, 6),
              question: 'Câu hỏi mới về ' + (form.title || 'nhân vật') + '?',
              options: ['Phương án đúng', 'Phương án sai 1', 'Phương án sai 2', 'Phương án sai 3'],
              answer: 'Phương án đúng',
              explanation: 'Giải thích đáp án...',
              difficulty: diffKey,
            });
            setP({ questions: list, unlock_count: list.length });
          }

          return (
            <>
              <div className="f-row2">
                <label className="f-label">Vai trò<input className="field" value={p.role || ''} onChange={e => setP({ role: e.target.value })} /></label>
                <label className="f-label">Giai đoạn<input className="field" value={p.era || ''} onChange={e => setP({ era: e.target.value })} /></label>
                <label className="f-label">Nhánh<select className="field" value={p.region || 'vietnam'} onChange={e => setP({ region: e.target.value })}><option value="vietnam">Việt Nam</option><option value="world">Thế giới</option></select></label>
                <label className="f-label">Độ hiếm<select className="field" value={p.rarity || 'basic'} onChange={e => {
                  const rKey = e.target.value;
                  const rObj = RARITY[rKey] || RARITY.basic;
                  setP({ rarity: rKey, unlock_count: rObj.count, unlock_minutes: rObj.minutes, points: rObj.points });
                }}>{Object.entries(RARITY).map(([k, v]) => <option key={k} value={k}>{v.label} ({v.count} câu{v.minutes ? `/${v.minutes}′` : ''} · {v.points}đ)</option>)}</select></label>
              </div>

              {/* Ô NHẬP TOÀN BỘ THÔNG TIN NHÂN VẬT (Yêu cầu thêm của người dùng) */}
              <label className="f-label">
                <b>Toàn bộ thông tin nhân vật (Nhập để hệ thống tự sinh câu hỏi chuẩn theo độ hiếm)</b>
                <textarea
                  className="field"
                  rows="6"
                  value={p.full_info || ''}
                  onChange={e => setP({ full_info: e.target.value })}
                  placeholder="Dán toàn bộ thông tin nhân vật: tên húy, năm sinh - năm mất, quê quán, dòng dõi, cuộc đời, sự nghiệp, các cải cách, chiến công, tác phẩm, câu nói nổi tiếng, đóng góp lịch sử..."
                />
              </label>

              {/* Nút tự động sinh câu hỏi theo độ hiếm */}
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', margin: '6px 0 12px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={handleAutoGenerateQuestions}
                  disabled={!form.title && !p.full_info}
                >
                  <Sparkles size={15} /> ⚡ Tự động sinh câu hỏi theo độ hiếm ({targetCount} câu · {rarityInfo.label})
                </button>
                {p.questions?.length > 0 && (
                  <span className="success" style={{ fontSize: '13px', fontWeight: 600 }}>
                    ✓ Đã có {p.questions.length}/{targetCount} câu hỏi ({diffLabel})
                  </span>
                )}
              </div>

              {/* Danh sách câu hỏi sinh ra để Admin xem và chỉnh sửa */}
              {p.questions?.length > 0 && (
                <div className="char-q-box">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <b>Danh sách câu hỏi thử thách mở khóa ({p.questions.length} câu):</b>
                    <button type="button" className="btn-ghost" style={{ fontSize: '12px', padding: '3px 8px' }} onClick={handleAddEmptyQuestion}>+ Thêm câu hỏi</button>
                  </div>
                  <div style={{ maxHeight: '280px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {p.questions.map((qItem, qIdx) => (
                      <div key={qIdx} className="char-q-item">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                          <span style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--burgundy)' }}>Câu {qIdx + 1} ({qItem.difficulty || 'basic'}):</span>
                          <button type="button" className="btn-ghost" style={{ padding: '2px 5px', color: '#c0392b' }} title="Xóa câu này" onClick={() => handleDeleteQuestion(qIdx)}><Trash2 size={13} /></button>
                        </div>
                        <input
                          className="field"
                          style={{ width: '100%', marginTop: '4px', fontSize: '13px' }}
                          value={qItem.question || ''}
                          onChange={e => patchQuestion(qIdx, { question: e.target.value })}
                          placeholder="Nội dung câu hỏi..."
                        />
                        <div className="char-q-opts">
                          {(qItem.options || []).map((opt, optIdx) => (
                            <div key={optIdx} className={`char-q-opt ${opt === qItem.answer ? 'is-ans' : ''}`}>
                              <input
                                type="radio"
                                name={`ans-${qIdx}`}
                                checked={opt === qItem.answer}
                                onChange={() => patchQuestion(qIdx, { answer: opt })}
                                title="Chọn làm đáp án đúng"
                              />
                              <input
                                className="field"
                                style={{ flex: 1, fontSize: '12px', padding: '3px 6px' }}
                                value={opt}
                                onChange={e => {
                                  const newOpts = [...qItem.options];
                                  newOpts[optIdx] = e.target.value;
                                  const isCurAns = opt === qItem.answer;
                                  patchQuestion(qIdx, {
                                    options: newOpts,
                                    answer: isCurAns ? e.target.value : qItem.answer
                                  });
                                }}
                              />
                            </div>
                          ))}
                        </div>
                        <input
                          className="field"
                          style={{ width: '100%', marginTop: '4px', fontSize: '12px' }}
                          value={qItem.explanation || ''}
                          onChange={e => patchQuestion(qIdx, { explanation: e.target.value })}
                          placeholder="Giải thích đáp án..."
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <label className="f-label">Câu nói nổi tiếng<input className="field" value={p.quote || ''} onChange={e => setP({ quote: e.target.value })} /></label>
              <label className="f-label">Tiểu sử<textarea className="field" rows="3" value={p.biography || ''} onChange={e => setP({ biography: e.target.value })} /></label>
              <div className="f-row2">
                <label className="f-label">Thành tựu<textarea className="field" rows="2" value={p.achievements || ''} onChange={e => setP({ achievements: e.target.value })} /></label>
                <label className="f-label">Đóng góp<textarea className="field" rows="2" value={p.contributions || ''} onChange={e => setP({ contributions: e.target.value })} /></label>
                <label className="f-label">Lý tưởng<textarea className="field" rows="2" value={p.motivation || ''} onChange={e => setP({ motivation: e.target.value })} /></label>
                <label className="f-label">Liên hệ hôm nay<textarea className="field" rows="2" value={p.modern_link || ''} onChange={e => setP({ modern_link: e.target.value })} /></label>
              </div>
              <p className="muted small">Trường thử thách: số câu ({targetCount}) — tự sinh chuẩn theo độ hiếm {rarityInfo.label}; thời gian phút: {p.unlock_minutes ?? (rarityInfo.minutes ? `${rarityInfo.minutes} phút` : 'không giới hạn')}; điểm thưởng: {p.points ?? rarityInfo.points}. Học sinh đã mở khóa sẽ KHÔNG mất trạng thái khi bạn sửa thẻ.</p>
            </>
          );
        })()}

        {kind === 'announcements' && <label className="f-label">Nội dung thông báo<textarea className="field" rows="3" value={form.body} onChange={e => set({ body: e.target.value })} /></label>}

        <label className="f-label">Ảnh (URL)<input className="field" value={form.image_url || ''} onChange={e => set({ image_url: e.target.value })} /></label>
        <label className="f-label">Tải ảnh lên Media Library<input type="file" accept="image/*" onChange={pickFile} />{imgBusy && <small> {imgBusy}</small>}</label>
        <label className="f-label">Chú thích ảnh (ghi rõ minh họa/tư liệu)<input className="field" value={p.image_caption || ''} onChange={e => setP({ image_caption: e.target.value })} /></label>

        <div className="row-gap">
          <button className="btn-primary" onClick={() => onSave(form)} disabled={!form.title.trim()}><Save size={15} /> Lưu</button>
          <label className="chk"><input type="checkbox" checked={form.published !== false} onChange={e => set({ published: e.target.checked })} /> Xuất bản (hiện với học sinh)</label>
        </div>
      </div>
    </div>
  );
}
const EVENT_FIELD = { causes: 'Nguyên nhân', course: 'Diễn biến', results: 'Kết quả', significance: 'Ý nghĩa' };

// ---------- 5. MAP STUDIO (upload nền, click đặt ghim, kéo ghim, link sự kiện) ----------
function MapStudio({ done }) {
  const [rows, setRows] = useState([]);
  const [busy, setBusy] = useState('');
  const load = () => listItems('maps', true).then(setRows).catch(e => setBusy(e.message));
  useEffect(() => { load(); }, []);
  const [edit, setEdit] = useState(null); // content row being edited in studio

  async function newMap() {
    const title = prompt('Tên bản đồ mới (vd: Đông Nam Á 1954):'); if (!title) return;
    try {
      const r = await upsertItem({ kind: 'maps', title, body: '', published: false, visible: false, payload: { markers: [], year: null } });
      await done(); load(); setEdit(r);
    } catch (e) { setBusy('Lỗi tạo bản đồ: ' + e.message); }
  }
  async function seedLegacy(m) {
    try {
      await upsertItem({ kind: 'maps', legacy_id: m.key, title: m.title, body: m.description, published: true, visible: true, payload: { year: m.year, markers: m.markers } });
      await done(); load();
      setBusy(`Đã đưa “${m.title}” vào CMS — giờ bạn có thể tải ảnh nền và chỉnh ghim.`);
    } catch (e) { setBusy('Lỗi: ' + e.message); }
  }

  return (
    <section>
      <h3 className="museum-h3">Map Studio — tạo bản đồ không cần code</h3>
      <p className="muted small">Quy trình: (1) Tạo bản đồ / đưa bản đồ mẫu vào CMS → (2) tải ảnh bản đồ nền (nên lấy ảnh public-domain từ Wikimedia Commons, ghi nguồn) → (3) bấm trên ảnh để đặt ghim, kéo ghim để chỉnh → (4) gắn sự kiện cho từng ghim → (5) Xuất bản.</p>
      {busy && <p role="status">{busy}</p>}
      <div className="row-gap wrap">
        <button className="btn-primary" onClick={newMap}><Plus size={15} /> Bản đồ mới</button>
        {LEGACY_MAPS.map(m => (
          <button key={m.key} className="btn-ghost" onClick={() => seedLegacy(m)}>Đưa “{m.title}” vào CMS</button>
        ))}
      </div>
      <table className="admin-table">
        <thead><tr><th>Bản đồ</th><th>Số ghim</th><th>Trạng thái</th><th></th></tr></thead>
        <tbody>{rows.map(r => (
          <tr key={r.id}>
            <td><b>{r.title}</b> <small>{r.payload?.year || ''}</small></td>
            <td>{(r.payload?.markers || []).length}</td>
            <td>{r.published ? <span className="pill ok">Đã xuất bản</span> : <span className="pill">Bản nháp</span>}</td>
            <td><button onClick={() => setEdit(JSON.parse(JSON.stringify(r)))}>Mở Map Studio</button></td>
          </tr>
        ))}</tbody>
      </table>
      {edit && <MapEditor row={edit} setRow={setEdit} onClose={() => setEdit(null)} onSave={async (r) => {
        try { await upsertItem(r); await done(); load(); setEdit(null); setBusy('✔ Đã lưu bản đồ “' + r.title + '”.'); }
        catch (e) { setBusy('Lỗi lưu: ' + e.message); }
      }} />}
    </section>
  );
}

function MapEditor({ row, setRow, onClose, onSave }) {
  const { events } = useData();
  const [placing, setPlacing] = useState(false);
  const dragIdx = useRef(-1);
  const imgRef = useRef(null);
  const [uploading, setUploading] = useState('');
  const markers = row.payload?.markers || [];
  const set = (patch) => setRow({ ...row, ...patch });
  const setP = (patch) => setRow({ ...row, payload: { ...row.payload, ...patch } });

  function pctFromEvent(e) {
    const rect = imgRef.current.getBoundingClientRect();
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 1000) / 10;
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 1000) / 10;
    return { x: Math.min(100, Math.max(0, x)), y: Math.min(100, Math.max(0, y)) };
  }
  function onStageClick(e) {
    if (!placing) return;
    const name = window.prompt('Tên địa danh cho điểm ghim này:'); if (!name) return;
    setP({ markers: [...markers, { x: 50, y: 50, name, description: '', event_key: '', ...pctFromEvent(e) }] });
    setPlacing(false);
  }
  function onPinDown(i) { dragIdx.current = i; }
  function onStageMove(e) {
    if (dragIdx.current < 0) return;
    const pos = pctFromEvent(e);
    setP({ markers: markers.map((m, j) => j === dragIdx.current ? { ...m, ...pos } : m) });
  }
  async function upload(e) {
    const f = e.target.files?.[0]; if (!f) return;
    setUploading('Đang tải ảnh nền…');
    try { const url = await uploadImage(f); set({ image_url: url }); setUploading(''); }
    catch (err) { setUploading('Lỗi: ' + err.message); }
  }
  const patch = (i, p) => setP({ markers: markers.map((m, j) => j === i ? { ...m, ...p } : m) });

  return (
    <div className="modal-back" onClick={onClose}>
      <div className="modal wide-modal" onClick={e => e.stopPropagation()}>
        <button className="modal-x" onClick={onClose}><X size={18} /></button>
        <h3 className="museum-h3">Soạn bản đồ: {row.title}</h3>
        <div className="f-row2">
          <label className="f-label">Tiêu đề<input className="field" value={row.title} onChange={e => set({ title: e.target.value })} /></label>
          <label className="f-label">Năm<input type="number" className="field" value={row.payload?.year ?? ''} onChange={e => setP({ year: e.target.value ? +e.target.value : null })} /></label>
        </div>
        <label className="f-label">Mô tả<textarea className="field" rows="2" value={row.body} onChange={e => set({ body: e.target.value })} /></label>
        <div className="row-gap wrap">
          <label className="btn-ghost file-btn">Tải ảnh bản đồ nền<input type="file" accept="image/*" onChange={upload} hidden /></label>
          {uploading && <small>{uploading}</small>}
          <button className={placing ? 'btn-primary' : 'btn-ghost'} onClick={() => setPlacing(!placing)}>{placing ? 'Bấm lên ảnh để đặt ghim…' : '+ Đặt ghim (bấm vào ảnh)'}</button>
        </div>
        <div className={`studio-stage ${placing ? 'placing' : ''}`} onClick={onStageClick} onPointerMove={onStageMove} onPointerUp={() => { dragIdx.current = -1; }}>
          {row.image_url
            ? <img ref={imgRef} src={row.image_url} alt="Bản đồ nền" draggable="false" />
            : <div ref={imgRef} className="map-placeholder studio-ph"><b>Chưa có ảnh nền</b><span>Tải ảnh bản đồ (nên là ảnh public-domain, ghi rõ nguồn ở khung chú thích) hoặc dán URL. Khung xám dưới đây dùng để tập đặt ghim.</span></div>}
          {markers.map((m, i) => (
            <button key={i} className="map-pin studio-pin" style={{ left: `${m.x}%`, top: `${m.y}%` }}
              onPointerDown={e => { e.stopPropagation(); onPinDown(i); }}
              title={m.name}><MapPin size={16} fill="currentColor" /></button>
          ))}
        </div>
        <label className="f-label">Chú thích nguồn ảnh nền (bắt buộc ghi nguồn giấy phép)<input className="field" value={row.payload?.source_note || ''} onChange={e => setP({ source_note: e.target.value })} placeholder="Wikimedia Commons — public domain / CC…" /></label>

        <b>Danh sách ghim ({markers.length}) — sửa, gắn sự kiện, xóa:</b>
        <div className="pin-list">
          {markers.map((m, i) => (
            <div key={i} className="pin-row page-panel" style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
              <GripVertical size={14} />
              {/* Ô 1: Tên / Địa danh */}
              <input
                className="field"
                style={{ width: '130px', minWidth: '100px' }}
                value={m.name || ''}
                placeholder="Tên / Địa danh"
                onChange={e => patch(i, { name: e.target.value })}
              />

              {/* Ô 2 (ở giữa): Mô tả sự kiện + Thêm ảnh */}
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flex: 1, minWidth: '240px' }}>
                <input
                  className="field grow"
                  value={m.description || ''}
                  placeholder="Mô tả sự kiện / ghi chú"
                  onChange={e => patch(i, { description: e.target.value })}
                />
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  {(m.image_url || m.image) && (
                    <img
                      src={m.image_url || m.image}
                      alt="Ghim"
                      style={{ width: 28, height: 28, objectFit: 'cover', borderRadius: 4, border: '1px solid var(--line)' }}
                    />
                  )}
                  <input
                    className="field"
                    style={{ width: '110px' }}
                    value={m.image_url || m.image || ''}
                    placeholder="URL ảnh..."
                    onChange={e => patch(i, { image_url: e.target.value, image: e.target.value })}
                  />
                  <label className="btn-ghost file-btn" style={{ padding: '5px 8px', cursor: 'pointer' }} title="Tải ảnh cho ghim này">
                    <ImageIcon size={14} />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={async (e) => {
                        const f = e.target.files?.[0];
                        if (!f) return;
                        try {
                          const url = await uploadImage(f);
                          patch(i, { image_url: url, image: url });
                        } catch (err) { alert(err.message); }
                      }}
                      hidden
                    />
                  </label>
                  {(m.image_url || m.image) && (
                    <button
                      type="button"
                      className="btn-ghost"
                      style={{ padding: '2px 6px' }}
                      title="Bỏ ảnh"
                      onClick={() => patch(i, { image_url: '', image: '' })}
                    >✕</button>
                  )}
                </div>
              </div>

              {/* Ô 3: Tự viết tự do (không chọn dropdown mặc định) */}
              <input
                className="field"
                style={{ width: '180px', minWidth: '140px' }}
                value={m.event_name || m.event_key || ''}
                placeholder="Tên sự kiện tự nhập..."
                onChange={e => patch(i, { event_name: e.target.value, event_key: e.target.value })}
              />

              <button title="Xóa ghim" onClick={() => setP({ markers: markers.filter((_, j) => j !== i) })}><Trash2 size={14} /></button>
            </div>
          ))}
        </div>
        <div className="row-gap">
          <label className="chk"><input type="checkbox" checked={!!row.published} onChange={e => set({ published: e.target.checked, visible: e.target.checked })} /> Xuất bản cho học sinh</label>
          <button className="btn-primary" onClick={() => onSave(row)}><Save size={15} /> Lưu bản đồ</button>
        </div>
      </div>
    </div>
  );
}

// ---------- 6. QUESTION BANK + CSV ----------
function QuestionManager({ done }) {
  const [rows, setRows] = useState([]);
  const [editing, setEditing] = useState(null);
  const [busy, setBusy] = useState('');
  const [q, setQ] = useState('');
  const load = () => listItems('questions', true).then(setRows).catch(e => setBusy(e.message));
  useEffect(() => { load(); }, []);

  async function save(form) {
    const p = form.payload || {};
    const opts = (p.options || []).filter(Boolean);
    if (opts.length < 2) { setBusy('Cần ít nhất 2 phương án.'); return; }
    if (!opts.includes(p.answer)) { setBusy('Đáp án đúng phải khớp chính xác một phương án.'); return; }
    try {
      await upsertItem({ ...form, kind: 'questions', title: form.title, payload: { ...p, options: opts } });
      await done(); load(); setEditing(null); setBusy('✔ Đã lưu câu hỏi.');
    } catch (e) { setBusy('Lỗi lưu: ' + e.message); }
  }

  function parseCSV(text) {
    // chấp nhận phân cách ; hoặc , — bỏ dấu ngoặc kép chuẩn CSV
    const lines = text.replace(/\r/g, '').split('\n').filter(l => l.trim());
    const delim = (lines[0].match(/;/g) || []).length >= (lines[0].match(/,/g) || []).length ? ';' : ',';
    const cell = line => { const out = []; let cur = '', inQ = false; for (let i = 0; i < line.length; i++) { const ch = line[i]; if (ch === '"') { if (inQ && line[i + 1] === '"') { cur += '"'; i++; } else inQ = !inQ; } else if (ch === delim && !inQ) { out.push(cur); cur = ''; } else cur += ch; } out.push(cur); return out.map(s => s.trim()); };
    return { delim, lines: lines.map(cell) };
  }
  async function importCSV(e) {
    const f = e.target.files?.[0]; if (!f) return;
    setBusy('Đang đọc CSV…');
    try {
      const text = await f.text();
      const { lines } = parseCSV(text);
      const cols = lines[0].map(c => c.toLowerCase());
      const idx = name => cols.indexOf(name);
      if (idx('question') < 0) { setBusy('CSV cần cột: question;A;B;C;D;answer;explanation;region;period (thêm dòng tiêu đề nếu thiếu).'); return; }
      let ok = 0, fail = 0, errs = [];
      for (let i = 1; i < lines.length; i++) {
        const r = lines[i];
        const question = r[idx('question')]; if (!question) continue;
        const options = ['a', 'b', 'c', 'd'].map(k => r[idx(k)]).filter(Boolean);
        const answer = r[idx('answer')];
        if (options.length < 2 || !answer || !options.includes(answer)) { fail++; errs.push(`dòng ${i + 1}: thiếu phương án/đáp án khớp`); continue; }
        try {
          await upsertItem({ kind: 'questions', title: question, body: '', published: true, visible: true,
            region: r[idx('region')] || 'all', period: r[idx('period')] || 'all',
            payload: { options, answer, explanation: idx('explanation') >= 0 ? r[idx('explanation')] : '', difficulty: idx('difficulty') >= 0 ? r[idx('difficulty')] : 'basic' } });
          ok++;
        } catch (err) { fail++; errs.push(`dòng ${i + 1}: ${err.message}`); }
      }
      setBusy(`Import CSV: ${ok} câu vào · ${fail} lỗi.${errs.slice(0, 3).map(x => ' ' + x).join('')}`);
      load();
    } catch (err) { setBusy('File lỗi: ' + err.message); }
    e.target.value = '';
  }

  const shown = rows.filter(r => !q || r.title.toLowerCase().includes(q.toLowerCase()));
  return (
    <section>
      <div className="row-gap wrap">
        <input className="field grow" placeholder="Tìm câu hỏi…" value={q} onChange={e => setQ(e.target.value)} />
        <button className="btn-primary" onClick={() => setEditing({ title: '', body: '', published: true, payload: { options: ['', '', '', ''], answer: '', explanation: '', difficulty: 'basic', region: 'all', period: 'all' } })}><Plus size={15} /> Thêm câu</button>
        <label className="btn-ghost file-btn"><Upload size={15} /> Nhập CSV/Excel (.csv)<input type="file" accept=".csv,text/csv" onChange={importCSV} hidden /></label>
        <button className="btn-ghost" onClick={() => downloadCSV('cau-hoi-mau.csv', [['question', 'A', 'B', 'C', 'D', 'answer', 'explanation', 'region', 'period'], ['Trận Bạch Đằng 938 do ai lãnh đạo?', 'Ngô Quyền', 'Lê Hoàn', 'Trần Hưng Đạo', ' Quang Trung', 'Ngô Quyền', 'Ngô Quyền đánh Nam Hán.', 'vietnam', 'Cổ đại']])}><Download size={15} /> Tải mẫu CSV</button>
      </div>
      {busy && <p role="status">{busy}</p>}
      <table className="admin-table">
        <thead><tr><th>Câu hỏi</th><th>Chủ đề</th><th>Đáp án</th><th></th></tr></thead>
        <tbody>{shown.map(r => (
          <tr key={r.id}>
            <td>{r.title.length > 90 ? r.title.slice(0, 90) + '…' : r.title}</td>
            <td><small>{r.region || 'all'} · {r.period || 'all'}</small></td>
            <td><small>{r.payload?.answer}</small></td>
            <td className="row-gap">
              <button onClick={() => setEditing(JSON.parse(JSON.stringify({ ...r, payload: { options: ['', ''], ...(r.payload || {}) } })))}>✏️</button>
              <button onClick={async () => { if (confirm('Xóa câu hỏi này?')) { await removeItem(r.id); await done(); load(); } }}><Trash2 size={15} /></button>
            </td>
          </tr>
        ))}</tbody>
      </table>

      {editing && (
        <div className="modal-back" onClick={() => setEditing(null)}>
          <div className="modal wide-modal" onClick={e => e.stopPropagation()}>
            <button className="modal-x" onClick={() => setEditing(null)}><X size={18} /></button>
            <h3 className="museum-h3">{editing.id ? 'Sửa' : 'Thêm'} câu hỏi</h3>
            <label className="f-label">Câu hỏi<textarea className="field" rows="2" value={editing.title} onChange={e => setEditing({ ...editing, title: e.target.value })} /></label>
            {(editing.payload?.options || ['', '', '', '']).map((opt, i) => (
              <label key={i} className="f-label">Phương án {String.fromCharCode(65 + i)}
                <div className="row-gap">
                  <input className="field grow" value={opt} onChange={e => { const o = [...editing.payload.options]; o[i] = e.target.value; setEditing({ ...editing, payload: { ...editing.payload, options: o } }); }} />
                  <button className={editing.payload.answer === opt && opt ? 'radio on' : 'radio'} title="Chọn làm đáp án đúng" onClick={() => setEditing({ ...editing, payload: { ...editing.payload, answer: opt } })}>{editing.payload.answer === opt && opt ? <Check size={14} /> : '○'}</button>
                </div>
              </label>
            ))}
            <p className="muted small">Bấm ○ cạnh phương án đúng. ({editing.payload?.answer ? 'Đáp án: ' + editing.payload.answer : 'Chưa chọn đáp án!'})</p>
            <label className="f-label">Giải thích (hiện sau khi nộp)<textarea className="field" rows="2" value={editing.payload?.explanation || ''} onChange={e => setEditing({ ...editing, payload: { ...editing.payload, explanation: e.target.value } })} /></label>
            <div className="f-row3">
              <label className="f-label">Chủ đề<select className="field" value={editing.payload?.region || 'all'} onChange={e => setEditing({ ...editing, payload: { ...editing.payload, region: e.target.value } })}><option value="all">Cả hai</option><option value="vietnam">Việt Nam</option><option value="world">Thế giới</option></select></label>
              <label className="f-label">Thời kỳ<select className="field" value={editing.payload?.period || 'all'} onChange={e => setEditing({ ...editing, payload: { ...editing.payload, period: e.target.value } })}><option value="all">Mọi thời kỳ</option>{PERIODS.map(p => <option key={p}>{p}</option>)}</select></label>
              <label className="f-label">Độ khó<select className="field" value={editing.payload?.difficulty || 'basic'} onChange={e => setEditing({ ...editing, payload: { ...editing.payload, difficulty: e.target.value } })}><option value="basic">Cơ bản</option><option value="advanced">Nâng cao</option></select></label>
            </div>
            <button className="btn-primary" onClick={() => save(editing)}><Save size={15} /> Lưu câu hỏi</button>
          </div>
        </div>
      )}
    </section>
  );
}

// ---------- 7. MEDIA LIBRARY ----------
function MediaLibrary({ done }) {
  const [files, setFiles] = useState([]);
  const [meta, setMeta] = useState({});
  const [busy, setBusy] = useState('');
  const load = () => supabase.storage.from('historlog-media').list('', { limit: 200, sortBy: { order: 'desc' } })
    .then(({ data, error }) => { if (error) throw error; setFiles((data || []).filter(f => f.name !== '.emptyFolderPlaceholder')); })
    .catch(e => setBusy('Media lỗi: ' + e.message + ' (bucket historlog-media cần tồn tại — xem docs)'));
  useEffect(() => { load(); }, []);
  // metadata lưu trong content_items kind=media (payload: source/author/license/caption)
  useEffect(() => { listItems('media', true).then(rows => setMeta(Object.fromEntries(rows.map(r => [r.payload?.path, r])))).catch(() => {}); }, []);

  async function upload(e) {
    const fs = [...(e.target.files || [])]; if (!fs.length) return;
    setBusy(`Đang tải ${fs.length} ảnh…`);
    let ok = 0;
    for (const f of fs) {
      try { await uploadImage(f); ok++; } catch (err) { setBusy('Lỗi ' + f.name + ': ' + err.message); }
    }
    setBusy(`✔ Đã tải ${ok}/${fs.length} ảnh lên Media Library.`);
    load(); e.target.value = '';
  }
  async function saveMeta(path, fields) {
    const existing = meta[path];
    await upsertItem({ ...(existing || {}), kind: 'media', title: fields.caption || path, body: '', published: true, visible: true,
      legacy_id: existing?.legacy_id || ('media-' + path), payload: { path, ...fields } });
    await done();
    listItems('media', true).then(rows => setMeta(Object.fromEntries(rows.map(r => [r.payload?.path, r])))).catch(() => {});
  }
  const url = f => supabase.storage.from('historlog-media').getPublicUrl(f.name).data.publicUrl;

  return (
    <section>
      <h3 className="museum-h3">Media Library — ảnh dùng chung cho mọi trang</h3>
      <p className="muted small">Bắt buộc ghi <b>Nguồn · Tác giả · Giấy phép · Chú thích</b> cho mỗi ảnh. Ảnh AI/phục dựng chỉ là minh họa — chú thích phải nói rõ, không trình bày như tư liệu gốc.</p>
      {busy && <p role="status">{busy}</p>}
      <label className="btn-primary file-btn"><Upload size={15} /> Tải ảnh lên<input type="file" accept="image/*" multiple onChange={upload} hidden /></label>
      <div className="media-grid">
        {files.map(f => {
          const m = meta[f.name]?.payload || {};
          return (
            <div key={f.name} className="media-card page-panel">
              <img src={url(f)} alt={f.name} loading="lazy" />
              <input className="field" placeholder="Chú thích" defaultValue={m.caption || ''} onChange={e => saveMeta(f.name, { ...m, caption: e.target.value })} />
              <input className="field" placeholder="Nguồn (SGK/Wikimedia…)" defaultValue={m.source || ''} onChange={e => saveMeta(f.name, { ...m, source: e.target.value })} />
              <input className="field" placeholder="Tác giả" defaultValue={m.author || ''} onChange={e => saveMeta(f.name, { ...m, author: e.target.value })} />
              <select className="field" defaultValue={m.license || ''} onChange={e => saveMeta(f.name, { ...m, license: e.target.value })}>
                <option value="">— giấy phép —</option><option>Public domain</option><option>CC BY</option><option>CC BY-SA</option><option>SGK (trích dẫn phục vụ dạy học)</option><option>Ảnh minh họa AI/phục dựng</option>
              </select>
              <button className="btn-ghost small" onClick={() => navigator.clipboard?.writeText(url(f))}>Copy URL</button>
            </div>
          );
        })}
        {!files.length && <p className="muted">Chưa có ảnh trong bucket.</p>}
      </div>
    </section>
  );
}

// ---------- 8. ACCOUNTS & ROLES ----------
function Accounts({ done }) {
  const [rows, setRows] = useState([]);
  const [busy, setBusy] = useState('');
  const load = () => supabase.from('profiles').select('id,email_hint,role,points,display_name,created_at').order('created_at', { ascending: false })
    .then(({ data, error }) => { if (error) throw error; setRows(data || []); })
    .catch(e => setBusy('Lỗi đọc profiles (cần migration 002): ' + e.message));
  useEffect(() => { load(); }, []);
  async function setRole(id, role) {
    try { await safeRpc('set_user_role', { p_user_id: id, p_role: role }); setBusy('✔ Đã đổi vai trò (server ghi log).'); await done(); load(); }
    catch (e) { setBusy('✖ ' + e.message); }
  }
  return (
    <section>
      <h3 className="museum-h3">Tài khoản & vai trò</h3>
      <p className="muted small">User không thể tự đổi vai trò (RLS chặn UPDATE) — chỉ admin qua RPC <code>set_user_role</code>, có ghi nhật ký. Email được ẩn một phần theo chính sách quyền riêng tư.</p>
      {busy && <p role="status">{busy}</p>}
      <table className="admin-table">
        <thead><tr><th>Người dùng</th><th>Điểm</th><th>Vai trò</th><th>Đổi vai trò</th></tr></thead>
        <tbody>{rows.map(r => (
          <tr key={r.id}>
            <td><small>{r.email_hint || r.id.slice(0, 8) + '…'}</small></td>
            <td>{r.points ?? '—'}</td>
            <td><span className={`pill ${r.role === 'admin' ? 'gold' : ''}`}>{r.role}</span></td>
            <td className="row-gap">
              {r.role !== 'admin' && <button onClick={() => confirm('Cấp admin cho tài khoản này?') && setRole(r.id, 'admin')}>→ admin</button>}
              {r.role === 'admin' && <button onClick={() => confirm('Hạ vai trò xuống user?') && setRole(r.id, 'user')}>→ user</button>}
            </td>
          </tr>
        ))}</tbody>
      </table>
    </section>
  );
}

// ---------- 9. POINTS & achievements ----------
function PointsScreen({ done }) {
  const [rows, setRows] = useState([]);
  const [busy, setBusy] = useState('');
  const load = () => supabase.from('profiles').select('id,points,display_name').order('points', { ascending: false }).limit(100)
    .then(({ data, error }) => { if (error) throw error; setRows(data || []); }).catch(e => setBusy(e.message));
  useEffect(() => { load(); }, []);
  async function adjust(userId) {
    const d = prompt('Cộng (+) hay trừ (−) bao nhiêu điểm? Vd: 20 hoặc -5'); if (!d) return;
    const reason = prompt('Lý do (bắt buộc, sẽ ghi log):'); if (!reason) return;
    try { await safeRpc('admin_adjust_points', { p_user: userId, p_delta: parseInt(d, 10), p_reason: reason }); setBusy('✔ Đã điều chỉnh (ledger + log).'); await done(); load(); }
    catch (e) { setBusy('✖ ' + e.message + ' — hàm admin_adjust_points thuộc migration 002.'); }
  }
  return (
    <section>
      <h3 className="museum-h3">Điểm & thành tựu</h3>
      <p className="muted small">Điểm chính thức do server cộng qua ledger (quiz +5/câu, mở khóa thẻ theo độ hiếm, trần 150đ/ngày). Nút điều chỉnh tay có lý do và lưu nhật ký.</p>
      {busy && <p role="status">{busy}</p>}
      <table className="admin-table">
        <thead><tr><th>#</th><th>Người dùng</th><th>Điểm</th><th>Huy hiệu</th><th></th></tr></thead>
        <tbody>{rows.map((r, i) => (
          <tr key={r.id}><td>{i + 1}</td><td><small>{r.display_name || r.id.slice(0, 8) + '…'}</small></td><td><b>{r.points}</b></td><td>{tierName(r.points)}</td>
            <td><button onClick={() => adjust(r.id)}>Điều chỉnh</button></td></tr>
        ))}</tbody>
      </table>
    </section>
  );
}
function tierName(p) {
  const t = [[300, 'Bậc thầy Lịch sử–Công nghệ'], [200, 'Chuyên gia thời gian'], [100, 'Nhà nghiên cứu trẻ'], [50, 'Người khám phá'], [30, 'Twin thời sử học']].find(([at]) => p >= at);
  return t ? t[1] : '—';
}

// ---------- 10. FEEDBACK ----------
function Feedback({ done }) {
  const [rows, setRows] = useState([]);
  const [busy, setBusy] = useState('');
  const load = () => supabase.from('feedback').select('*').order('created_at', { ascending: false }).limit(100)
    .then(({ data, error }) => { if (error) throw error; setRows(data || []); })
    .catch(e => setBusy('Bảng feedback cần migration 002: ' + e.message));
  useEffect(() => { load(); }, []);
  async function mark(id, status) {
    await supabase.from('feedback').update({ status }).eq('id', id); await done(); load();
  }
  return (
    <section>
      <h3 className="museum-h3">Góp ý từ người dùng</h3>
      {busy && <p className="fail">{busy}</p>}
      {rows.map(f => (
        <div key={f.id} className="fb-row page-panel">
          <b>{f.name || 'Ẩn danh'}</b> <small>{fmtDate(f.created_at)}</small>
          <p>{f.message}</p>
          <div className="row-gap">
            {['new', 'read', 'resolved'].map(s => <button key={s} className={f.status === s ? 'chip on' : 'chip'} onClick={() => mark(f.id, s)}>{{ new: 'Mới', read: 'Đã đọc', resolved: 'Đã xử lý' }[s]}</button>)}
          </div>
        </div>
      ))}
      {!rows.length && !busy && <p className="muted">Chưa có góp ý.</p>}
    </section>
  );
}

// ---------- 11. RESEARCH DASHBOARD ----------
function Research({ done: _done }) {
  const [rows, setRows] = useState([]);
  const [busy, setBusy] = useState('');
  const [form, setForm] = useState({ student_code: '', group_name: 'thuc_nghiem', user_id: '', consent: false, notes: '' });
  const load = () => supabase.from('research_sessions').select('*').order('created_at', { ascending: false })
    .then(({ data, error }) => { if (error) throw error; setRows(data || []); })
    .catch(e => setBusy('Bảng research_sessions cần migration 002: ' + e.message));
  useEffect(() => { load(); }, []);

  async function addSession(e) {
    e.preventDefault();
    if (!form.student_code.trim()) return setBusy('Mã học sinh bắt buộc (KHÔNG nhập tên thật).');
    const { error } = await supabase.from('research_sessions').insert({ ...form, user_id: form.user_id.trim() || null, consent: true });
    if (error) return setBusy('Lỗi: ' + error.message);
    setForm({ ...form, student_code: '', user_id: '', notes: '' }); setBusy('✔ Đã tạo phiên.'); load();
  }
  async function score(id, phase) {
    const v = prompt(`Điểm ${phase === 'pre' ? 'PRE' : 'POST'}-test (0–100):`); if (v == null || v === '') return;
    try { await safeRpc('record_research_score', { p_session: id, p_phase: phase, p_score: +v }); load(); }
    catch (e) { setBusy('✖ ' + e.message); }
  }

  const tn = rows.filter(r => r.group_name === 'thuc_nghiem');
  const dc = rows.filter(r => r.group_name === 'doi_chung');
  const paired = tn.filter(r => r.pre_score != null && r.post_score != null).map(r => [Number(r.pre_score), Number(r.post_score)]);
  const statsTN = { pre: basicStats(tn.map(r => r.pre_score)), post: basicStats(tn.map(r => r.post_score)) };
  const statsDC = { pre: basicStats(dc.map(r => r.pre_score)), post: basicStats(dc.map(r => r.post_score)) };
  const tTest = pairedTTest(paired);

  return (
    <section>
      <h3 className="museum-h3">Dashboard nghiên cứu KHKT (pre/post-test, nhóm thực nghiệm/đối chứng)</h3>
      <p className="muted small">Chỉ dùng MÃ HỌC SINH, không lưu tên thật; chỉ admin đọc được (RLS). Số liệu hiển thị là dữ liệu THẬT do bạn nhập/quiz ghi lại — chưa có dữ liệu thì không kết luận gì.</p>
      {busy && <p role="status">{busy}</p>}
      <form onSubmit={addSession} className="row-gap wrap page-panel">
        <input className="field" placeholder="Mã HS (vd SHS-012)" value={form.student_code} onChange={e => setForm({ ...form, student_code: e.target.value })} />
        <select className="field" value={form.group_name} onChange={e => setForm({ ...form, group_name: e.target.value })}><option value="thuc_nghiem">Thực nghiệm</option><option value="doi_chung">Đối chứng</option></select>
        <input className="field" placeholder="user_id (tùy chọn để auto pre/post)" value={form.user_id} onChange={e => setForm({ ...form, user_id: e.target.value })} />
        <input className="field grow" placeholder="Ghi chú" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
        <button className="btn-primary"><Plus size={15} /> Tạo phiên</button>
      </form>

      <div className="research-stats">
        <div className="page-panel"><b>Nhóm thực nghiệm (n={tn.length})</b>
          <p>Pre: {statsTN.pre.n} · TB {statsTN.pre.mean} ± {statsTN.pre.sd}</p>
          <p>Post: {statsTN.post.n} · TB {statsTN.post.mean} ± {statsTN.post.sd}</p></div>
        <div className="page-panel"><b>Nhóm đối chứng (n={dc.length})</b>
          <p>Pre: {statsDC.pre.n} · TB {statsDC.pre.mean} ± {statsDC.pre.sd}</p>
          <p>Post: {statsDC.post.n} · TB {statsDC.post.mean} ± {statsDC.post.sd}</p></div>
        <div className="page-panel"><b>Kiểm định ghép cặp (nhóm TN, pre↔post)</b>
          {tTest ? <p>t({tTest.df}) = {tTest.t.toFixed(2)}, p ≈ {tTest.p.toFixed(3)}, Cohen's d = {tTest.cohend.toFixed(2)}, n = {tTest.n}<br /><small>p tính bằng xấp xỉ chuẩn tắc — đủ cho báo cáo THPT, nên đối chiếu lại bằng phần mềm thống kê khi bảo vệ.</small></p>
            : <p className="muted">Chưa đủ cặp pre/post (cần ≥ 2 học sinh nhóm thực nghiệm có cả 2 điểm).</p>}
        </div>
      </div>
      {tn.length > 0 && (
        <div className="bar-chart">
          {tn.map(r => r.pre_score != null && r.post_score != null).filter(Boolean).length > 0 &&
            [...tn].filter(r => r.pre_score != null).slice(0, 20).map(r => (
              <div key={r.id} className="bar-pair" title={`${r.student_code}: pre ${r.pre_score} → post ${r.post_score ?? '—'}`}>
                <span className="bar pre" style={{ height: `${(r.pre_score || 0)}%` }} />
                <span className="bar post" style={{ height: `${(r.post_score || 0)}%` }} />
                <small>{r.student_code}</small>
              </div>
            ))}
        </div>
      )}
      <div className="row-gap">
        <button className="btn-ghost" onClick={() => downloadCSV('nghien-cuu-historlogz.csv', [
          ['student_code', 'group', 'phase', 'consent', 'pre_score', 'post_score', 'notes'],
          ...rows.map(r => [r.student_code, r.group_name, r.phase, r.consent ? 'Y' : 'N', r.pre_score ?? '', r.post_score ?? '', r.notes || '']),
        ])}><Download size={15} /> Xuất CSV kết quả nghiên cứu</button>
      </div>
      <table className="admin-table">
        <thead><tr><th>Mã HS</th><th>Nhóm</th><th>Pre</th><th>Post</th><th>Ghi chú</th><th></th></tr></thead>
        <tbody>{rows.map(r => (
          <tr key={r.id}><td><b>{r.student_code}</b></td><td>{r.group_name === 'thuc_nghiem' ? 'TN' : 'ĐC'}</td>
            <td>{r.pre_score ?? '—'}</td><td>{r.post_score ?? '—'}</td><td><small>{r.notes}</small></td>
            <td className="row-gap"><button onClick={() => score(r.id, 'pre')}>Pre</button><button onClick={() => score(r.id, 'post')}>Post</button></td></tr>
        ))}</tbody>
      </table>
    </section>
  );
}

// ---------- 12. AUDIT LOG ----------
function AuditLog() {
  const [rows, setRows] = useState([]);
  const [busy, setBusy] = useState('');
  useEffect(() => {
    supabase.from('admin_logs').select('*').order('created_at', { ascending: false }).limit(200)
      .then(({ data, error }) => { if (error) throw error; setRows(data || []); })
      .catch(e => setBusy('Bảng admin_logs cần migration 002: ' + e.message));
  }, []);
  return (
    <section>
      <h3 className="museum-h3">Nhật ký quản trị</h3>
      <p className="muted small">Mọi sửa/xóa nội dung, đổi vai trò, điều chỉnh điểm đều được ghi lại tự động.</p>
      {busy && <p className="fail">{busy}</p>}
      <table className="admin-table">
        <thead><tr><th>Thời gian</th><th>Hành động</th><th>Đối tượng</th><th>Chi tiết</th></tr></thead>
        <tbody>{rows.map(l => (<tr key={l.id}><td>{fmtDate(l.created_at)}</td><td>{l.action}</td><td><small>{l.target}</small></td><td><small>{l.detail}</small></td></tr>))}</tbody>
      </table>
    </section>
  );
}

// ---------- 13. BACKUP / RESTORE / VERSIONS ----------
function BackupScreen({ done }) {
  const [busy, setBusy] = useState('');
  const [revisions, setRevisions] = useState([]);
  async function exportAll() {
    try {
      const out = await safeRpc('cms_export');
      downloadJSON(`historlogz-backup-${new Date().toISOString().slice(0, 10)}.json`, out);
      setBusy('✔ Đã tải file backup JSON (toàn bộ content_items).');
    } catch (e) { setBusy('✖ ' + e.message + ' (cần migration 002).'); }
  }
  async function exportItems() {
    const all = [];
    for (const kind of ['events', 'characters', 'questions', 'maps', 'pages', 'announcements', 'media']) {
      try { all.push(...(await listItems(kind, true))); } catch { /* bỏ qua kind lỗi */ }
    }
    downloadCSV('cms-xuat-full.csv', [['kind', 'legacy_id', 'title', 'body', 'published', 'payload']].concat(
      all.map(r => [r.kind, r.legacy_id || '', r.title, (r.body || '').slice(0, 500), r.published ? 'Y' : 'N', JSON.stringify(r.payload || {})])
    ));
    downloadJSON(`cms-${new Date().toISOString().slice(0, 10)}.json`, { items: all });
  }
  async function importBackup(e) {
    const f = e.target.files?.[0]; if (!f) return;
    setBusy('Đang đọc backup…');
    try {
      const obj = JSON.parse(await f.text());
      const items = obj.items || obj;
      if (!Array.isArray(items)) throw Error('File không đúng định dạng cms_export');
      let ok = 0, fail = 0;
      for (const it of items) {
        try { const { id: _id, created_at: _c, updated_at: _u, ...rest } = it; await upsertItem(rest); ok++; } catch { fail++; }
      }
      setBusy(`Khôi phục: ${ok} mục · ${fail} lỗi. Lưu ý: import ghi đè theo legacy_id.`);
      await done();
    } catch (err) { setBusy('✖ ' + err.message); }
    e.target.value = '';
  }
  async function listRevisions() {
    const { data, error } = await supabase.from('content_revisions')
      .select('id,item_id,saved_at,kind:snapshot->>kind,title:snapshot->>title')
      .order('saved_at', { ascending: false }).limit(60);
    if (error) return setBusy('Bảng content_revisions cần migration 002: ' + error.message);
    setRevisions(data || []);
  }
  async function restore(revId) {
    const { data } = await supabase.from('content_revisions').select('snapshot').eq('id', revId).maybeSingle();
    if (!data?.snapshot) return;
    const s = data.snapshot;
    if (!confirm(`Khôi phục “${s.title}” (${s.kind}) về phiên bản đã lưu?`)) return;
    try {
      const { id: _id, created_at: _c, updated_at: _u, ...rest } = s;
      await upsertItem(rest); await done();
      setBusy('✔ Đã khôi phục phiên bản cũ.');
    } catch (e) { setBusy('✖ ' + e.message); }
  }
  return (
    <section>
      <h3 className="museum-h3">Sao lưu & khôi phục</h3>
      <div className="row-gap wrap">
        <button className="btn-primary" onClick={exportAll}><Download size={15} /> Export toàn bộ CMS (JSON)</button>
        <button className="btn-ghost" onClick={exportItems}>Export nhanh CSV+JSON</button>
        <label className="btn-ghost file-btn"><Upload size={15} /> Khôi phục từ file backup<input type="file" accept=".json" onChange={importBackup} hidden /></label>
        <button className="btn-ghost" onClick={listRevisions}>Xem phiên bản đã lưu</button>
      </div>
      {busy && <p role="status">{busy}</p>}
      {revisions.length > 0 && (
        <table className="admin-table">
          <thead><tr><th>Loại</th><th>Tiêu đề</th><th>Lúc</th><th></th></tr></thead>
          <tbody>{revisions.map(r => (
            <tr key={r.id}><td>{r.kind}</td><td>{r.title}</td><td>{fmtDate(r.snapshot_at)}</td>
              <td><button onClick={() => restore(r.id)}>Khôi phục bản này</button></td></tr>
          ))}</tbody>
        </table>
      )}
      <p className="muted small">Mỗi lần Admin sửa một nội dung, hệ thống tự lưu tối đa 20 phiên bản gần nhất (trigger snapshot_content) — khôi phục khi sửa nhầm không cần code.</p>
    </section>
  );
}
