import { useState, useEffect } from 'react';
import { Mail, Info, Send, Globe, Save, X, ShieldCheck } from 'lucide-react';
import { aboutData as initialAboutData } from '../aboutData';
import { listItems, upsertItem } from '../cms';
import { useAuth } from '../auth';
import { useData } from '../store';
import { safeHtml } from '../utils';

// ============ THÔNG TIN DỰ ÁN ============
// Bỏ hoàn toàn "mật khẩu admin" viết cứng ở frontend (lỗi bảo mật bản cũ).
// Muốn chỉnh sửa: phải ĐĂNG NHẬP bằng tài khoản có role=admin (Supabase Auth + RLS).
// Nội dung lưu trong content_items (kind=pages, legacy_id=page-about) — đồng bộ CMS.
const About = () => {
  const { isAdmin } = useAuth();
  const { refresh } = useData();
  const [data, setData] = useState(initialAboutData);
  const [editedData, setEditedData] = useState(initialAboutData);
  const [editMode, setEditMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    let alive = true;
    listItems('pages', true)
      .then(rows => {
        const r = rows.find(x => (x.legacy_id === 'page-about' || x.payload?.section === 'about'));
        if (alive && r) {
          const loaded = { ...initialAboutData, ...(r.payload || {}), missionTitle: r.title, missionContent: r.payload?.missionContent ?? r.body ?? '' };
          setData(loaded); setEditedData(loaded);
        }
      })
      .catch(() => { /* giữ dữ liệu bundle */ });
    return () => { alive = false; };
  }, []);

  useEffect(() => { if (!editMode) setEditedData(data); }, [editMode, data]);

  const handleChange = (e) => setEditedData({ ...editedData, [e.target.name]: e.target.value });

  async function handleSave() {
    setIsSaving(true); setMsg('');
    try {
      const existing = (await listItems('pages', true).catch(() => [])).find(x => x.legacy_id === 'page-about');
      await upsertItem({
        ...(existing || {}),
        kind: 'pages', legacy_id: 'page-about',
        title: editedData.missionTitle, body: editedData.missionContent,
        published: true, visible: true,
        payload: { section: 'about', ...editedData },
      });
      setData(editedData); setEditMode(false); setMsg('✔ Đã lưu lên máy chủ.');
      await refresh();
    } catch (e) {
      setMsg('✖ Lỗi lưu: ' + e.message);
    } finally { setIsSaving(false); }
  }

  return (
    <div className="page about-page">
      <div className="about-head">
        <div>
          <h2 className="museum-h2"><Info size={22} /> {data.missionTitle}</h2>
          <p className="muted">Tìm hiểu mục đích dự án và liên hệ nhóm tác giả.</p>
        </div>
        <div className="head-actions">
          {editMode ? (
            <>
              <button className="btn-ghost" onClick={() => setEditMode(false)}><X size={15} /> Huỷ</button>
              <button className="btn-primary" onClick={handleSave} disabled={isSaving}><Save size={15} /> {isSaving ? 'Đang lưu…' : 'Lưu thay đổi'}</button>
            </>
          ) : isAdmin ? (
            <button className="btn-ghost" onClick={() => setEditMode(true)}>✏️ Chỉnh sửa (Admin)</button>
          ) : (
            <span className="muted small"><ShieldCheck size={13} /> Chỉ Quản trị viên đăng nhập mới sửa được nội dung này.</span>
          )}
        </div>
      </div>
      {msg && <p role="status">{msg}</p>}

      <div className="about-grid">
        <article className="page-panel about-main">
          {editMode ? (
            <>
              <label className="f-label">Tiêu đề<input className="field" name="missionTitle" value={editedData.missionTitle} onChange={handleChange} /></label>
              <label className="f-label">Nội dung (đoạn cách nhau 1 dòng trống; **in đậm** được hỗ trợ)
                <textarea className="field" rows="16" name="missionContent" value={editedData.missionContent} onChange={handleChange} />
              </label>
            </>
          ) : (
            <div className="museum-p pre-wrap" dangerouslySetInnerHTML={{ __html: safeHtml(data.missionContent.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n\n/g, '</p><p>').replace(/\n/g, '<br>')) }} />
          )}
        </article>

        <aside className="page-panel about-contact">
          <h3 className="museum-h3"><Mail size={16} /> Liên hệ & Đóng góp</h3>
          {editMode
            ? <textarea className="field" rows="4" name="contactMessage" value={editedData.contactMessage} onChange={handleChange} />
            : <p className="muted">{data.contactMessage}</p>}
          <a className="btn-primary" href={`mailto:${data.email}?subject=Đóng góp ý kiến cho HISTORLOG-Z`}><Send size={15} /> Gửi email trực tiếp</a>
          <div className="contact-list">
            <label className="f-label">Website/Facebook<input className="field" name="facebook" value={editedData.facebook} onChange={handleChange} disabled={!editMode} /></label>
            <label className="f-label">Email<input className="field" name="email" value={editedData.email} onChange={handleChange} disabled={!editMode} /></label>
            {!editMode && <p className="muted small"><Globe size={12} /> {data.facebook}</p>}
          </div>
          <p className="muted small">Form góp ý nhanh nằm ở cuối Trang chủ — gửi vào bảng feedback, Admin đọc trong bảng điều khiển.</p>
        </aside>
      </div>
    </div>
  );
};

export default About;
