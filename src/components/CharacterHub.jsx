import { useMemo, useState, useEffect } from 'react';
import { Lock, Unlock, BookOpen, BrainCircuit, X, Timer, ChevronLeft, ChevronRight, Trophy } from 'lucide-react';
import { useData } from '../store';
import { useAuth } from '../auth';
import { startQuiz, submitQuiz } from '../cms';
import { RARITY, searchIn, tierFor } from '../utils';
import { wikiData } from '../wikiData';

// ============ THẺ NHÂN VẬT + THỬ THÁCH MỞ KHÓA (server-side) ============
export default function CharacterHub({ go, focus }) {
  const { characters, eventByKey, unlocks, points, refresh } = useData();
  const { user } = useAuth();
  const [region, setRegion] = useState('vietnam');
  const [q, setQ] = useState('');
  const [rarityF, setRarityF] = useState('all');
  const [openChar, setOpenChar] = useState(null);

  useEffect(() => { if (focus) { const c = characters.find(x => x.key === focus); if (c) { setRegion(c.region); setOpenChar(c.key); } } }, [focus, characters]);

  const list = useMemo(() => characters
    .filter(c => searchIn(q, c.name, c.role, c.era, c.biography))
    .filter(c => rarityF === 'all' || (c.rarity || 'basic') === rarityF), [characters, q, rarityF]);
  const side = list.filter(c => c.region === region);
  const byKey = k => characters.find(c => c.key === k);

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <h2 className="museum-h2">Thẻ nhân vật</h2>
          <p className="muted">{user ? `Điểm tích lũy: ${points ?? 0} · Huy hiệu: ${tierFor(points || 0)?.name || 'chưa đạt mốc 30'}` : 'Đăng nhập để mở khóa thẻ và lưu bộ sưu tập.'}</p>
        </div>
        <div className="chip-row">
          <button className={region === 'vietnam' ? 'chip on' : 'chip'} onClick={() => setRegion('vietnam')}>Nhân vật Việt Nam</button>
          <button className={region !== 'vietnam' ? 'chip on' : 'chip'} onClick={() => setRegion('world')}>Nhân vật Thế giới</button>
        </div>
      </header>

      <div className="filter-bar">
        <div className="search-box"><BookOpen size={16} /><input placeholder="Tìm nhân vật…" value={q} onChange={e => setQ(e.target.value)} /></div>
        <div className="chip-row">{['all', ...Object.keys(RARITY)].map(r => <button key={r} className={rarityF === r ? 'chip on' : 'chip'} onClick={() => setRarityF(r)}>{r === 'all' ? 'Mọi cấp' : RARITY[r].label}</button>)}</div>
      </div>

      <div className="card-grid">
        {side.map(c => <CharCard key={c.key} char={c} unlocked={user && unlocks.some(u => u.character_id === (c.cmsId || c.id))} onOpen={() => setOpenChar(c.key)} />)}
        {!side.length && <p className="muted pad">Chưa có nhân vật khớp bộ lọc. Admin có thể thêm trong Character Studio.</p>}
      </div>

      {openChar && byKey(openChar) && (
        <CharModal char={byKey(openChar)} eventByKey={eventByKey}
          unlocked={user && unlocks.some(u => u.character_id === (byKey(openChar).cmsId || byKey(openChar).id))}
          user={user} onClose={() => setOpenChar(null)} go={go} refresh={refresh} />
      )}
    </div>
  );
}

function CharCard({ char, unlocked, onOpen }) {
  const r = RARITY[char.rarity] || RARITY.basic;
  return (
    <button className={`char-card rarity-${char.rarity || 'basic'} ${unlocked ? 'unlocked' : 'locked-card'}`} onClick={onOpen}>
      <div className="cc-frame" style={{ '--ring': r.ring, '--glow': r.glow }}>
        {char.imageUrl ? <img src={char.imageUrl} alt={char.name} /> : <span className="cc-ph">Chưa có chân dung</span>}
        {!unlocked && <span className="cc-lock"><Lock size={22} /></span>}
        <span className="cc-rarity" style={{ color: r.ring }}>{r.label}{unlocked ? ' · Đã mở' : ''}</span>
        <div className="cc-info"><b>{char.name}</b><small>{char.role}</small></div>
      </div>
    </button>
  );
}

function CharModal({ char, eventByKey, unlocked, user, onClose, go, refresh }) {
  const [tab, setTab] = useState('biography');
  const [challenge, setChallenge] = useState(null); // {examId, questions, answers, submitted, result, deadline}
  const r = RARITY[char.rarity] || RARITY.basic;
  const needCount = char.unlockCount ?? r.count;
  const needMin = char.unlockMinutes ?? r.minutes;
  const deep = char.wikiId ? wikiData[char.wikiId] : null;
  const wikiTitle = char.wikiTitle || deep?.title || char.name;
  const wikiContent = char.wikiContent || deep?.content || '';

  async function beginChallenge() {
    if (!user) return;
    setChallenge({ loading: true });
    try {
      const res = await startQuiz({ mode: 'unlock', character: char.cmsId || char.id || char.key, minutes: needMin, count: needCount, characterData: char });
      if (res.alreadyUnlocked) { setChallenge({ alreadyUnlocked: true }); return; }
      setChallenge({ examId: res.examId, questions: res.questions || [], answers: {}, submitted: false, deadline: res.deadline || null, secs: null });
    } catch (e) {
      setChallenge({ startError: e.message || 'Không bắt đầu được thử thách.' });
    }
  }
  useEffect(() => {
    if (!challenge?.deadline || challenge.submitted) return;
    const t = setInterval(() => {
      const left = Math.max(0, Math.round((new Date(challenge.deadline) - Date.now()) / 1000));
      setChallenge(c => c && { ...c, secs: left });
      if (left <= 0 && !challenge.submitted) finish();
    }, 1000);
    return () => clearInterval(t);
  }, [challenge?.examId, challenge?.submitted]);

  async function finish() {
    const res = await submitQuiz(challenge.examId, challenge.answers);
    setChallenge(c => ({ ...c, submitted: true, result: res }));
    if (res?.unlocked && refresh) {
      try { refresh(); } catch(e) {}
    }
  }

  return (
    <div className="modal-back" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <button className="modal-x" onClick={onClose}><X size={18} /></button>
        <div className="cm-head" style={{ '--ring': r.ring }}>
          {char.imageUrl && <img className="cm-img" src={char.imageUrl} alt={char.name} />}
          <div><h3>{char.name}</h3><p className="muted">{char.role} · {char.era}</p>
            <span className="cm-rarity" style={{ color: r.ring, borderColor: r.ring }}>{r.label} {unlocked && '· ĐÃ MỞ KHÓA'}</span>
            {!user && <p className="muted small">Đăng nhập để tham gia thử thách mở khóa.</p>}
          </div>
        </div>

        <div className="tabbar">
          {[['biography', 'Tiểu sử'], ['wiki', 'Mặt sau SGK'], ['events', 'Sự kiện liên quan'], ['challenge', 'Thử thách mở khóa']].map(([k, l]) =>
            <button key={k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>{l}</button>)}
        </div>

        {tab === 'biography' && (
          <div className="tab-body">
            {char.quote && <p className="quote">“{char.quote}”</p>}
            {(char.biography || wikiContent) && <p>{char.biography || wikiContent}</p>}
            {char.motivation && <p><b>Lý tưởng:</b> {char.motivation}</p>}
            {char.modernLink && <p><b>Liên hệ hôm nay:</b> {char.modernLink}</p>}
            {char.stats && <div className="stats-row">{Object.entries(char.stats).map(([k, v]) => <div key={k}><small>{k.toUpperCase()}</small><b>{v}</b></div>)}</div>}
            {char.ref && <p className="source">Nguồn: {char.ref}. {char.imageUrl ? 'Hình chân dung là tranh minh họa/phục dựng, không phải ảnh tư liệu gốc.' : ''}</p>}
          </div>
        )}
        {tab === 'wiki' && <div className="tab-body"><h4>{wikiTitle}</h4><p className="pre-wrap">{wikiContent}</p></div>}
        {tab === 'events' && <div className="tab-body">
          {(char.relatedEvents || []).length === 0 && <p className="muted">Chưa có sự kiện liên kết. Admin gán trong Character Studio.</p>}
          {(char.relatedEvents || []).map((k, i) => {
            const ev = typeof k === 'string' ? eventByKey(k) : null;
            return ev ? <button key={i} className="link-chip wide" onClick={() => go('timeline', { focus: ev.key })}>📜 {ev.title}</button> : <span key={i} className="muted small">Liên kết: {k}</span>;
          })}
        </div>}
        {tab === 'challenge' && <div className="tab-body">
          {!unlocked ? (
            <>
              <p className="challenge-desc"><BrainCircuit size={15} /> Trả lời đúng <b>toàn bộ {needCount} câu</b>
                {needMin ? <> trong <b>{needMin} phút</b></> : null} để mở khóa thẻ {r.label}.
                Câu hỏi lấy từ ngân hàng đã kiểm duyệt. <b>Đáp án chỉ hiện sau khi nộp bài.</b>
                Thử thách thành công cộng {char.points ?? r.points} điểm.</p>
              {char.source === 'legacy' && !char.cmsId && <p className="fail">Thẻ này chưa được đồng bộ vào cơ sở dữ liệu, nên thử thách mở khóa chưa chạy. Admin hãy bấm “Đồng bộ dữ liệu cũ (Import)” trong trang Quản trị một lần.</p>}
              {!challenge && <button className="btn-primary" disabled={!user} onClick={beginChallenge}>{user ? <><Unlock size={15} /> Bắt đầu thử thách</> : 'Đăng nhập để mở khóa'}</button>}
              {challenge?.loading && <p className="muted">Đang tạo đề…</p>}
              {challenge?.alreadyUnlocked && <p>Thẻ này đã được mở khóa trong tài khoản của bạn.</p>}
              {challenge?.startError && <p className="fail">{challenge.startError} <a onClick={() => setChallenge(null)}>Đóng</a></p>}
              {challenge?.questions?.length && !challenge.submitted && <ChallengeQuiz challenge={challenge} setChallenge={setChallenge} onFinish={finish} />}
              {challenge?.result && (challenge.result.unlocked ? (
                <p className="success"><Trophy size={16} /> Chúc mừng! Thẻ đã mở khóa (+{challenge.result.pointsGained} điểm). <a onClick={onClose}>Xem bộ sưu tập</a></p>
              ) : (
                <p className="fail">Chưa đủ điều kiện mở khóa (đúng {challenge.result.correct}/{challenge.result.total} — cần đúng toàn bộ). Kết quả & giải thích bên dưới. <a onClick={() => setChallenge(null)}>Thử lại</a></p>
              ))}
              {challenge?.result && <Review feedback={challenge.result.feedback} />}
            </>
          ) : (
            <div className="tab-body"><p className="success">✓ Thẻ này đã nằm trong bộ sưu tập của bạn.</p>
              <button className="btn-ghost" onClick={() => go('quiz', { topic: char.region })}>Luyện Quiz chủ đề liên quan →</button></div>
          )}
        </div>}
      </div>
    </div>
  );
}

function ChallengeQuiz({ challenge, setChallenge, onFinish }) {
  const { questions, answers } = challenge;
  const [idx, setIdx] = useState(0);
  const q = questions[idx];
  const unanswered = questions.filter(x => !answers[x.id]).length;
  const mins = challenge.secs != null ? `${Math.floor(challenge.secs / 60)}:${String(challenge.secs % 60).padStart(2, '0')}` : null;
  return (
    <div className="quiz-run">
      <div className="quiz-head">
        <span className="progress-bar"><span style={{ width: `${((idx + 1) / questions.length) * 100}%` }} /></span>
        <small>Câu {idx + 1}/{questions.length} · còn {unanswered} chưa trả lời</small>
        {mins && <span className="timer"><Timer size={14} /> {mins}</span>}
      </div>
      <h4>{q.question}</h4>
      <div className="opt-grid">
        {q.options.map((opt, i) => (
          <button key={i} className={answers[q.id] === opt ? 'on' : ''} onClick={() => setChallenge(c => ({ ...c, answers: { ...c.answers, [q.id]: opt } }))}>{opt}</button>
        ))}
      </div>
      <div className="quiz-foot">
        <button className="btn-ghost" disabled={idx === 0} onClick={() => setIdx(i => i - 1)}><ChevronLeft size={15} /> Câu trước</button>
        {idx < questions.length - 1
          ? <button className="btn-ghost" onClick={() => setIdx(i => i + 1)}>Câu sau <ChevronRight size={15} /></button>
          : <button className="btn-primary" onClick={onFinish}>Nộp bài</button>}
      </div>
    </div>
  );
}

function Review({ feedback }) {
  const list = Array.isArray(feedback) ? feedback : [];
  if (!list.length) return null;
  return <div className="review">{list.map((f, i) => (
    <div key={i} className={f.correct ? 'rv ok' : 'rv bad'}>
      <b>{f.question}</b>
      <p>Đáp án đúng: {f.answer}</p>
      {f.explanation && <p className="muted">{f.explanation}</p>}
    </div>
  ))}</div>;
}
