import { useEffect, useState } from 'react';
import { LogOut, User, Trophy, Medal, Lock, Mail, Clock } from 'lucide-react';
import { supabase } from '../supabase';
import { useAuth } from '../auth';
import { useData } from '../store';
import { myHistory } from '../cms';
import { POINT_TIERS, tierFor, fmtDate, RARITY } from '../utils';

// ============ TÀI KHOẢN: đăng nhập + tiến độ học tập (điểm/badge/unlock/history) ============
// Luồng đăng ký học sinh: email + mật khẩu -> Supabase gửi MÃ OTP 6 SỐ về mail -> nhập mã để xác nhận.
// (Cần bật Authentication → Providers → Email → "Confirm email" trong Supabase.)
// Admin KHÔNG đăng ký qua đây: admin tạo trong Supabase Dashboard (Users → Add user) rồi chạy 1 câu SQL gán role — xem docs §4.
export default function Account({ go }) {
  const { user, isAdmin, signOut } = useAuth();
  const { points, unlocks, characters, refresh } = useData();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [register, setRegister] = useState(false);
  const [phase, setPhase] = useState('form'); // form | otp
  const [otp, setOtp] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [history, setHistory] = useState([]);

  useEffect(() => { if (user) myHistory().then(setHistory).catch(() => setHistory([])); }, [user, points]);

  async function submit(e) {
    e.preventDefault(); setBusy(true); setMessage('');
    try {
      if (register && phase === 'form') {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        if (data.session) { setMessage(''); await refresh(); } // auto-confirm đang TẮT -> vào thẳng
        else setPhase('otp'); // đã gửi mã OTP 6 số về email
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        setMessage('');
        await refresh();
      }
    } catch (err) {
      setMessage(err.message || 'Không thực hiện được, thử lại nhé.');
    } finally { setBusy(false); }
  }

  async function confirmOtp(e) {
    e?.preventDefault();
    if (otp.length !== 6) { setMessage('Mã gồm 6 chữ số trong email.'); return; }
    setBusy(true); setMessage('');
    try {
      const { error } = await supabase.auth.verifyOtp({ email, token: otp, type: 'signup' });
      if (error) throw error;
      setMessage('Xác nhận thành công — tài khoản đã sẵn sàng!');
      setPhase('form'); setRegister(false); setOtp('');
      await refresh();
    } catch (err) {
      setMessage(/expired/i.test(err.message || '') ? 'Mã đã hết hạn — bấm "Gửi lại mã".' : (err.message || 'Mã không đúng, kiểm tra lại email.'));
    } finally { setBusy(false); }
  }

  async function resendOtp() {
    setBusy(true); setMessage('');
    const { error } = await supabase.auth.resend({ type: 'signup', email });
    setMessage(error ? error.message : 'Đã gửi lại mã OTP (kiểm tra cả thư mục spam).');
    setBusy(false);
  }

  if (!user && phase === 'otp') return (
    <div className="page">
      <div className="auth-card page-panel">
        <Mail size={28} />
        <h2 className="museum-h2">Nhập mã OTP</h2>
        <p className="muted">Mã <b>6 chữ số</b> đã gửi tới <b>{email}</b>. Nhập mã để kích hoạt tài khoản.</p>
        <form onSubmit={confirmOtp}>
          <input className="field otp-field" inputMode="numeric" pattern="[0-9]*" maxLength={6} placeholder="••••••" value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, ''))} autoFocus />
          <div className="auth-row">
            <button className="btn-primary" disabled={busy}>{busy ? '…' : 'Xác nhận mã'}</button>
            <button type="button" className="link-btn" onClick={resendOtp} disabled={busy}>Gửi lại mã</button>
            <button type="button" className="link-btn" onClick={() => { setPhase('form'); setMessage(''); }}>← Về đăng nhập</button>
          </div>
        </form>
        {message && <p role="status" className="auth-msg">{message}</p>}
      </div>
    </div>
  );

  async function sendReset() {
    if (!email) { setMessage('Nhập email trước rồi bấm Quên mật khẩu.'); return; }
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin });
    setMessage(error ? error.message : 'Nếu email tồn tại, link đặt lại mật khẩu đã được gửi (kiểm tra hộp thư).');
  }

  if (!user) return (
    <div className="page">
      <div className="auth-card page-panel">
        <User size={28} />
        <h2 className="museum-h2">{register ? 'Tạo tài khoản học sinh' : 'Đăng nhập'}</h2>
        <p className="muted">Tài khoản lưu điểm tích lũy, bộ sưu tập thẻ đã mở khóa và lịch sử Quiz trên máy chủ — đăng nhập ở thiết bị khác vẫn giữ nguyên tiến độ.
          {register ? ' Bấm nút xong, mã OTP 6 số sẽ được gửi về email của bạn.' : ''}</p>
        <form onSubmit={submit}>
          <input className="field" type="email" required autoComplete="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
          <input className="field" type="password" required minLength={6} autoComplete={register ? 'new-password' : 'current-password'} placeholder="Mật khẩu (≥ 6 ký tự)" value={password} onChange={e => setPassword(e.target.value)} />
          <div className="auth-row">
            <button className="btn-primary" disabled={busy}>{busy ? '…' : register ? 'Gửi mã OTP' : 'Đăng nhập'}</button>
            <button type="button" className="link-btn" onClick={() => { setRegister(!register); setMessage(''); }}>{register ? 'Đã có tài khoản? Đăng nhập' : 'Chưa có tài khoản? Đăng ký'}</button>
            {!register && <button type="button" className="link-btn" onClick={sendReset}>Quên mật khẩu</button>}
          </div>
        </form>
        {message && <p role="status" className="auth-msg">{message}</p>}
      </div>
    </div>
  );

  const tier = tierFor(points || 0);
  const nextTier = POINT_TIERS.find(t => (points || 0) < t.at);
  const unlockedChars = characters.filter(c => unlocks.some(u => u.character_id === (c.cmsId || c.id)));

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <h2 className="museum-h2">Tài khoản của bạn</h2>
          <p className="muted"><Mail size={13} /> {user.email} · Quyền: {isAdmin ? 'Quản trị viên' : 'Học sinh / người dùng'}</p>
        </div>
        <div className="head-actions">
          {isAdmin && <button className="btn-ghost" onClick={() => go('admin')}><Medal size={15} /> Vào trang Quản trị</button>}
          <button className="btn-ghost" onClick={signOut}><LogOut size={15} /> Đăng xuất</button>
        </div>
      </header>

      <div className="acct-grid">
        <section className="page-panel acct-points">
          <Trophy size={22} />
          <div className="big-num">{points ?? 0}</div>
          <p>điểm tích lũy — server cộng, không tự sửa được</p>
          {tier ? <span className="badge-tier">{tier.name}</span> : <span className="muted">Chưa đạt mốc huy hiệu đầu tiên (30 điểm)</span>}
          {nextTier && <p className="muted small">Cần thêm {nextTier.at - (points || 0)} điểm để đạt “{nextTier.name}”.</p>}
          <div className="tier-track">
            {POINT_TIERS.map(t => <span key={t.at} className={(points || 0) >= t.at ? 'done' : ''} title={t.name}>{t.at}</span>)}
          </div>
        </section>

        <section className="page-panel">
          <h3 className="museum-h3"><Lock size={16} /> Bộ sưu tập thẻ đã mở khóa ({unlockedChars.length}/{characters.length})</h3>
          {!unlockedChars.length && <p className="muted">Chưa mở khóa thẻ nào. Vào Thẻ nhân vật, vượt thử thách câu hỏi để mở khóa Basic → Rare → Epic → Legend.</p>}
          <div className="unlock-chips">
            {unlockedChars.map(c => (
              <button key={c.key} className="unlock-chip" onClick={() => go('characters', { focus: c.key })}
                style={{ borderColor: (RARITY[c.rarity] || RARITY.basic).ring }}>
                {(RARITY[c.rarity] || RARITY.basic).label} · {c.name}
              </button>
            ))}
          </div>
          <button className="btn-ghost" onClick={() => go('characters')}>Khám phá thẻ nhân vật →</button>
        </section>

        <section className="page-panel">
          <h3 className="museum-h3"><Clock size={16} /> Lịch sử làm bài</h3>
          {!history.length && <p className="muted">Chưa có bài Quiz nào.</p>}
          {history.length > 0 && (
            <table className="mini-table">
              <thead><tr><th>Thời gian</th><th>Chế độ</th><th>Điểm</th></tr></thead>
              <tbody>{history.slice(0, 12).map(h => (
                <tr key={h.id}><td>{fmtDate(h.submitted_at)}</td><td>{MODE_LABEL[h.mode] || h.mode}</td><td><b>{h.score}/{h.total}</b></td></tr>
              ))}</tbody>
            </table>
          )}
          <button className="btn-ghost" onClick={() => go('quiz')}>Làm Quiz ngay →</button>
        </section>
      </div>
    </div>
  );
}

const MODE_LABEL = { topic: 'Chủ đề', general: 'Tổng hợp', unlock: 'Thử thách thẻ', pretest: 'Pre-test', posttest: 'Post-test' };
