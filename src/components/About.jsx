import { Mail, Info, Send, Globe, MessageCircle } from 'lucide-react';

const About = () => {
  return (
    <div className="p-8 h-full flex flex-col relative overflow-hidden">
      <div className="mb-8 z-10">
        <h2 className="text-4xl font-heading font-bold text-blue-400 mb-2 flex items-center gap-3">
          <Info size={36} className="text-blue-400" />
          Thông tin dự án & Đóng góp ý kiến
        </h2>
        <p className="text-white/60">Tìm hiểu thêm về mục đích của dự án và liên hệ với tác giả.</p>
      </div>

      <div className="flex-1 flex gap-8 overflow-y-auto z-10 pb-12">
        {/* Cột trái: Mục đích dự án */}
        <div className="flex-1 flex flex-col gap-6">
          <div className="bg-black/40 border border-white/10 rounded-2xl p-8">
            <h3 className="text-2xl font-heading font-bold text-white mb-4 border-b border-white/10 pb-4">
              Mục đích của dự án
            </h3>
            <div className="space-y-4 text-white/80 leading-relaxed">
              <p>
                Dự án <strong>Chrono-Z</strong> được xây dựng với mong muốn mang đến một cách tiếp cận hoàn toàn mới mẻ và thú vị cho việc học Lịch sử.
              </p>
              <p>
                Thay vì những trang sách dài lê thê và khô khan, chúng mình số hoá các dữ kiện lịch sử thành các <strong>Dòng thời gian (Timeline)</strong> trực quan, các <strong>Thẻ bài Nhân vật (Character Hub)</strong> sinh động theo phong cách Gen-Z, và hệ thống <strong>Đấu trường Đố vui (Quiz Arena)</strong> để thử thách kiến thức.
              </p>
              <p>
                Mục tiêu cuối cùng là biến việc học Sử từ "bắt buộc" trở thành một trải nghiệm "khám phá" hấp dẫn, giúp các bạn trẻ Việt Nam hiểu rõ hơn về cội nguồn dân tộc cũng như các nền văn minh vĩ đại trên thế giới.
              </p>
            </div>
          </div>
        </div>

        {/* Cột right: Thông tin liên hệ */}
        <div className="w-1/3 flex flex-col gap-6">
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-2xl p-8">
            <h3 className="text-xl font-heading font-bold text-blue-400 mb-6 flex items-center gap-2">
              <Mail size={24} /> Liên hệ & Đóng góp
            </h3>
            
            <p className="text-sm text-white/70 mb-6 leading-relaxed">
              Dự án vẫn đang trong quá trình phát triển và hoàn thiện. Rất mong nhận được những ý kiến đóng góp quý báu từ bạn để dự án ngày càng tốt hơn!
            </p>

            <div className="space-y-4">
              {/* Form giả lập gửi mail (Dùng mailto) */}
              <a 
                href="mailto:contact@chronoz.example.com?subject=Đóng góp ý kiến cho Chrono-Z"
                className="flex items-center justify-center gap-2 w-full py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-bold transition-all shadow-lg shadow-blue-500/25"
              >
                <Send size={18} /> Gửi Email trực tiếp
              </a>

              <div className="border-t border-white/10 pt-4 mt-4">
                <p className="text-xs text-white/50 mb-3 uppercase tracking-widest font-bold">Hoặc liên hệ qua</p>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-white/80 hover:text-white transition-colors p-2 bg-white/5 rounded-lg border border-white/5 cursor-pointer">
                    <Globe size={20} className="text-blue-400" />
                    <span className="text-sm">Link Facebook (Bạn hãy sửa)</span>
                  </div>
                  <div className="flex items-center gap-3 text-white/80 hover:text-white transition-colors p-2 bg-white/5 rounded-lg border border-white/5 cursor-pointer">
                    <Mail size={20} className="text-red-400" />
                    <span className="text-sm">emailcuaban@gmail.com</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Decorative background element */}
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-500/10 blur-[100px] rounded-full pointer-events-none"></div>
    </div>
  );
};

export default About;
