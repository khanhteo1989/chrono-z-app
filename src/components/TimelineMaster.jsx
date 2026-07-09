import { useState, useMemo, useRef, useCallback } from 'react';
import { autoTimelineData as ALL_EVENTS } from '../scannedData';
import { ChevronRight, Globe2, MapPin, Database, ChevronDown, ChevronUp, Search, Edit3, Save, Image as ImageIcon, CheckCircle2, X, PlusCircle, Trash2 } from 'lucide-react';
import WikiTooltip from './WikiTooltip';

const TimelineMaster = () => {
  const [events, setEvents] = useState(ALL_EVENTS);
  const [activeTab, setActiveTab] = useState('vietnam');
  const [searchQuery, setSearchQuery] = useState('');
  const [isFullWikiOpen, setIsFullWikiOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [pwdInput, setPwdInput] = useState("");

  // Biến kiểm tra môi trường: true nếu đã build để đưa lên mạng, false nếu đang code (npm run dev)
  const isProduction = import.meta.env.PROD;

  // Lọc theo tab + tìm kiếm
  const filteredEvents = useMemo(() => {
    let evs = events.filter(item => item.category === activeTab);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      evs = evs.filter(e =>
        e.title.toLowerCase().includes(q) ||
        e.period.toLowerCase().includes(q) ||
        e.full_wiki?.toLowerCase().includes(q) ||
        e.advanced?.toLowerCase().includes(q)
      );
    }
    return evs;
  }, [events, activeTab, searchQuery]);

  const [activeEventId, setActiveEventId] = useState(() => {
    const first = events.filter(e => e.category === 'vietnam')[0];
    return first ? first.id : null;
  });

  const activeEvent = useMemo(() => events.find(e => e.id === activeEventId), [events, activeEventId]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSearchQuery('');
    const first = events.filter(e => e.category === tab)[0];
    setActiveEventId(first ? first.id : null);
    setIsFullWikiOpen(false);
  };

  // Render text với WikiTooltip
  const renderWithWikiLinks = (text, wikiLinksObj) => {
    if (!text) return '';
    if (!wikiLinksObj || Object.keys(wikiLinksObj).length === 0) return text;
    const sortedKeys = Object.keys(wikiLinksObj).sort((a, b) => b.length - a.length);
    const pattern = new RegExp(`(${sortedKeys.map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'g');
    const parts = text.split(pattern);
    return parts.map((part, index) => {
      if (wikiLinksObj[part]) return <WikiTooltip key={index} text={part} wikiId={wikiLinksObj[part]} />;
      return part;
    });
  };

  // --- HÀM CHO EDIT MODE & ADMIN ---
  const handleVerifyPwd = () => {
    if (pwdInput === "admin123") {
      setEditMode(true);
      setShowAuth(false);
      setPwdInput("");
    } else {
      alert("❌ Sai mật khẩu! Bạn không có quyền truy cập.");
    }
  };

  const handleAddNewEvent = () => {
    const newId = Math.max(0, ...events.map(e => e.id)) + 1;
    const newEvent = {
      id: newId,
      period: "NĂM ...",
      category: activeTab,
      title: "Sự kiện mới chưa có tiêu đề",
      basic: "",
      advanced: "",
      full_wiki: "",
      wikiLinks: {}
    };
    setEvents([...events, newEvent]);
    setActiveEventId(newId);
  };

  const handleInputChange = (field, value) => {
    setEvents(prev => prev.map(e => {
      if (e.id === activeEventId) {
        return { ...e, [field]: value };
      }
      return e;
    }));
  };

  const handleDeleteEvent = (id) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa mốc lịch sử này?")) {
      setEvents(prev => prev.filter(e => e.id !== id));
      if (activeEventId === id) {
        setActiveEventId(null);
      }
    }
  };

  const handleImageDrop = async (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (!file || !file.type.startsWith('image/')) return;
    uploadImage(file);
  };

  const handleImageSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    uploadImage(file);
  };

  const uploadImage = (file) => {
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const base64 = ev.target.result;
      try {
        const res = await fetch('/api/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fileName: file.name, base64 })
        });
        const data = await res.json();
        if (data.success) {
          handleInputChange('imageUrl', data.url);
        } else {
          alert('Lỗi tải ảnh: ' + data.error);
        }
      } catch (err) {
        alert('Lỗi kết nối: ' + err.message);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveData = async () => {
    setIsSaving(true);
    try {
      const res = await fetch('/api/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(events)
      });
      const data = await res.json();
      if (data.success) {
        alert('✅ Đã lưu dữ liệu thành công vào hệ thống!');
        setEditMode(false);
      } else {
        alert('Lỗi khi lưu: ' + data.error);
      }
    } catch (err) {
      alert('Lỗi kết nối: ' + err.message);
    }
    setIsSaving(false);
  };

  // Thống kê
  const vnCount = events.filter(e => e.category === 'vietnam').length;
  const worldCount = events.filter(e => e.category === 'world').length;

  return (
    <div className="p-8 h-full flex flex-col">
      {/* Header */}
      <div className="mb-6 flex justify-between items-start">
        <div>
          <h2 className="text-4xl font-heading font-bold text-transparent bg-clip-text bg-gradient-to-r from-chrono-mint to-blue-400 mb-1 flex items-center gap-3 drop-shadow-[0_0_15px_rgba(0,245,212,0.5)]">
            Dòng thời gian
            {editMode && <span className="text-sm bg-yellow-500/20 text-yellow-400 px-3 py-1 rounded-full border border-yellow-500/50">Edit Mode</span>}
          </h2>
          <p className="text-white/50 text-sm">
            Kho dữ liệu: <span className="text-chrono-mint font-bold">{vnCount}</span> mốc Việt Nam •{' '}
            <span className="text-chrono-purple font-bold">{worldCount}</span> mốc Thế giới.
          </p>
        </div>
        
        {/* Nút bật/tắt Edit Mode và Lưu (Chỉ hiển thị ở Dev Mode) */}
        {!isProduction && (
          <div className="flex gap-3 items-center">
            {editMode ? (
              <>
                <button 
                  onClick={() => setEditMode(false)}
                  className="px-4 py-2 rounded-xl border border-white/20 text-white/70 hover:bg-white/10 text-sm font-bold flex items-center gap-2"
                >
                  <X size={16} /> Hủy
                </button>
                <button 
                  onClick={handleSaveData}
                  disabled={isSaving}
                  className="px-4 py-2 rounded-xl bg-chrono-mint text-black hover:bg-chrono-mint/80 text-sm font-bold flex items-center gap-2 shadow-[0_0_15px_rgba(0,245,212,0.3)] disabled:opacity-50"
                >
                  {isSaving ? <span className="animate-spin">⏳</span> : <Save size={16} />} 
                  {isSaving ? 'Đang lưu...' : 'Lưu Thay Đổi'}
                </button>
              </>
            ) : showAuth ? (
              <div className="flex items-center gap-2 bg-black/40 p-1.5 rounded-xl border border-white/20">
                <input
                  type="password"
                  value={pwdInput}
                  onChange={(e) => setPwdInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleVerifyPwd()}
                  placeholder="Mật khẩu Admin..."
                  autoFocus
                  className="bg-transparent text-white text-sm px-3 py-1 outline-none w-36"
                />
                <button
                  onClick={handleVerifyPwd}
                  className="bg-chrono-mint text-black px-3 py-1 rounded-lg text-sm font-bold hover:bg-chrono-mint/80"
                >
                  OK
                </button>
                <button
                  onClick={() => setShowAuth(false)}
                  className="text-white/50 hover:text-white px-2"
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              <button 
                onClick={() => setShowAuth(true)}
                className="px-4 py-2 rounded-xl border border-chrono-mint/50 text-chrono-mint hover:bg-chrono-mint/10 text-sm font-bold flex items-center gap-2"
              >
                <Edit3 size={16} /> Bật Chỉnh Sửa
              </button>
            )}
          </div>
        )}
      </div>

      {/* Tabs + Search */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <button
          onClick={() => handleTabChange('vietnam')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 ${activeTab === 'vietnam' ? 'bg-chrono-mint text-chrono-dark shadow-neon-mint scale-[1.05]' : 'backdrop-blur-md bg-white/5 border border-white/10 text-white/50 hover:bg-white/10 hover:text-white'}`}
        >
          <MapPin size={16} /> Lịch sử Việt Nam
        </button>
        <button
          onClick={() => handleTabChange('world')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 ${activeTab === 'world' ? 'bg-chrono-purple text-white shadow-neon-purple scale-[1.05]' : 'backdrop-blur-md bg-white/5 border border-white/10 text-white/50 hover:bg-white/10 hover:text-white'}`}
        >
          <Globe2 size={16} /> Lịch sử Thế giới
        </button>

        {/* Search */}
        <div className="flex items-center gap-2 flex-1 min-w-[160px] backdrop-blur-md bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 shadow-glass focus-within:border-chrono-mint/50 focus-within:shadow-neon-mint transition-all">
          <Search size={16} className="text-white/40 shrink-0" />
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Tìm kiếm sự kiện, năm..."
            className="bg-transparent text-white/80 text-sm placeholder:text-white/30 outline-none w-full"
          />
        </div>

        {/* Nút Thêm Sự Kiện (Chỉ hiển thị khi đang Edit Mode) */}
        {editMode && (
          <button
            onClick={handleAddNewEvent}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm bg-yellow-500 text-black hover:bg-yellow-400 shadow-[0_0_15px_rgba(234,179,8,0.3)] transition-all ml-auto"
          >
            <PlusCircle size={16} /> Thêm Mốc Lịch Sử
          </button>
        )}
      </div>

      <div className="flex flex-1 gap-8 overflow-hidden">
        {/* Cột trái – Danh sách mốc */}
        <div className="w-72 shrink-0 overflow-y-auto pr-2 space-y-2">
          {filteredEvents.map((item) => (
            <button
              key={item.id}
              draggable={editMode}
              onDragStart={(e) => {
                if (!editMode) return;
                e.dataTransfer.setData('text/plain', item.id);
                e.target.style.opacity = '0.5';
              }}
              onDragEnd={(e) => {
                e.target.style.opacity = '1';
              }}
              onDragOver={(e) => {
                if (!editMode) return;
                e.preventDefault();
                e.currentTarget.style.borderTop = '2px solid #00f5d4';
              }}
              onDragLeave={(e) => {
                if (!editMode) return;
                e.currentTarget.style.borderTop = '';
              }}
              onDrop={(e) => {
                if (!editMode) return;
                e.preventDefault();
                e.currentTarget.style.borderTop = '';
                const draggedId = Number(e.dataTransfer.getData('text/plain'));
                if (!draggedId || draggedId === item.id) return;
                
                const sourceIdx = events.findIndex(ev => ev.id === draggedId);
                const targetIdx = events.findIndex(ev => ev.id === item.id);
                
                if (sourceIdx >= 0 && targetIdx >= 0) {
                  const newEvents = [...events];
                  const [movedItem] = newEvents.splice(sourceIdx, 1);
                  newEvents.splice(targetIdx, 0, movedItem);
                  setEvents(newEvents);
                }
              }}
              onClick={() => { setActiveEventId(item.id); setIsFullWikiOpen(false); }}
              className={`w-full text-left px-4 py-3 rounded-xl border transition-all duration-300 ${editMode ? 'cursor-grab active:cursor-grabbing' : ''} ${
                activeEventId === item.id
                  ? 'backdrop-blur-xl bg-chrono-mint/10 border-chrono-mint shadow-neon-mint scale-[1.02]'
                  : 'backdrop-blur-md bg-white/5 border-white/10 shadow-glass hover:bg-white/10 hover:border-white/30 hover:scale-[1.01]'
              }`}
            >
              <div className="flex justify-between items-center mb-1">
                <div className="text-[10px] text-chrono-mint font-bold tracking-widest uppercase">{item.period}</div>
                {editMode && <div className="text-white/30 text-[10px]">☰ Kéo thả</div>}
              </div>
              <div className="font-heading font-semibold text-sm leading-snug line-clamp-2 text-white/90">{item.title}</div>
            </button>
          ))}
          {filteredEvents.length === 0 && (
            <div className="text-white/40 italic text-center mt-10 p-6 border border-white/10 rounded-xl bg-white/5 text-sm">
              Không tìm thấy kết quả.
            </div>
          )}
        </div>

        {/* Cột phải – Chi tiết sự kiện */}
        {activeEvent ? (
          <div className="flex-1 backdrop-blur-2xl bg-white/5 border border-white/10 shadow-glass rounded-2xl p-8 overflow-y-auto relative">
            <div className="absolute top-0 right-0 w-48 h-48 bg-chrono-purple/30 blur-[100px] rounded-full pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-chrono-mint/20 blur-[120px] rounded-full pointer-events-none" />

            {/* Ảnh (nếu có) */}
            {activeEvent.imageUrl && !editMode && (
              <div className="mb-6 rounded-xl overflow-hidden border border-white/10 relative">
                <img src={activeEvent.imageUrl} alt={activeEvent.title} className="w-full h-auto object-cover max-h-80" />
              </div>
            )}

            {/* Header sự kiện */}
            <div className="flex flex-col mb-6 relative z-10">
              <div className="flex justify-between items-start">
                <div className="flex-1 mr-4">
                  {editMode ? (
                    <>
                      <input
                        value={activeEvent.period}
                        onChange={(e) => handleInputChange('period', e.target.value)}
                        className="bg-white/10 border border-white/20 text-chrono-mint font-bold text-xs uppercase px-3 py-1.5 rounded-md mb-2 outline-none w-1/3 block"
                        placeholder="Mốc thời gian (VD: Năm 1945)"
                      />
                      <input
                        value={activeEvent.title}
                        onChange={(e) => handleInputChange('title', e.target.value)}
                        className="bg-white/10 border border-white/20 text-white font-heading font-bold text-2xl px-3 py-2 rounded-md outline-none w-full"
                        placeholder="Tiêu đề sự kiện"
                      />
                    </>
                  ) : (
                    <>
                      <div className="inline-block self-start px-3 py-1 bg-chrono-mint/10 border border-chrono-mint/30 text-chrono-mint rounded-full text-xs font-bold tracking-widest mb-3">
                        {activeEvent.period}
                      </div>
                      <h3 className="text-2xl font-heading font-bold text-white leading-tight">{activeEvent.title}</h3>
                    </>
                  )}
                </div>
                
                {editMode && (
                  <button 
                    onClick={() => handleDeleteEvent(activeEvent.id)}
                    className="text-red-400 hover:text-red-300 p-2 bg-black/50 rounded-full shrink-0"
                    title="Xóa Mốc Lịch Sử"
                  >
                    <Trash2 size={18} />
                  </button>
                )}
              </div>
            </div>

            {/* DRAG AND DROP ZONE (Edit Mode) */}
            {editMode && (
              <div 
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleImageDrop}
                className="mb-6 border-2 border-dashed border-white/20 rounded-xl p-6 text-center bg-white/5 hover:bg-white/10 transition-colors relative"
              >
                {activeEvent.imageUrl && (
                   <img src={activeEvent.imageUrl} className="w-full h-40 object-cover rounded-md mb-4 border border-white/10 opacity-70" alt="preview" />
                )}
                <ImageIcon size={32} className="mx-auto text-white/30 mb-2" />
                <p className="text-white/60 text-sm mb-2">Kéo thả ảnh vào đây để tải lên, hoặc</p>
                <label className="bg-white/10 hover:bg-white/20 text-white text-xs px-4 py-2 rounded-md cursor-pointer inline-block">
                  Chọn File Ảnh
                  <input type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />
                </label>
              </div>
            )}

            <div className="space-y-5 relative z-10">
              {/* Basic */}
              <div className="backdrop-blur-md bg-white/5 border border-white/10 shadow-glass rounded-xl p-5 hover:border-chrono-mint/30 transition-all duration-300">
                {editMode ? (
                  <input 
                    value={activeEvent.basicTitle || 'Thông tin cơ bản'} 
                    onChange={(e) => handleInputChange('basicTitle', e.target.value)}
                    className="bg-transparent border-b border-white/30 text-chrono-mint font-bold mb-3 uppercase text-xs tracking-widest outline-none w-full"
                  />
                ) : (
                  <h4 className="flex items-center gap-2 text-chrono-mint font-bold mb-3 uppercase text-xs tracking-widest">
                    <ChevronRight size={14} /> {activeEvent.basicTitle || 'Thông tin cơ bản'}
                  </h4>
                )}
                {editMode ? (
                  <textarea
                    value={activeEvent.basic || ''}
                    onChange={(e) => handleInputChange('basic', e.target.value)}
                    className="w-full bg-white/10 border border-white/20 rounded-md p-3 text-white/90 text-[15px] outline-none min-h-[100px]"
                    placeholder="Nhập thông tin cơ bản..."
                  />
                ) : (
                  <p className="text-white/85 leading-relaxed text-[15px]">
                    {renderWithWikiLinks(activeEvent.basic, activeEvent.wikiLinks)}
                  </p>
                )}
              </div>

              {/* Advanced */}
              <div className="backdrop-blur-md bg-white/5 border border-white/10 shadow-glass rounded-xl p-5 hover:border-chrono-purple/30 transition-all duration-300">
                {editMode ? (
                  <input 
                    value={activeEvent.advancedTitle || 'Phân tích chuyên gia'} 
                    onChange={(e) => handleInputChange('advancedTitle', e.target.value)}
                    className="bg-transparent border-b border-white/30 text-chrono-purple font-bold mb-3 uppercase text-xs tracking-widest outline-none w-full"
                  />
                ) : (
                  <h4 className="flex items-center gap-2 text-chrono-purple font-bold mb-3 uppercase text-xs tracking-widest">
                    <ChevronRight size={14} /> {activeEvent.advancedTitle || 'Phân tích chuyên gia'}
                  </h4>
                )}
                {editMode ? (
                  <textarea
                    value={activeEvent.advanced || ''}
                    onChange={(e) => handleInputChange('advanced', e.target.value)}
                    className="w-full bg-white/10 border border-white/20 rounded-md p-3 text-white/90 text-[15px] outline-none min-h-[100px]"
                    placeholder="Nhập phân tích chuyên sâu..."
                  />
                ) : (
                  <p className="text-white/85 leading-relaxed text-[15px]">
                    {renderWithWikiLinks(activeEvent.advanced, activeEvent.wikiLinks)}
                  </p>
                )}
              </div>

              {/* Full Wiki Accordion */}
              {(editMode || (activeEvent.full_wiki && activeEvent.full_wiki !== activeEvent.advanced)) && (
                <div className="backdrop-blur-md bg-white/5 border border-yellow-400/25 shadow-glass rounded-xl overflow-hidden hover:border-yellow-400/50 transition-all duration-300">
                  <button
                    onClick={() => !editMode && setIsFullWikiOpen(!isFullWikiOpen)}
                    className={`w-full flex items-center justify-between px-5 py-3.5 bg-yellow-400/8 transition-colors ${editMode ? 'cursor-default' : 'hover:bg-yellow-400/15 cursor-pointer'}`}
                  >
                    <div className="flex items-center gap-2 flex-1">
                      <Database size={16} className="text-yellow-400 shrink-0" />
                      {editMode ? (
                        <input 
                          value={activeEvent.fullWikiTitle || 'Toàn văn tài liệu gốc (Big Data)'} 
                          onChange={(e) => handleInputChange('fullWikiTitle', e.target.value)}
                          className="bg-transparent border-b border-yellow-400/50 text-yellow-400 font-bold uppercase text-xs tracking-widest outline-none w-full"
                          onClick={(e) => e.stopPropagation()}
                        />
                      ) : (
                        <span className="font-heading font-bold text-yellow-400 text-xs uppercase tracking-widest">
                          {activeEvent.fullWikiTitle || 'Toàn văn tài liệu gốc (Big Data)'}
                        </span>
                      )}
                    </div>
                    {!editMode && (isFullWikiOpen
                      ? <ChevronUp size={18} className="text-yellow-400 shrink-0" />
                      : <ChevronDown size={18} className="text-yellow-400 shrink-0" />)}
                  </button>

                  {(editMode || isFullWikiOpen) && (
                    <div className="px-6 py-5 border-t border-yellow-400/15 bg-gray-900/60">
                      {editMode ? (
                        <textarea
                          value={activeEvent.full_wiki || ''}
                          onChange={(e) => handleInputChange('full_wiki', e.target.value)}
                          className="w-full bg-white/10 border border-white/20 rounded-md p-3 text-white/90 text-sm outline-none min-h-[200px]"
                          placeholder="Nhập toàn văn tài liệu gốc..."
                        />
                      ) : (
                        <p className="text-white/80 leading-loose text-sm text-justify whitespace-pre-wrap">
                          {renderWithWikiLinks(activeEvent.full_wiki, activeEvent.wikiLinks)}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 bg-black/40 border border-white/10 rounded-2xl p-8 flex items-center justify-center text-white/50 text-sm italic">
            Chưa chọn sự kiện hoặc chưa có sự kiện nào.
          </div>
        )}
      </div>
    </div>
  );
};

export default TimelineMaster;
