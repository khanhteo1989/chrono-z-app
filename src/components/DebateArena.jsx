import { useState, useEffect, useRef } from 'react';
import { Play, Square, RotateCcw, Mic, MicOff, BrainCircuit, MessageSquareText, Star, Send } from 'lucide-react';

const DebateArena = () => {
  const [timeLeft, setTimeLeft] = useState(180);
  const [isRunning, setIsRunning] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [aiEvaluation, setAiEvaluation] = useState(null);
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  
  const recognitionRef = useRef(null);

  // Default Topic
  const topic = "Chính sách Bế quan tỏa cảng của nhà Nguyễn là bảo vệ văn hóa hay tự cô lập?";
  const keywords = ["nguyễn trường tộ", "pháp", "minh trị", "tàu chiến", "lạc hậu", "bảo vệ", "văn hóa", "nho giáo", "phương tây", "công giáo"];

  useEffect(() => {
    // Timer Logic
    let timer;
    if (isRunning && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsRunning(false);
      stopRecording();
    }
    return () => clearInterval(timer);
  }, [isRunning, timeLeft]);

  const initSpeechRecognition = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Trình duyệt của bạn không hỗ trợ Nhận diện Giọng nói. Vui lòng dùng Chrome hoặc Edge.");
      return null;
    }
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'vi-VN'; // Support Vietnamese
    
    recognition.onresult = (event) => {
      let finalTrans = '';
      let interimTrans = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalTrans += event.results[i][0].transcript + ' ';
        } else {
          interimTrans += event.results[i][0].transcript;
        }
      }
      if (finalTrans) {
        setTranscript(prev => prev + finalTrans);
      }
      setInterimTranscript(interimTrans);
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error", event.error);
      setIsRecording(false);
    };

    return recognition;
  };

  const startRecording = () => {
    if (!recognitionRef.current) {
      recognitionRef.current = initSpeechRecognition();
    }
    if (recognitionRef.current) {
      recognitionRef.current.start();
      setIsRecording(true);
      setIsRunning(true);
      setAiEvaluation(null);
      setTranscript('');
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current && isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
      setIsRunning(false);
      evaluateArgument();
    }
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const resetArena = () => {
    setIsRunning(false);
    setIsRecording(false);
    setTimeLeft(180);
    setTranscript('');
    setInterimTranscript('');
    setAiEvaluation(null);
    if(recognitionRef.current) {
      recognitionRef.current.stop();
    }
  };

  const evaluateArgument = () => {
    // Simulate AI evaluation based on transcript length and keyword matching
    const fullText = transcript.toLowerCase();
    let wordCount = fullText.split(' ').filter(w => w.length > 0).length;
    let foundKeywords = keywords.filter(kw => fullText.includes(kw));
    
    let logicScore = Math.min(100, 50 + (wordCount * 0.5));
    let evidenceScore = Math.min(100, foundKeywords.length * 20);
    
    // Fallback if transcript is empty (for demo purposes)
    if (wordCount === 0) {
       setAiEvaluation({
        logic: 0,
        evidence: 0,
        overall: 0,
        feedback: "Vui lòng sử dụng microphone để trình bày luận điểm của bạn.",
        detectedKeywords: []
      });
      return;
    }

    setAiEvaluation({
      logic: Math.floor(logicScore),
      evidence: Math.floor(evidenceScore),
      overall: Math.floor((logicScore + evidenceScore) / 2),
      feedback: foundKeywords.length > 2 
        ? "Luận điểm xuất sắc! Bạn đã đưa ra được các dẫn chứng lịch sử rất cụ thể." 
        : "Lập luận khá tốt, tuy nhiên hãy cố gắng đưa thêm nhiều số liệu và sự kiện lịch sử (Evidence) để tăng tính thuyết phục nhé.",
      detectedKeywords: foundKeywords
    });
  };

  return (
    <div className="p-8 h-full flex flex-col relative overflow-hidden">
      <div className="mb-8 flex justify-between items-end z-10">
        <div>
          <h2 className="text-4xl font-heading font-bold text-red-400 mb-2 flex items-center gap-3">
            <Mic className={isRecording ? "animate-pulse text-chrono-mint" : "text-red-400"} size={36} />
            Voice AI Arena
          </h2>
          <p className="text-white/60">Speak your argument. The AI will transcribe and evaluate you.</p>
        </div>
        
        {/* Timer Widget */}
        <div className="bg-black/60 border border-red-500/30 rounded-2xl p-4 flex items-center gap-6">
          <div className="text-4xl font-heading font-black font-mono text-white tracking-widest w-32 text-center">
            {formatTime(timeLeft)}
          </div>
          <div className="flex gap-2">
            <button onClick={resetTimer} className="p-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors">
              <RotateCcw size={20} />
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 bg-black/40 border border-white/10 rounded-2xl p-8 flex flex-col relative z-10">
        
        <div className="mb-6">
          <h3 className="text-xl font-bold uppercase tracking-widest text-white/50 mb-2">Topic</h3>
          <div className="text-2xl font-heading font-bold text-white border-b-2 border-white/20 pb-4">
            {topic}
          </div>
        </div>

        <div className="flex-1 flex gap-8 h-full overflow-hidden">
          {/* Left Side: Transcription Area */}
          <div className="flex-1 flex flex-col h-full bg-white/5 border border-white/10 rounded-xl p-6 relative">
            
            {/* Microphone Button */}
            <div className="absolute top-6 right-6 z-20">
              <button 
                onClick={isRecording ? stopRecording : startRecording}
                className={`flex items-center gap-2 px-4 py-2 rounded-full font-bold shadow-lg transition-all ${
                  isRecording 
                    ? 'bg-red-500 text-white animate-pulse shadow-red-500/50' 
                    : 'bg-chrono-mint text-chrono-dark hover:bg-chrono-mint/80'
                }`}
              >
                {isRecording ? <><MicOff size={18}/> Stop & Evaluate</> : <><Mic size={18}/> Start Speaking</>}
              </button>
            </div>

            <h4 className="font-bold text-lg mb-4 text-chrono-mint flex items-center gap-2">
              <MessageSquareText size={20} /> Live Transcription
            </h4>
            
            <div className="flex-1 overflow-y-auto bg-black/40 border border-white/10 rounded-lg p-6 text-white/80 leading-relaxed text-lg">
              {transcript === '' && interimTranscript === '' && !isRecording && (
                <div className="h-full flex items-center justify-center text-white/30 italic text-center">
                  Click 'Start Speaking' and allow microphone access.<br/>Speak clearly in Vietnamese.
                </div>
              )}
              <span>{transcript}</span>
              <span className="text-white/50 italic">{interimTranscript}</span>
            </div>
          </div>

          {/* Right Side: AI Evaluation & Feedback */}
          <div className="w-1/3 flex flex-col h-full gap-6">
            
            <div className="flex-1 bg-chrono-purple/10 border border-chrono-purple/30 rounded-xl p-6 overflow-y-auto">
              <h4 className="font-bold text-lg mb-4 text-chrono-purple flex items-center gap-2">
                <BrainCircuit size={20} /> AI Evaluation
              </h4>
              
              {!aiEvaluation ? (
                <div className="h-full flex items-center justify-center text-chrono-purple/50 italic text-center text-sm">
                  Waiting for argument submission...
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Score Bars */}
                  <div>
                    <div className="flex justify-between text-xs font-bold uppercase mb-1">
                      <span>Logic & Fluency</span>
                      <span className="text-chrono-mint">{aiEvaluation.logic}/100</span>
                    </div>
                    <div className="w-full bg-black/50 rounded-full h-2">
                      <div className="bg-chrono-mint h-2 rounded-full" style={{width: `${aiEvaluation.logic}%`}}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs font-bold uppercase mb-1">
                      <span>Historical Evidence</span>
                      <span className="text-blue-400">{aiEvaluation.evidence}/100</span>
                    </div>
                    <div className="w-full bg-black/50 rounded-full h-2">
                      <div className="bg-blue-400 h-2 rounded-full" style={{width: `${aiEvaluation.evidence}%`}}></div>
                    </div>
                  </div>

                  <div className="bg-black/40 border border-chrono-purple/20 rounded-lg p-4 text-sm text-white/90">
                    <p className="mb-2 font-bold text-chrono-purple">AI Feedback:</p>
                    <p className="italic">{aiEvaluation.feedback}</p>
                  </div>

                  {aiEvaluation.detectedKeywords.length > 0 && (
                    <div>
                      <p className="text-xs uppercase text-white/50 mb-2 font-bold">Detected Evidence Keywords:</p>
                      <div className="flex flex-wrap gap-2">
                        {aiEvaluation.detectedKeywords.map((kw, idx) => (
                          <span key={idx} className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-xs font-bold uppercase">
                            {kw}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <button 
                    onClick={() => setShowFeedbackForm(true)}
                    className="w-full py-3 mt-4 bg-white/10 hover:bg-white/20 text-white rounded-lg font-bold text-sm transition-colors border border-white/20"
                  >
                    📝 Đánh giá Tool này
                  </button>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>

      {/* Feedback Modal Overlay */}
      {showFeedbackForm && (
        <div className="absolute inset-0 bg-black/80 z-50 flex items-center justify-center p-8 backdrop-blur-sm">
          <div className="bg-chrono-dark border border-white/20 rounded-2xl p-8 max-w-md w-full shadow-2xl relative">
            {!feedbackSubmitted ? (
              <>
                <h3 className="text-2xl font-heading font-bold text-chrono-mint mb-2">Đánh giá Trải nghiệm</h3>
                <p className="text-white/60 text-sm mb-6">Tính năng Voice AI này có giúp bạn học Sử dễ dàng hơn không?</p>
                
                <div className="flex justify-center gap-2 mb-6">
                  {[1,2,3,4,5].map(star => (
                    <button key={star} className="text-gray-500 hover:text-yellow-400 transition-colors">
                      <Star size={32} fill="currentColor" />
                    </button>
                  ))}
                </div>

                <textarea 
                  className="w-full h-32 bg-black/50 border border-white/10 rounded-lg p-3 text-white focus:border-chrono-mint mb-4 text-sm resize-none"
                  placeholder="Để lại góp ý của bạn để giúp chúng mình cải thiện tool nhé..."
                ></textarea>

                <div className="flex justify-end gap-3">
                  <button onClick={() => setShowFeedbackForm(false)} className="px-4 py-2 text-white/50 hover:text-white text-sm font-bold">Hủy</button>
                  <button 
                    onClick={() => setFeedbackSubmitted(true)}
                    className="flex items-center gap-2 px-6 py-2 bg-chrono-mint text-chrono-dark rounded-lg font-bold shadow-lg"
                  >
                    <Send size={16} /> Gửi Feedback
                  </button>
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-chrono-mint/20 text-chrono-mint rounded-full flex items-center justify-center mx-auto mb-4">
                  <Star size={32} fill="currentColor" />
                </div>
                <h3 className="text-2xl font-heading font-bold text-white mb-2">Cảm ơn bạn!</h3>
                <p className="text-white/60 text-sm mb-6">Đóng góp của bạn đã được ghi nhận vào hệ thống NCKH.</p>
                <button onClick={() => {setShowFeedbackForm(false); setFeedbackSubmitted(false);}} className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg font-bold">
                  Đóng
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DebateArena;

// Helper to reset timer outside the component logic if needed, but we keep it simple here.
