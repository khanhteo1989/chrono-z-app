import { useState } from 'react'
import { Clock, Users, BrainCircuit, Info } from 'lucide-react'
import TimelineMaster from './components/TimelineMaster'
import CharacterHub from './components/CharacterHub'
import QuizArena from './components/QuizArena'
import About from './components/About'

function App() {
  const [activeTab, setActiveTab] = useState('quiz')

  return (
    <div className="flex h-screen bg-chrono-dark text-white font-body overflow-hidden relative">
      {/* Nền Cyberpunk (Glowing Orbs) */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-chrono-mint/20 rounded-full blur-[150px] pointer-events-none mix-blend-screen"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-chrono-purple/20 rounded-full blur-[150px] pointer-events-none mix-blend-screen"></div>
      <div className="absolute top-[40%] right-[20%] w-[30%] h-[30%] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none mix-blend-screen"></div>

      {/* Sidebar */}
      <aside className="w-72 backdrop-blur-xl bg-white/5 border-r border-white/10 shadow-[4px_0_24px_rgba(0,0,0,0.5)] flex flex-col z-50 relative">
        <div className="p-6">
          <h1 className="text-3xl font-heading font-black text-transparent bg-clip-text bg-gradient-to-r from-chrono-mint to-chrono-purple tracking-tighter">
            CHRONO-Z
          </h1>
          <p className="text-[10px] text-white/50 mt-1 uppercase tracking-[0.2em] font-bold">Digital Toolkit</p>
        </div>
        
        <nav className="flex-1 px-4 space-y-3 mt-8">
          <button 
            onClick={() => setActiveTab('timeline')}
            className={`w-full flex items-center gap-4 px-5 py-4 rounded-xl transition-all duration-300 ${activeTab === 'timeline' ? 'bg-chrono-mint/10 text-chrono-mint border border-chrono-mint/50 shadow-neon-mint scale-[1.02]' : 'text-white/60 hover:bg-white/10 hover:text-white border border-transparent hover:border-white/10'}`}
          >
            <Clock size={20} className={activeTab === 'timeline' ? 'animate-pulse' : ''} />
            <span className="font-heading font-semibold tracking-wide">Timeline</span>
          </button>
          
          <button 
            onClick={() => setActiveTab('characters')}
            className={`w-full flex items-center gap-4 px-5 py-4 rounded-xl transition-all duration-300 ${activeTab === 'characters' ? 'bg-chrono-purple/10 text-chrono-purple border border-chrono-purple/50 shadow-neon-purple scale-[1.02]' : 'text-white/60 hover:bg-white/10 hover:text-white border border-transparent hover:border-white/10'}`}
          >
            <Users size={20} className={activeTab === 'characters' ? 'animate-pulse' : ''} />
            <span className="font-heading font-semibold tracking-wide">Characters</span>
          </button>
          
          <button 
            onClick={() => setActiveTab('quiz')}
            className={`w-full flex items-center gap-4 px-5 py-4 rounded-xl transition-all duration-300 ${activeTab === 'quiz' ? 'bg-yellow-400/10 text-yellow-400 border border-yellow-400/50 shadow-[0_0_15px_rgba(250,204,21,0.5)] scale-[1.02]' : 'text-white/60 hover:bg-white/10 hover:text-white border border-transparent hover:border-white/10'}`}
          >
            <BrainCircuit size={20} className={activeTab === 'quiz' ? 'animate-pulse' : ''} />
            <span className="font-heading font-semibold tracking-wide">Quiz Arena</span>
          </button>

          <button 
            onClick={() => setActiveTab('about')}
            className={`w-full flex items-center gap-4 px-5 py-4 rounded-xl transition-all duration-300 ${activeTab === 'about' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/50 shadow-neon-blue scale-[1.02]' : 'text-white/60 hover:bg-white/10 hover:text-white border border-transparent hover:border-white/10'}`}
          >
            <Info size={20} className={activeTab === 'about' ? 'animate-pulse' : ''} />
            <span className="font-heading font-semibold tracking-wide">Đóng góp ý kiến</span>
          </button>
        </nav>


      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto relative">
        {/* Subtle grid background */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wNSkiLz48L3N2Zz4=')] pointer-events-none opacity-50"></div>
        
        <div className="relative z-10 h-full">
          {activeTab === 'timeline' && <TimelineMaster />}
          {activeTab === 'characters' && <CharacterHub />}
          {activeTab === 'quiz' && <QuizArena />}
          {activeTab === 'about' && <About />}
        </div>
      </main>
    </div>
  )
}

export default App
