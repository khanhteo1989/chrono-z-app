import { useState, useMemo } from 'react';
import { characterData } from '../data';
import { wikiData } from '../wikiData';
import { Shield, Zap, Target, BookOpen, Edit3, X, Save, PlusCircle, Image as ImageIcon, Trash2 } from 'lucide-react';

const CharacterCard = ({ char, editMode, onUpdate, onDelete }) => {
  const [isHovered, setIsHovered] = useState(false);
  const deepData = char.wikiId ? wikiData[char.wikiId] : null;

  // Xử lý upload ảnh
  const handleImageDrop = async (e) => {
    if (!editMode) return;
    e.preventDefault();
    const file = e.dataTransfer?.files[0] || e.target?.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64 = event.target.result;
        try {
          const res = await fetch('/api/upload', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fileName: file.name, base64 })
          });
          const data = await res.json();
          if (data.success) {
            onUpdate(char.id, 'imageUrl', data.url);
          }
        } catch (error) {
          console.error("Lỗi upload ảnh:", error);
          alert("Lỗi upload ảnh, xem console!");
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleChange = (field, value) => {
    onUpdate(char.id, field, value);
  };

  return (
    <div 
      className="relative group perspective-1000 h-[500px]"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className={`w-full h-full bg-black/50 border-2 border-white/10 rounded-2xl p-6 flex flex-col relative overflow-hidden transition-all duration-500 ${isHovered && !editMode ? 'border-yellow-400/50 shadow-[0_0_30px_rgba(250,204,21,0.2)]' : 'hover:border-chrono-purple/50'}`}>
        
        {/* Background Glow */}
        <div className={`absolute -top-20 -right-20 w-48 h-48 rounded-full blur-3xl opacity-20 ${char.color}`}></div>
        
        {/* Image / Dropzone */}
        {char.imageUrl && !editMode && (
          <img src={char.imageUrl} alt={char.name} className="absolute inset-0 w-full h-full object-cover opacity-30 mix-blend-overlay pointer-events-none" />
        )}
        
        {editMode && (
          <div 
            className="absolute inset-0 z-0 bg-black/50 flex flex-col items-center justify-center opacity-0 hover:opacity-100 transition-opacity cursor-pointer border-2 border-dashed border-white/30 m-2 rounded-xl"
            onDragOver={e => e.preventDefault()}
            onDrop={handleImageDrop}
            onClick={() => document.getElementById(`upload-${char.id}`).click()}
          >
            <ImageIcon size={32} className="text-white/50 mb-2" />
            <span className="text-white/50 text-sm font-bold">Kéo ảnh vào đây</span>
            <input 
              type="file" 
              id={`upload-${char.id}`} 
              className="hidden" 
              accept="image/*" 
              onChange={handleImageDrop} 
            />
          </div>
        )}
        
        {/* Front Content */}
        <div className={`flex flex-col h-full transition-opacity duration-300 ${isHovered && deepData && !editMode ? 'opacity-10 blur-sm' : 'opacity-100'} z-10 relative pointer-events-none`}>
          <div className="flex justify-between items-start mb-4">
            <div className="px-3 py-1 bg-white/10 rounded-full text-xs font-bold uppercase tracking-widest pointer-events-auto">
              Nhân vật {char.id.toString().padStart(3, '0')}
            </div>
            {editMode && (
              <button 
                onClick={(e) => { e.stopPropagation(); onDelete(char.id); }}
                className="text-red-400 hover:text-red-300 pointer-events-auto p-1.5 bg-black/50 rounded-full"
                title="Xóa Thẻ Bài"
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>

          <div className="text-center mb-4 pointer-events-auto">
            {editMode ? (
              <>
                <input 
                  value={char.name} 
                  onChange={e => handleChange('name', e.target.value)}
                  className="text-2xl font-heading font-black text-white mb-1 uppercase bg-transparent border-b border-white/30 text-center w-full outline-none"
                  placeholder="Tên nhân vật"
                />
                <input 
                  value={char.title} 
                  onChange={e => handleChange('title', e.target.value)}
                  className="text-chrono-mint font-medium tracking-wide bg-transparent border-b border-white/30 text-center w-full outline-none text-sm"
                  placeholder="Danh xưng / Title"
                />
              </>
            ) : (
              <>
                <h3 className="text-3xl font-heading font-black text-white mb-1 uppercase drop-shadow-md">{char.name}</h3>
                <p className="text-chrono-mint font-medium tracking-wide drop-shadow-md">{char.title}</p>
              </>
            )}
          </div>

          <div className="bg-white/5 rounded-xl p-3 mb-3 flex-1 pointer-events-auto flex flex-col justify-center">
            {editMode ? (
              <textarea 
                value={char.quote} 
                onChange={e => handleChange('quote', e.target.value)}
                className="text-sm text-white/90 italic bg-transparent border border-white/20 rounded p-2 w-full outline-none h-16 resize-none custom-scrollbar"
                placeholder="Câu nói / Quote"
              />
            ) : (
              <p className="text-sm text-white/90 italic text-center drop-shadow-md">"{char.quote}"</p>
            )}
          </div>

          <div className="space-y-2 pointer-events-auto mb-4">
            <div>
              <div className="text-[10px] uppercase text-white/70 mb-1 font-bold">Lý tưởng (Motivation)</div>
              {editMode ? (
                <input 
                  value={char.motivation} 
                  onChange={e => handleChange('motivation', e.target.value)}
                  className="text-xs bg-black/50 border border-white/20 rounded px-2 py-1 w-full outline-none text-white/90"
                  placeholder="Động lực"
                />
              ) : (
                <div className="text-xs text-white/90 leading-tight drop-shadow-md">{char.motivation}</div>
              )}
            </div>
            <div>
              <div className="text-[10px] uppercase text-chrono-purple font-bold mb-1">Gen Z Vibe</div>
              {editMode ? (
                <input 
                  value={char.modernLink} 
                  onChange={e => handleChange('modernLink', e.target.value)}
                  className="text-xs font-medium bg-black/50 border border-chrono-purple/50 rounded px-2 py-1 w-full outline-none text-white/90"
                  placeholder="Liên hệ hiện đại"
                />
              ) : (
                <div className="text-xs font-medium text-white/90 leading-tight drop-shadow-md">{char.modernLink}</div>
              )}
            </div>
          </div>

          {/* Stats Bar */}
          <div className="mt-auto pt-3 border-t border-white/20 flex justify-between pointer-events-auto">
            <div className="text-center w-1/3">
              <div className="flex items-center justify-center gap-1 text-blue-400 mb-1 text-[10px] font-bold"><Zap size={12}/> INT</div>
              {editMode ? (
                <input type="number" value={char.stats.int} onChange={e => handleChange('stats', {...char.stats, int: Number(e.target.value)})} className="w-10 bg-transparent text-center font-heading font-bold outline-none border-b border-white/30"/>
              ) : (
                <div className="font-heading font-bold drop-shadow-md">{char.stats.int}</div>
              )}
            </div>
            <div className="text-center w-1/3 border-l border-white/20">
              <div className="flex items-center justify-center gap-1 text-red-400 mb-1 text-[10px] font-bold"><Shield size={12}/> LDR</div>
              {editMode ? (
                <input type="number" value={char.stats.ldr} onChange={e => handleChange('stats', {...char.stats, ldr: Number(e.target.value)})} className="w-10 bg-transparent text-center font-heading font-bold outline-none border-b border-white/30"/>
              ) : (
                <div className="font-heading font-bold drop-shadow-md">{char.stats.ldr}</div>
              )}
            </div>
            <div className="text-center w-1/3 border-l border-white/20">
              <div className="flex items-center justify-center gap-1 text-chrono-mint mb-1 text-[10px] font-bold"><Target size={12}/> VIS</div>
              {editMode ? (
                <input type="number" value={char.stats.vis} onChange={e => handleChange('stats', {...char.stats, vis: Number(e.target.value)})} className="w-10 bg-transparent text-center font-heading font-bold outline-none border-b border-white/30"/>
              ) : (
                <div className="font-heading font-bold drop-shadow-md">{char.stats.vis}</div>
              )}
            </div>
          </div>
        </div>

        {/* Big Data Overlay (Shows on Hover, disabled in editMode) */}
        {isHovered && deepData && !editMode && (
          <div className="absolute inset-0 bg-gray-900/95 backdrop-blur-md p-6 z-20 flex flex-col animate-in fade-in zoom-in-95 duration-200">
            <h4 className="text-lg font-bold text-white mb-2">{deepData.title}</h4>
            <p className="text-white/80 leading-relaxed text-sm overflow-y-auto pr-2 custom-scrollbar">
              {deepData.content}
            </p>
            <div className="mt-auto pt-4 text-center">
              <span className="text-[10px] uppercase tracking-widest text-white/30">Dữ liệu trích xuất từ SGK</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const CharacterHub = () => {
  const [events, setEvents] = useState(characterData);
  const [activeTab, setActiveTab] = useState('vietnam');
  const [editMode, setEditMode] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [pwdInput, setPwdInput] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const isProduction = import.meta.env.PROD;

  const filteredEvents = useMemo(() => {
    return events.filter(item => item.category === activeTab);
  }, [events, activeTab]);

  const handleVerifyPwd = () => {
    if (pwdInput === "admin123") {
      setEditMode(true);
      setShowAuth(false);
      setPwdInput("");
    } else {
      alert("❌ Sai mật khẩu!");
    }
  };

  const handleUpdate = (id, field, value) => {
    setEvents(prev => prev.map(e => e.id === id ? { ...e, [field]: value } : e));
  };

  const handleDelete = (id) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa nhân vật này?")) {
      setEvents(prev => prev.filter(e => e.id !== id));
    }
  };

  const handleAddNew = () => {
    const newId = Math.max(0, ...events.map(e => e.id)) + 1;
    const newChar = {
      id: newId,
      name: "Nhân vật mới",
      title: "Chức danh",
      motivation: "Lý tưởng của nhân vật",
      quote: "Câu nói nổi tiếng",
      modernLink: "Liên hệ Gen Z",
      wikiId: "",
      stats: { int: 50, ldr: 50, vis: 50 },
      color: "bg-gray-500",
      category: activeTab,
      imageUrl: ""
    };
    setEvents([...events, newChar]);
  };

  const handleSaveData = async () => {
    setIsSaving(true);
    try {
      const res = await fetch('/api/save-characters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(events)
      });
      const data = await res.json();
      if (data.success) {
        alert("✅ Đã lưu dữ liệu nhân vật thành công!");
        setEditMode(false);
      } else {
        alert("❌ Lỗi: " + data.error);
      }
    } catch (error) {
      alert("❌ Có lỗi xảy ra khi gọi API Save!");
      console.error(error);
    }
    setIsSaving(false);
  };

  return (
    <div className="p-8 h-full flex flex-col">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h2 className="text-4xl font-heading font-bold text-chrono-purple mb-2">Thẻ Bài Nhân Vật (Agents)</h2>
          <p className="text-white/60">Hover vào thẻ bài để đọc Wiki. Bật Edit Mode để chỉnh sửa thẻ bài.</p>
        </div>

        {/* Nút bật/tắt Edit Mode */}
        {!isProduction && (
          <div className="flex items-center gap-3">
            {editMode && (
              <button 
                onClick={handleAddNew}
                className="flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm bg-yellow-500 text-black hover:bg-yellow-400 transition-all shadow-[0_0_15px_rgba(234,179,8,0.3)]"
              >
                <PlusCircle size={16} /> Thêm Thẻ Bài
              </button>
            )}

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
                  {isSaving ? 'Đang lưu...' : 'Lưu'}
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
                <button onClick={handleVerifyPwd} className="bg-chrono-mint text-black px-3 py-1 rounded-lg text-sm font-bold">OK</button>
                <button onClick={() => setShowAuth(false)} className="text-white/50 hover:text-white px-2"><X size={16} /></button>
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

      {/* TABS */}
      <div className="flex gap-4 mb-6 border-b border-white/10 pb-4">
        <button 
          onClick={() => setActiveTab('vietnam')}
          className={`px-6 py-2 rounded-xl font-bold uppercase text-sm tracking-wider transition-all duration-300 ${activeTab === 'vietnam' ? 'bg-chrono-mint text-black shadow-[0_0_20px_rgba(0,245,212,0.4)]' : 'bg-white/5 text-white/50 hover:bg-white/10'}`}
        >
          Lịch sử Việt Nam
        </button>
        <button 
          onClick={() => setActiveTab('world')}
          className={`px-6 py-2 rounded-xl font-bold uppercase text-sm tracking-wider transition-all duration-300 ${activeTab === 'world' ? 'bg-chrono-purple text-white shadow-[0_0_20px_rgba(164,118,255,0.4)]' : 'bg-white/5 text-white/50 hover:bg-white/10'}`}
        >
          Lịch sử Thế Giới
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 overflow-y-auto pb-8 custom-scrollbar">
        {filteredEvents.map(char => (
          <CharacterCard 
            key={char.id} 
            char={char} 
            editMode={editMode} 
            onUpdate={handleUpdate} 
            onDelete={handleDelete}
          />
        ))}
        {filteredEvents.length === 0 && (
          <div className="col-span-full py-12 text-center text-white/40 italic">
            Chưa có thẻ bài nào trong mục này. {editMode && "Hãy bấm '+ Thêm Thẻ Bài'."}
          </div>
        )}
      </div>
    </div>
  );
};

export default CharacterHub;
