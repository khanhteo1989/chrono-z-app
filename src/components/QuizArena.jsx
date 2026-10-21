import { useMemo, useState, useEffect, useRef } from 'react';
import { BrainCircuit, Timer, ChevronLeft, ChevronRight, Trophy, History, AlertTriangle } from 'lucide-react';
import { useData } from '../store';
import { useAuth } from '../auth';
import { startQuiz, submitQuiz, myHistory } from '../cms';
import { PERIODS, fmtDate, shuffle } from '../utils';

// ============ CHRONO-QUIZ: chấm điểm trên SERVER (RPC start_quiz/submit_quiz) ============
// - Quiz chủ đề: 15 câu. Quiz tổng hợp: 20 câu / 15 phút, tự động nộp khi hết giờ.
// - Câu hỏi và phương án được trộn phía server; client KHÔNG nhận đáp án trước khi nộp.
// - Fallback: nếu ngân hàng trên DB chưa sẵn sàng, cho luyện tập tại chỗ (ghi rõ
//   "không cộng điểm") để học sinh không bị chặn — điểm chính thức chỉ do server cấp.

const MODE_LABEL = { topic: 'Chủ đề', general: 'Tổng hợp', unlock: 'Thử thách thẻ', pretest: 'Pre-test', posttest: 'Post-test' };

export default function QuizArena({ go, focus }) {
  const { questions } = useData();
  const { user } = useAuth();
  const [mode, setMode] = useState('topic');       // topic | general
  const [topic, setTopic] = useState(focus?.topic || 'all');
  const [era, setEra] = useState(focus?.era || 'all');
  const [run, setRun] = useState(null);            // {examId,questions,deadline,offline}
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [err, setErr] = useState('');

  useEffect(() => { if (user) myHistory().then(setHistory).catch(() => setHistory([])); }, [user]);

  const pool = useMemo(() => questions.filter(q =>
    (topic === 'all' || q.region === topic || q.region === 'all') &&
    (era === 'all' || q.period === era || q.period === 'all')), [questions, topic, era]);

  async function begin() {
    setErr('');
    const count = mode === 'general' ? 20 : 15;
    const minutes = mode === 'general' ? 15 : null;
    const p_topic = mode === 'general' ? 'all' : (era !== 'all' ? era : (topic === 'all' ? null : topic));
    try {
      const res = await startQuiz({ mode, topic: p_topic, count, minutes });
      if (!res.questions?.length) throw Error('empty');
      setRun({ examId: res.examId, questions: res.questions, deadline: res.deadline || null, offline: false });
    } catch (e) {
      const msg = String(e.message || '');
      if (/chưa có dữ liệu|empty|not found|does not exist|relation|schema cache|PGRST|API|fetch/i.test(msg)) {
        const qs = shuffle(questions).slice(0, count)
          .map(q => ({ id: q.key, question: q.question, options: shuffle(q.options || []), _src: q }));
        if (!qs.length) { setErr('Ngân hàng câu hỏi đang được cập nhật, bạn thử lại sau ít phút.'); return; }
        setRun({ examId: null, questions: qs, deadline: minutes ? new Date(Date.now() + minutes * 60000).toISOString() : null, offline: true });
      } else {
        setErr(msg || 'Không tạo được đề thi. Bạn thử lại nhé.');
      }
    }
  }

  function onFinish(res) { setResult(res); setRun(null); myHistory().then(setHistory).catch(() => {}); }

  if (!user) return (
    <div className="page">
      <div className="center-pad page-panel">
        <BrainCircuit size={34} />
        <h2 className="museum-h2">Chrono-Quiz</h2>
        <p className="muted">Bạn cần đăng nhập để làm Quiz và được cộng điểm công bằng: server chấm điểm, không thể tự khai điểm.</p>
        <button className="btn-primary" onClick={() => go('account')}>Đăng nhập / Tạo tài khoản</button>
      </div>
    </div>
  );

  if (run) return <QuizRunner run={run} onFinish={onFinish} />;

  if (result) return <ResultScreen result={result} onAgain={() => setResult(null)} />;

  // ================= MENU =================
  return (
    <div className="page">
      <header className="page-head">
        <div>
          <h2 className="museum-h2">Chrono-Quiz</h2>
          <p className="muted">Server chấm điểm minh bạch · mỗi câu đúng +5 điểm (trần 150 điểm/ngày) · lịch sử làm bài lưu trên tài khoản.</p>
        </div>
      </header>

      <div className="quiz-modes">
        <button className={mode === 'topic' ? 'mode-card on' : 'mode-card'} onClick={() => setMode('topic')}>
          <b>Quiz chủ đề · 15 câu</b><small>Chọn Việt Nam / Thế giới hoặc một thời kỳ cụ thể</small>
        </button>
        <button className={mode === 'general' ? 'mode-card on' : 'mode-card'} onClick={() => setMode('general')}>
          <b>Quiz tổng hợp · 20 câu</b><small>15 phút, tự động nộp khi hết giờ — như một đề thi thử</small>
        </button>
      </div>

      {mode === 'topic' && (
        <div className="filter-bar">
          <div className="chip-row">
            {[['all', 'Mọi chủ đề'], ['vietnam', 'Việt Nam'], ['world', 'Thế giới']].map(([k, l]) =>
              <button key={k} className={topic === k ? 'chip on' : 'chip'} onClick={() => setTopic(k)}>{l}</button>)}
            {PERIODS.map(p => <button key={p} className={era === p ? 'chip on' : 'chip'} onClick={() => setEra(era === p ? 'all' : p)}>{p}</button>)}
          </div>
          <p className="muted small">{pool.length} câu phù hợp bộ lọc (tính cả kho dự liệu).</p>
        </div>
      )}

      {err && <p className="fail">{err}</p>}
      <button className="btn-primary big" onClick={begin}>
        <BrainCircuit size={17} /> {mode === 'general' ? 'Bắt đầu Quiz tổng hợp (20 câu · 15 phút)' : 'Bắt đầu Quiz chủ đề (15 câu)'}
      </button>

      <section className="home-block">
        <h3 className="museum-h3"><History size={16} /> Lịch sử làm bài</h3>
        {!history.length && <p className="muted">Chưa có lần làm bài nào được lưu.</p>}
        {history.length > 0 && (
          <table className="mini-table">
            <thead><tr><th>Thời gian</th><th>Chế độ</th><th>Điểm</th></tr></thead>
            <tbody>{history.map(h => (
              <tr key={h.id}><td>{fmtDate(h.submitted_at)}</td><td>{MODE_LABEL[h.mode] || h.mode}</td><td><b>{h.score}/{h.total}</b></td></tr>
            ))}</tbody>
          </table>
        )}
      </section>
    </div>
  );
}

// ================= LÀM BÀI =================
function QuizRunner({ run, onFinish }) {
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [secs, setSecs] = useState(null);
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const submitted = useRef(false);
  const q = run.questions[idx];
  const unanswered = run.questions.filter(x => !answers[x.id]).length;

  async function finish(auto = false) {
    if (submitted.current || busy) return;
    submitted.current = true; setBusy(true);
    if (run.offline) {
      const fb = run.questions.map(x => {
        const given = answers[x.id];
        const correct = !!given && given === x._src.answer;
        return { id: x.id, question: x.question, answered: given || null, correct, answer: x._src.answer, explanation: x._src.explanation || '' };
      });
      const score = fb.filter(f => f.correct).length;
      onFinish({ score, total: fb.length, correct: score, pointsGained: 0, late: auto, feedback: fb, offline: true });
      return;
    }
    try {
      const res = await submitQuiz(run.examId, answers);
      onFinish({ ...res, late: res.late || auto, offline: false });
    } catch (e) {
      submitted.current = false; setBusy(false);
      onFinish({ error: e.message || 'Nộp bài thất bại, bạn thử lại.' });
    }
  }

  useEffect(() => {
    if (!run.deadline) return;
    const t = setInterval(() => {
      const left = Math.max(0, Math.round((new Date(run.deadline) - Date.now()) / 1000));
      setSecs(left);
      if (left <= 0) finish(true);
    }, 500);
    return () => clearInterval(t);
  }, [run.deadline]);

  const mins = secs != null ? `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}` : null;

  return (
    <div className="page">
      <header className="page-head">
        <h2 className="museum-h2">{run.offline ? 'Luyện tập (không cộng điểm)' : 'Chrono-Quiz'}</h2>
        {run.offline && <span className="warn-badge"><AlertTriangle size={13} /> Server chưa sẵn sàng — đáp án & giải thích hiện sau khi nộp, không cộng điểm.</span>}
      </header>
      <div className="quiz-run">
        <div className="quiz-head">
          <span className="progress-bar"><span style={{ width: `${((idx + 1) / run.questions.length) * 100}%` }} /></span>
          <small>Câu {idx + 1}/{run.questions.length} · còn {unanswered} câu chưa trả lời</small>
          {mins != null && <span className={`timer ${secs < 60 ? 'danger' : ''}`}><Timer size={14} /> {mins}{secs < 60 ? ' · sắp hết giờ!' : ''}</span>}
        </div>
        <h4>{q.question}</h4>
        <div className="opt-grid">
          {q.options.map((opt, i) => (
            <button key={i} className={answers[q.id] === opt ? 'on' : ''}
              onClick={() => setAnswers(a => ({ ...a, [q.id]: opt }))}>{opt}</button>
          ))}
        </div>
        <div className="quiz-foot">
          <button className="btn-ghost" disabled={idx === 0} onClick={() => setIdx(i => i - 1)}><ChevronLeft size={15} /> Câu trước</button>
          <div className="quiz-foot-right">
            {idx < run.questions.length - 1 && <button className="btn-ghost" onClick={() => setIdx(i => i + 1)}>Câu sau <ChevronRight size={15} /></button>}
            <button className="btn-primary" disabled={busy} onClick={() => (unanswered ? setConfirming(true) : finish())}>
              {busy ? 'Đang nộp…' : unanswered ? `Nộp bài (${unanswered} câu trống)` : 'Nộp bài'}
            </button>
          </div>
        </div>
      </div>
      {confirming && (
        <div className="modal-back" onClick={() => setConfirming(false)}>
          <div className="modal small-modal" onClick={e => e.stopPropagation()}>
            <AlertTriangle size={22} />
            <p>Bạn còn <b>{unanswered} câu chưa trả lời</b>. Nộp bài bây giờ?</p>
            <div className="row-gap">
              <button className="btn-ghost" onClick={() => setConfirming(false)}>Tiếp tục làm</button>
              <button className="btn-primary" onClick={() => { setConfirming(false); finish(); }}>Vẫn nộp</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ================= KẾT QUẢ =================
function ResultScreen({ result, onAgain }) {
  if (result.error) return (
    <div className="page"><h2 className="museum-h2">Lỗi nộp bài</h2><p className="fail">{result.error}</p>
      <button className="btn-primary" onClick={onAgain}>Quay lại</button></div>
  );
  const pct = result.total ? Math.round((result.score / result.total) * 100) : 0;
  return (
    <div className="page">
      <h2 className="museum-h2">Kết quả bài làm</h2>
      <div className="result-band page-panel">
        <div className="score-big"><Trophy size={26} /> {result.score}/{result.total} <small>({pct}%)</small></div>
        {!result.offline
          ? <p>Điểm được server chấm và cộng trực tiếp: +{result.pointsGained} điểm tích lũy{result.late ? ' (quá thời gian cho phép — phần trả lời vẫn được chấm)' : ''}.</p>
          : <p className="warn-badge"><AlertTriangle size={13} /> Chế độ luyện tập: không cộng điểm vào tài khoản.</p>}
        <button className="btn-primary" onClick={onAgain}>Làm bài khác</button>
      </div>
      <div className="review">
        {(Array.isArray(result.feedback) ? result.feedback : []).map((f, i) => (
          <div key={i} className={f.correct ? 'rv ok' : 'rv bad'}>
            <b>{i + 1}. {f.question}</b>
            <p>Bạn chọn: {f.answered || <i>không trả lời</i>} · Đáp án đúng: <b>{f.answer}</b></p>
            {f.explanation && <p className="muted">Giải thích: {f.explanation}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
