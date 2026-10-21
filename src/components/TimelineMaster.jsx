import { useMemo, useState, useEffect } from 'react';
import { Search, MapPin, Users, BrainCircuit, ChevronLeft, ChevronRight, BookOpen, Columns2, Edit3 } from 'lucide-react';
import { useData } from '../store';
import { useAuth } from '../auth';
import { normVN, searchIn } from '../utils';

// ============ TIMELINE: VN / Thế giới × 4 thời kỳ + chế độ song song ============
const PERIODS = ['Cổ đại', 'Trung đại', 'Cận đại', 'Hiện đại'];

export default function TimelineMaster({ go, focus }) {
  const { events, characters, maps } = useData();
  const { isAdmin } = useAuth();
  const [mode, setMode] = useState('list'); // list | parallel
  const [region, setRegion] = useState('vietnam');
  const [era, setEra] = useState('all');
  const [q, setQ] = useState('');
  const [yearFrom, setYearFrom] = useState('');
  const [yearTo, setYearTo] = useState('');
  const [activeKey, setActiveKey] = useState(null);

  useEffect(() => { if (focus) { setActiveKey(focus); setRegion(events.find(e => e.key === focus)?.region || 'vietnam'); } }, [focus, events]);

  const filtered = useMemo(() => {
    let list = events.filter(e => (era === 'all' || e.era === era) && searchIn(q, e.title, e.periodText, e.basic, e.advanced));
    const yf = parseInt(yearFrom, 10), yt = parseInt(yearTo, 10);
    if (!isNaN(yf)) list = list.filter(e => (e.yearEnd || e.yearStart || 0) >= yf);
    if (!isNaN(yt)) list = list.filter(e => (e.yearStart || e.yearEnd || 0) <= yt);
    return list;
  }, [events, era, q, yearFrom, yearTo]);

  const vn = filtered.filter(e => e.region === 'vietnam');
  const world = filtered.filter(e => e.region !== 'vietnam');
  const side = region === 'vietnam' ? vn : world;
  const active = events.find(e => e.key === activeKey) || side[0] || vn[0] || world[0] || null;
  const sorted = useMemo(() => [...(active ? (active.region === 'vietnam' ? vn : world) : side)]
    .sort((a, b) => (a.yearStart ?? 9999) - (b.yearStart ?? 9999)), [side, vn, world, active]);
  const idx = active ? sorted.findIndex(e => e.key === active.key) : -1;
  const prev = idx > 0 ? sorted[idx - 1] : null;
  const next = idx >= 0 && idx < sorted.length - 1 ? sorted[idx + 1] : null;

  const relChars = active ? (active.relatedCharacters || []).map(k => typeof k === 'string' ? k : k?.key).filter(Boolean) : [];
  const relMaps = active ? (active.relatedMaps || []).map(k => typeof k === 'string' ? k : k?.key).filter(Boolean) : [];

  // Gợi ý tự động liên kết nhân vật/bản đồ theo tên xuất hiện trong mô tả
  const autoChars = active ? characters.filter(c => normVN(active.basic + active.advanced).includes(normVN(c.name)) && !relChars.includes(c.key)).slice(0, 3) : [];
  const autoMaps = maps.filter(m => active && (m.events || []).some(ev => (typeof ev === 'string' ? ev : ev.event_key) === active.key));

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <h2 className="museum-h2">Dòng thời gian</h2>
          <p className="muted">{vn.length} mốc Việt Nam · {world.length} mốc Thế giới · tổng {events.length} sự kiện
            {' '}{active?.source === 'cms' ? '' : '(kho dự liệu gốc từ SGK, đang được chuẩn hoá từng bước)'}</p>
        </div>
        <div className="head-actions">
          <button className={mode === 'parallel' ? 'btn-primary' : 'btn-ghost'} onClick={() => setMode(mode === 'parallel' ? 'list' : 'parallel')}>
            <Columns2 size={16} /> So sánh song song
          </button>
          {isAdmin && <button className="btn-ghost" onClick={() => go('admin', { tab: 'timeline' })}><Edit3 size={15} /> Quản lý sự kiện</button>}
        </div>
      </header>

      <div className="filter-bar">
        <div className="search-box"><Search size={16} /><input placeholder="Tìm không phân biệt dấu…" value={q} onChange={e => setQ(e.target.value)} /></div>
        <div className="chip-row">
          <button className={region === 'vietnam' && mode === 'list' ? 'chip on' : 'chip'} onClick={() => { setMode('list'); setRegion('vietnam'); }}>🇻🇳 Việt Nam</button>
          <button className={region !== 'vietnam' && mode === 'list' ? 'chip on' : 'chip'} onClick={() => { setMode('list'); setRegion('world'); }}>🌍 Thế giới</button>
          {PERIODS.map(p => <button key={p} className={era === p ? 'chip on' : 'chip'} onClick={() => setEra(era === p ? 'all' : p)}>{p}</button>)}
          {era !== 'all' && <button className="chip clear" onClick={() => setEra('all')}>×</button>}
        </div>
        <div className="year-row">
          <label>Từ năm <input type="number" className="field year" placeholder="TCN…" value={yearFrom} onChange={e => setYearFrom(e.target.value)} /></label>
          <label>đến <input type="number" className="field year" placeholder="…" value={yearTo} onChange={e => setYearTo(e.target.value)} /></label>
        </div>
      </div>

      {mode === 'parallel' && (
        <div className="parallel">
          <div className="par-col"><h3>Việt Nam</h3>{vn.map(e => <button key={e.key} onClick={() => { setMode('list'); setRegion('vietnam'); setActiveKey(e.key); }}><b>{e.periodText}</b> {e.title}</button>)}</div>
          <div className="par-col"><h3>Thế giới</h3>{world.map(e => <button key={e.key} onClick={() => { setMode('list'); setRegion('world'); setActiveKey(e.key); }}><b>{e.periodText}</b> {e.title}</button>)}</div>
        </div>
      )}

      {mode === 'list' && (
        <div className="timeline-split">
          <nav className="tl-list">
            {sorted.map(e => (
              <button key={e.key} className={active?.key === e.key ? 'on' : ''} onClick={() => setActiveKey(e.key)}>
                <small>{e.periodText}</small><span>{e.title}</span>
              </button>
            ))}
            {!sorted.length && <p className="muted pad">Không tìm thấy sự kiện phù hợp bộ lọc.</p>}
          </nav>

          {active ? <article className="tl-detail">
            <div className="tl-nav">
              <button disabled={!prev} onClick={() => prev && setActiveKey(prev.key)}><ChevronLeft size={16} /> {prev ? prev.periodText : 'Sự kiện đầu'}</button>
              <button disabled={!next} onClick={() => next && setActiveKey(next.key)}>{next ? next.periodText : 'Sự kiện cuối'} <ChevronRight size={16} /></button>
            </div>
            {active.imageUrl && (
              <figure className="tl-img">
                <img src={active.imageUrl} alt={active.title} />
                {active.caption ? <figcaption>{active.caption}</figcaption> : <figcaption>Hình minh họa (không phải tư liệu gốc nếu là tranh phục dựng).</figcaption>}
              </figure>
            )}
            <small className="era-tag">{active.periodText} · {active.era} · {active.region === 'vietnam' ? 'Lịch sử Việt Nam' : 'Lịch sử Thế giới'}</small>
            <h3>{active.title}</h3>
            {active.basic && <section><h4>Thông tin cơ bản</h4><p>{active.basic}</p></section>}
            {active.advanced && <section className="adv"><h4>Phân tích chuyên sâu</h4><p>{active.advanced}</p></section>}
            {(active.causes || active.course || active.results || active.significance) && (
              <section className="four-aspect">
                {active.causes && <div><h5>Nguyên nhân</h5><p>{active.causes}</p></div>}
                {active.course && <div><h5>Diễn biến</h5><p>{active.course}</p></div>}
                {active.results && <div><h5>Kết quả</h5><p>{active.results}</p></div>}
                {active.significance && <div><h5>Ý nghĩa</h5><p>{active.significance}</p></div>}
              </section>
            )}
            {active.fullWiki && <details className="fullwiki"><summary><BookOpen size={14} /> Toàn văn tài liệu gốc</summary><p>{active.fullWiki}</p></details>}
            {active.ref && <p className="source">Nguồn tham khảo: {active.ref}</p>}

            <div className="cross-links">
              {(relMaps.length || autoMaps.length) > 0 && (
                <a className="link-chip" onClick={() => go('maps', { focus: relMaps[0] || autoMaps[0]?.key })}><MapPin size={14} /> Xem trên bản đồ lịch sử</a>
              )}
              {characters.filter(c => relChars.includes(c.key) || autoChars.some(a => a.key === c.key)).slice(0, 3).map(c => (
                <a key={c.key} className="link-chip" onClick={() => go('characters', { focus: c.key })}><Users size={14} /> {c.name}</a>
              ))}
              <a className="link-chip quiz" onClick={() => go('quiz', { topic: active.region, era: active.era })}><BrainCircuit size={14} /> Làm Quiz về chủ đề này</a>
            </div>
          </article> : <div className="tl-detail empty">Chọn một sự kiện bên trái.</div>}
        </div>
      )}
    </div>
  );
}
