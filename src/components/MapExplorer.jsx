import { useMemo, useRef, useState, useEffect } from 'react';
import { ZoomIn, ZoomOut, Maximize2, ChevronLeft, MapPin, ExternalLink, Edit3 } from 'lucide-react';
import { useData } from '../store';
import { useAuth } from '../auth';
import { searchIn } from '../utils';

// ============ BẢN ĐỒ LỊCH SỬ: phóng to/thu nhỏ, kéo panoram, hotspot ============
// Nguồn: merge LEGACY_MAPS (4 bản đồ yêu cầu) + CMS kind=maps (legacy_id trùng key sẽ thắng).
import { LEGACY_MAPS } from '../mapSamples';

export default function MapExplorer({ go, focus }) {
  const { maps: cmsMaps, eventByKey } = useData();
  const { isAdmin } = useAuth();
  const [q, setQ] = useState('');
  const [openKey, setOpenKey] = useState(null);

  useEffect(() => { if (focus) setOpenKey(focus); }, [focus]);

  const maps = useMemo(() => {
    const cmsNorm = cmsMaps.map(c => ({
      key: c.legacy_id || `cms-${c.cmsId || c.id}`,
      title: c.title,
      year: c.payload?.year ?? null,
      description: c.body || c.payload?.description || '',
      imageUrl: c.imageUrl || c.image_url || '',
      markers: (c.payload?.markers || c.markers || []),
      source: 'cms', cmsId: c.cmsId || c.id,
      published: c.published !== false,
    }));
    const byKey = new Map(cmsNorm.map(m => [m.key, m]));
    const base = LEGACY_MAPS.map(l => byKey.get(l.key) || l);
    const extras = cmsNorm.filter(m => !LEGACY_MAPS.some(l => l.key === m.key));
    return [...base, ...extras].filter(m => m.published !== false);
  }, [cmsMaps]);

  const shown = maps.filter(m => searchIn(q, m.title, m.description, String(m.year || '')));
  const active = openKey ? maps.find(m => m.key === openKey) : null;

  if (active) return <MapStage map={active} go={go} eventByKey={eventByKey} onBack={() => setOpenKey(null)} isAdmin={isAdmin} />;

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <h2 className="museum-h2">Bản đồ lịch sử</h2>
          <p className="muted">Bấm vào bản đồ để xem địa danh và sự kiện gắn với mỗi điểm ghim. Admin có thể tải bản đồ nền và đặt ghim trong Map Studio.</p>
        </div>
        {isAdmin && <button className="btn-ghost" onClick={() => go('admin', { tab: 'maps' })}><Edit3 size={15} /> Map Studio</button>}
      </header>
      <div className="filter-bar">
        <div className="search-box"><MapPin size={16} /><input placeholder="Tìm bản đồ, địa danh…" value={q} onChange={e => setQ(e.target.value)} /></div>
      </div>
      <div className="map-grid">
        {shown.map(m => (
          <button key={m.key} className="map-card" onClick={() => setOpenKey(m.key)}>
            <div className="map-thumb">
              {m.imageUrl
                ? <img src={m.imageUrl} alt={m.title} />
                : <span className="map-thumb-ph">Bản đồ {m.year || ''}</span>}
              <span className="map-pin-count">{(m.markers || []).length} điểm</span>
            </div>
            <b>{m.title}</b>
            <small>{m.description}</small>
          </button>
        ))}
        {!shown.length && <p className="muted pad">Không có bản đồ phù hợp. Admin thêm bản đồ mới trong Map Studio.</p>}
      </div>
    </div>
  );
}

function MapStage({ map, go, eventByKey, onBack, isAdmin }) {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [pin, setPin] = useState(null);
  const [hoverPin, setHoverPin] = useState(null);
  const drag = useRef(null);
  const stageRef = useRef(null);

  const clamp = (z) => Math.min(4, Math.max(1, z));
  function onPointerDown(e) {
    if (e.target.closest('.map-pin')) return;
    drag.current = { sx: e.clientX, sy: e.clientY, px: pan.x, py: pan.y };
    e.currentTarget.setPointerCapture?.(e.pointerId);
  }
  function onPointerMove(e) {
    if (!drag.current) return;
    setPan({ x: drag.current.px + (e.clientX - drag.current.sx), y: drag.current.py + (e.clientY - drag.current.sy) });
  }
  function onPointerUp() { drag.current = null; }
  function onWheel(e) {
    e.preventDefault();
    const z = clamp(zoom + (e.deltaY < 0 ? 0.25 : -0.25));
    if (z === 1) setPan({ x: 0, y: 0 });
    setZoom(z);
  }
  function zoomBy(d) {
    const z = clamp(zoom + d);
    if (z === 1) setPan({ x: 0, y: 0 });
    setZoom(z);
  }
  const markers = useMemo(() => (map.markers || []).map((m, i) => ({ ...m, idx: i })), [map]);
  const ev = pin?.event_key ? eventByKey(pin.event_key) : null;

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <button className="btn-ghost" onClick={onBack}><ChevronLeft size={16} /> Mọi bản đồ</button>
          <h2 className="museum-h2" style={{ marginTop: 8 }}>{map.title}{map.year ? ` (${map.year})` : ''}</h2>
          <p className="muted">{map.description}</p>
        </div>
        <div className="map-tools">
          <button className="tool-btn" onClick={() => zoomBy(0.5)} title="Phóng to"><ZoomIn size={18} /></button>
          <button className="tool-btn" onClick={() => zoomBy(-0.5)} title="Thu nhỏ"><ZoomOut size={18} /></button>
          <button className="tool-btn" onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }} title="Đặt lại khung nhìn"><Maximize2 size={16} /></button>
          {isAdmin && <button className="btn-ghost" onClick={() => go('admin', { tab: 'maps', focus: map.key })}>Sửa bản đồ này</button>}
        </div>
      </header>

      <div className="map-stage" ref={stageRef}
        onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerUp}
        onWheel={onWheel}
        style={{ cursor: drag.current ? 'grabbing' : 'grab' }}>
        <div className="map-canvas" style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})` }}>
          {map.imageUrl
            ? <img className="map-img" src={map.imageUrl} alt={`Bản đồ ${map.title}`} draggable={false} />
            : <div className="map-placeholder"><b>{map.title}</b><span>Chưa có bản đồ nền xác minh — nhóm tác giả sẽ tải bản đồ công-domain (Wikimedia Commons) và đặt trong Media Library. Điểm ghim vẫn hoạt động.</span></div>}
          {markers.map(m => (
            <button key={m.idx} className={`map-pin ${pin?.idx === m.idx ? 'on' : ''}`}
              style={{ left: `${m.x}%`, top: `${m.y}%` }}
              onPointerDown={e => e.stopPropagation()}
              onMouseEnter={() => setHoverPin(m)}
              onMouseLeave={() => setHoverPin(null)}
              onClick={() => setPin(m === pin ? null : m)}
              title={m.name}>
              <MapPin size={16} fill="currentColor" />
            </button>
          ))}

          {/* Hover popup hiện ảnh và thông tin khi rê chuột vào ghim */}
          {hoverPin && (hoverPin.image_url || hoverPin.image || hoverPin.description) && (
            <div className="map-pin-hover-card" style={{ left: `${hoverPin.x}%`, top: `${hoverPin.y}%` }}>
              {(hoverPin.image_url || hoverPin.image) && (
                <img src={hoverPin.image_url || hoverPin.image} alt={hoverPin.name} className="hover-pin-img" />
              )}
              <div className="hover-pin-body">
                <b>{hoverPin.name}</b>
                {hoverPin.description && <p>{hoverPin.description}</p>}
                {(hoverPin.event_name || hoverPin.event_key) && (
                  <span className="hover-pin-event">📜 {hoverPin.event_name || hoverPin.event_key}</span>
                )}
              </div>
            </div>
          )}
        </div>
        <span className="zoom-badge">{Math.round(zoom * 100)}%</span>
      </div>
      <p className="muted small pad">Mẹo: kéo để di chuyển, cuộn chuột hoặc dùng nút để phóng to; bấm điểm ghim để xem chi tiết. Trên điện thoại: chạm kéo và pinch bằng hai ngón (một số trình duyệt hỗ trợ).</p>

      {pin && (
        <section className="pin-panel page-panel">
          <h3>{pin.name}</h3>
          <p>{pin.description}</p>
          {(pin.image_url || pin.image) && <img className="pin-img" src={pin.image_url || pin.image} alt={pin.name} />}
          {ev ? (
            <button className="btn-primary" onClick={() => go('timeline', { focus: ev.key })}>
              <ExternalLink size={15} /> Xem sự kiện “{ev.title}” trên Dòng thời gian
            </button>
          ) : (pin.event_name || pin.event_key) ? (
            <p className="muted small" style={{ marginTop: 8 }}><b>Sự kiện liên kết:</b> {pin.event_name || pin.event_key}</p>
          ) : null}
          {pin.source && <p className="source">Nguồn: {pin.source}</p>}
        </section>
      )}
    </div>
  );
}
