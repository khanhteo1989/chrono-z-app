import { useState, useEffect } from 'react';
import { Mail, Info, Send, Globe, Save, Edit3, X } from 'lucide-react';
import { aboutData as initialAboutData } from '../aboutData';

const About = () => {
  const [data, setData] = useState(initialAboutData);
  const [editedData, setEditedData] = useState(initialAboutData);
  const [editMode, setEditMode] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [pwdInput, setPwdInput] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Biến kiểm tra môi trường: true nếu đã build để đưa lên mạng, false nếu đang code (npm run dev)
  const isProduction = import.meta.env.PROD;

  useEffect(() => {
    if (!editMode) {
      setEditedData(data); // reset if exit edit mode without saving
    }
  }, [editMode, data]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditedData({ ...editedData, [name]: value });
  };

  const handleVerifyPwd = () => {
    if (pwdInput === "admin123") {
      setEditMode(true);
      setShowAuth(false);
      setPwdInput("");
    } else {
      alert("❌ Sai mật khẩu! Bạn không có quyền truy cập.");
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/save-about', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editedData)
      });
      if (response.ok) {
        setData(editedData);
        alert('Lưu thông tin thành công!');
        setEditMode(false);
      } else {
        alert('Lỗi khi lưu!');
      }
    } catch (error) {
      console.error(error);
      alert('Không thể kết nối đến server.');
    }
    setIsSaving(false);
  };

  return (
    <div className="p-8 h-full flex flex-col relative overflow-hidden">
      <div className="mb-8 z-10 flex justify-between items-start">
        <div>
          <h2 className="text-4xl font-heading font-bold text-blue-400 mb-2 flex items-center gap-3">
            <Info size={36} className="text-blue-400" />
            Thông tin dự án & Đóng góp ý kiến
            {editMode && <span className="text-sm bg-yellow-500/20 text-yellow-400 px-3 py-1 rounded-full border border-yellow-500/50">Edit Mode</span>}
          </h2>
          <p className="text-white/60">Tìm hiểu thêm về mục đích của dự án và liên hệ với tác giả.</p>
        </div>
        
        {!isProduction && (
          <div className="flex gap-2">
            {editMode ? (
              <>
                <button 
                  onClick={() => setEditMode(false)}
                  className="px-4 py-2 rounded-xl border border-white/20 text-white/70 hover:bg-white/10 hover:text-white transition-colors"
                >
                  Huỷ bỏ
                </button>
                <button 
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-xl font-bold transition-all"
                >
                  <Save size={18} /> {isSaving ? 'Đang lưu...' : 'Lưu Thay Đổi'}
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
                  className="bg-blue-400 text-black px-3 py-1 rounded-lg text-sm font-bold hover:bg-blue-500"
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
                className="px-4 py-2 rounded-xl border border-blue-400/50 text-blue-400 hover:bg-blue-400/10 text-sm font-bold flex items-center gap-2"
              >
                <Edit3 size={16} /> Bật Chỉnh Sửa
              </button>
            )}
          </div>
        )}
      </div>

      <div className="flex-1 flex gap-8 overflow-y-auto z-10 pb-12">
        {/* Cột trái: Mục đích dự án */}
        <div className="flex-1 flex flex-col gap-6">
          <div className="bg-black/40 border border-white/10 rounded-2xl p-8 backdrop-blur-xl">
            {editMode ? (
              <input
                type="text"
                name="missionTitle"
                value={editedData.missionTitle}
                onChange={handleChange}
                className="text-2xl font-heading font-bold text-white mb-4 border-b border-white/10 pb-4 w-full bg-transparent outline-none focus:border-yellow-400"
              />
            ) : (
              <h3 className="text-2xl font-heading font-bold text-white mb-4 border-b border-white/10 pb-4">
                {data.missionTitle}
              </h3>
            )}
            
            <div className="space-y-4 text-white/80 leading-relaxed whitespace-pre-line">
              {editMode ? (
                <textarea
                  name="missionContent"
                  value={editedData.missionContent}
                  onChange={handleChange}
                  className="w-full h-64 bg-black/50 border border-white/20 rounded-xl p-4 text-white focus:border-yellow-400 outline-none"
                />
              ) : (
                data.missionContent.split('\n\n').map((para, idx) => {
                  const formattedPara = para.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
                  return (
                    <p key={idx} dangerouslySetInnerHTML={{ __html: formattedPara }} />
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Cột right: Thông tin liên hệ */}
        <div className="w-1/3 flex flex-col gap-6">
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-2xl p-8 backdrop-blur-xl">
            <h3 className="text-xl font-heading font-bold text-blue-400 mb-6 flex items-center gap-2">
              <Mail size={24} /> Liên hệ & Đóng góp
            </h3>
            
            {editMode ? (
              <textarea
                name="contactMessage"
                value={editedData.contactMessage}
                onChange={handleChange}
                className="w-full h-32 bg-black/50 border border-white/20 rounded-xl p-4 text-sm text-white/70 mb-6 focus:border-yellow-400 outline-none"
              />
            ) : (
              <p className="text-sm text-white/70 mb-6 leading-relaxed">
                {data.contactMessage}
              </p>
            )}

            <div className="space-y-4">
              <a 
                href={`mailto:${data.email}?subject=Đóng góp ý kiến cho Chrono-Z`}
                className="flex items-center justify-center gap-2 w-full py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-bold transition-all shadow-lg shadow-blue-500/25"
              >
                <Send size={18} /> Gửi Email trực tiếp
              </a>

              <div className="border-t border-white/10 pt-4 mt-4">
                <p className="text-xs text-white/50 mb-3 uppercase tracking-widest font-bold">Hoặc liên hệ qua</p>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-white/80 hover:text-white transition-colors p-2 bg-white/5 rounded-lg border border-white/5 cursor-pointer">
                    <Globe size={20} className="text-blue-400 shrink-0" />
                    {editMode ? (
                      <input 
                        type="text"
                        name="facebook"
                        value={editedData.facebook}
                        onChange={handleChange}
                        className="bg-transparent border-b border-white/20 outline-none focus:border-yellow-400 text-sm w-full"
                      />
                    ) : (
                      <span className="text-sm break-words">{data.facebook}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-white/80 hover:text-white transition-colors p-2 bg-white/5 rounded-lg border border-white/5 cursor-pointer">
                    <Mail size={20} className="text-red-400 shrink-0" />
                    {editMode ? (
                      <input 
                        type="text"
                        name="email"
                        value={editedData.email}
                        onChange={handleChange}
                        className="bg-transparent border-b border-white/20 outline-none focus:border-yellow-400 text-sm w-full"
                      />
                    ) : (
                      <span className="text-sm break-words">{data.email}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-500/10 blur-[100px] rounded-full pointer-events-none"></div>
    </div>
  );
};

export default About;
