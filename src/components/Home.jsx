import { Clock, Users, BrainCircuit } from 'lucide-react';

const Home = ({ setActiveTab }) => {
  return (
    <div className="h-full flex flex-col items-center justify-center relative overflow-hidden p-8">
      {/* Nền trang chủ (Hiệu ứng phát sáng lớn hơn) */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-chrono-mint/10 via-chrono-purple/10 to-blue-500/10 blur-[150px] rounded-full pointer-events-none mix-blend-screen"></div>

      <div className="z-10 text-center max-w-4xl mx-auto flex flex-col items-center">
        <h1 className="text-7xl font-heading font-black text-transparent bg-clip-text bg-gradient-to-r from-chrono-mint via-blue-400 to-chrono-purple tracking-tighter mb-6 drop-shadow-[0_0_25px_rgba(0,245,212,0.5)]">
          CHRONO-Z
        </h1>
        <p className="text-xl text-white/80 font-body mb-12 max-w-2xl leading-relaxed">
          Chào mừng đến với nền tảng học Lịch sử thế hệ mới. Khám phá các dòng thời gian, tìm hiểu những nhân vật kiệt xuất và thử thách kiến thức của bạn trong Đấu trường!
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full mt-4">
          <button 
            onClick={() => setActiveTab('timeline')}
            className="group relative p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl hover:bg-chrono-mint/10 hover:border-chrono-mint/50 transition-all duration-300 shadow-[0_0_15px_rgba(0,0,0,0.5)] hover:shadow-[0_0_30px_rgba(0,245,212,0.3)] hover:-translate-y-2 flex flex-col items-center gap-4"
          >
            <div className="w-20 h-20 rounded-full bg-chrono-mint/20 flex items-center justify-center text-chrono-mint group-hover:scale-110 transition-transform duration-300">
              <Clock size={40} />
            </div>
            <h3 className="text-2xl font-heading font-bold text-white group-hover:text-chrono-mint transition-colors">
              Dòng Thời Gian
            </h3>
            <p className="text-white/50 text-sm">
              Theo dòng lịch sử với giao diện trực quan
            </p>
          </button>

          <button 
            onClick={() => setActiveTab('characters')}
            className="group relative p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl hover:bg-chrono-purple/10 hover:border-chrono-purple/50 transition-all duration-300 shadow-[0_0_15px_rgba(0,0,0,0.5)] hover:shadow-[0_0_30px_rgba(123,44,191,0.3)] hover:-translate-y-2 flex flex-col items-center gap-4"
          >
            <div className="w-20 h-20 rounded-full bg-chrono-purple/20 flex items-center justify-center text-chrono-purple group-hover:scale-110 transition-transform duration-300">
              <Users size={40} />
            </div>
            <h3 className="text-2xl font-heading font-bold text-white group-hover:text-chrono-purple transition-colors">
              Nhân Vật
            </h3>
            <p className="text-white/50 text-sm">
              Hệ thống thẻ bài thông tin sinh động
            </p>
          </button>

          <button 
            onClick={() => setActiveTab('quiz')}
            className="group relative p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl hover:bg-yellow-400/10 hover:border-yellow-400/50 transition-all duration-300 shadow-[0_0_15px_rgba(0,0,0,0.5)] hover:shadow-[0_0_30px_rgba(250,204,21,0.3)] hover:-translate-y-2 flex flex-col items-center gap-4"
          >
            <div className="w-20 h-20 rounded-full bg-yellow-400/20 flex items-center justify-center text-yellow-400 group-hover:scale-110 transition-transform duration-300">
              <BrainCircuit size={40} />
            </div>
            <h3 className="text-2xl font-heading font-bold text-white group-hover:text-yellow-400 transition-colors">
              Quiz Arena
            </h3>
            <p className="text-white/50 text-sm">
              Đấu trường đố vui để kiểm tra kiến thức
            </p>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Home;
