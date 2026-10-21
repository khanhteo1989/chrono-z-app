import { useEffect, useState } from 'react';
import { Clock, Users, BrainCircuit, Map, Send, Megaphone, ChevronRight, BookOpen } from 'lucide-react';
import { useData } from '../store';
import { supabase } from '../supabase';
import { useAuth } from '../auth';

// ============ TRANG CHỦ HISTORLOG-Z ============
// Khối nội dung đọc từ CMS (kind=pages, payload.section), fallback giá trị mặc định.
const DEFAULT_BLOCKS = {
  hero: { title: 'HISTORLOG-Z', subtitle: 'History and Technology', desc: 'Nền tảng học Lịch sử tương tác: Dòng thời gian, Bản đồ, Thẻ nhân vật và Chrono-Quiz — dành cho học sinh THPT.', image: '' },
  intro: { title: 'Giới thiệu', content: 'HISTORLOG-Z số hoá kiến thức Lịch sử Việt Nam và Thế giới thành trải nghiệm khám phá: đọc sự kiện theo dòng thời gian, định vị trên bản đồ lịch sử, mở khóa thẻ nhân vật qua thử thách câu hỏi và kiểm tra kiến thức bằng Quiz được chấm điểm minh bạch.' },
  guide: { title: 'Hướng dẫn sử dụng', steps: [
    'Tạo tài khoản ở mục Tài khoản để lưu tiến độ học tập.',
    'Khám phá Dòng thời gian: chọn Việt Nam hoặc Thế giới, lọc theo năm và từ khóa.',
    'Mở Bản đồ lịch sử, bấm các điểm ghim để xem sự kiện gắn với địa danh.',
    'Làm Quiz để ghi điểm; điểm tích lũy mở mốc huy hiệu 30 · 50 · 100 · 200 · 300.',
    'Vượt thử thách câu hỏi để mở khóa thẻ nhân vật Basic → Rare → Epic → Legend.',
  ]},
};

export default function Home({ go }) {
  const { pages, events, announcements } = useData();
  const { user } = useAuth();
  const [block, setBlock] = useState(DEFAULT_BLOCKS);
  const [fb, setFb] = useState({ name: '', message: '' });
  const [fbDone, setFbDone] = useState('');

  useEffect(() => {
    try {
      const b = { ...DEFAULT_BLOCKS };
      for (const pg of pages) {
        const sec = pg.payload?.section;
        if (sec && b[sec] !== undefined) b[sec] = { ...b[sec], ...(pg.payload || {}), title: pg.payload?.title || pg.title };
      }
      setBlock(b);
    } catch { /* giữ mặc định */ }
  }, [pages]);

  const featured = events.filter(e => e.advanced || e.basic).slice(0, 3);
  const recent = [...events].sort((a, b) => (b.yearStart || 0) - (a.yearStart || 0)).slice(0, 4);

  async function sendFeedback(e) {
    e.preventDefault();
    if (fb.message.trim().length < 5) { setFbDone('Bạn hãy viết góp ý dài hơn (tối thiểu 5 ký tự).'); return; }
    const { error } = await supabase.from('feedback').insert({ user_id: user?.id || null, name: fb.name || null, message: fb.message });
    if (error) { setFbDone('Không gửi được góp ý: ' + error.message); return; }
    setFb({ name: '', message: '' }); setFbDone('Cảm ơn góp ý của bạn! Chúng mình đã ghi nhận.');
  }

  const cats = [
    ['timeline', 'Dòng thời gian', 'Việt Nam & Thế giới, bốn thời kỳ', Clock],
    ['maps', 'Bản đồ lịch sử', 'Địa danh gắn với sự kiện', Map],
    ['characters', 'Thẻ nhân vật', 'Mở khóa Basic → Legend', Users],
    ['quiz', 'Chrono-Quiz', 'Chấm điểm công bằng, có giải thích', BrainCircuit],
  ];

  return (
    <div className="home">
      {announcements.length > 0 && (
        <div className="announce-bar"><Megaphone size={15} />
          <b>{announcements[0].title}</b><span>{announcements[0].body}</span>
        </div>
      )}

      <section className="hero-band" style={block.hero.image ? { backgroundImage: `linear-gradient(rgba(23,19,23,.55),rgba(23,19,23,.8)), url(${block.hero.image})` } : undefined}>
        <div className="hero-parallelogram">
          <h1 className="museum-h1">{block.hero.title}</h1>
          <p className="hero-slogan">{block.hero.subtitle}</p>
          <p className="hero-desc">{block.hero.desc}</p>
          <div className="hero-cta">
            <button className="btn-primary" onClick={() => go('timeline')}>Bắt đầu khám phá <ChevronRight size={16} /></button>
            {!user && <button className="btn-ghost" onClick={() => go('account')}>Đăng nhập để lưu tiến độ</button>}
          </div>
        </div>
      </section>

      <section className="cat-grid">
        {cats.map(([id, t, d, Icon]) => (
          <button key={id} className="cat-card" onClick={() => go(id)}>
            <span className="cat-icon"><Icon size={26} /></span>
            <b>{t}</b><small>{d}</small>
          </button>
        ))}
      </section>

      <section className="home-block">
        <h2 className="museum-h2">{block.intro.title}</h2>
        <p className="museum-p">{block.intro.content}</p>
      </section>

      <section className="home-block two-col">
        <div>
          <h2 className="museum-h2">{block.guide.title}</h2>
          <ol className="guide-list">{(block.guide.steps || []).map((s, i) => <li key={i}><span>{i + 1}</span>{s}</li>)}</ol>
        </div>
        <div>
          <h2 className="museum-h2">Nội dung mới</h2>
          <div className="last-content">
            {recent.map(e => (
              <button key={e.key} className="lc-item" onClick={() => go('timeline', { focus: e.key })}>
                <BookOpen size={14} />
                <div><b>{e.title}</b><small>{e.periodText}</small></div>
                <ChevronRight size={16} />
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="home-block">
        <h2 className="museum-h2">Sự kiện lịch sử nổi bật</h2>
        <div className="featured-grid">
          {featured.map(e => (
            <article key={e.key} className="featured-card">
              {e.imageUrl && <img src={e.imageUrl} alt={e.title} />}
              <div className="fc-body">
                <small>{e.periodText} · {e.region === 'vietnam' ? 'Việt Nam' : 'Thế giới'}</small>
                <h3>{e.title}</h3>
                <p>{(e.basic || '').slice(0, 140)}…</p>
                <button className="btn-ghost small" onClick={() => go('timeline', { focus: e.key })}>Đọc tiếp →</button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="home-block">
        <h2 className="museum-h2">Góp ý cho dự án</h2>
        <form onSubmit={sendFeedback} className="fb-form">
          <input className="field" placeholder="Tên của bạn (không bắt buộc)" value={fb.name} onChange={e => setFb({ ...fb, name: e.target.value })} />
          <textarea className="field" rows="3" required placeholder="Ý kiến đóng góp, lỗi bạn gặp hoặc nội dung bạn muốn thêm…" value={fb.message} onChange={e => setFb({ ...fb, message: e.target.value })} />
          <div className="fb-row"><button className="btn-primary"><Send size={15} /> Gửi góp ý</button>{fbDone && <span role="status">{fbDone}</span>}</div>
        </form>
      </section>

      <footer className="home-footer">
        <div>HISTORLOG-Z · History and Technology</div>
        <div>Dự án nghiên cứu khoa học kỹ thuật dành cho học sinh THPT · Nguồn tư liệu: SGK Lịch sử 10–12, Wikimedia Commons, kiểm chứng bởi nhóm tác giả.</div>
      </footer>
    </div>
  );
}
