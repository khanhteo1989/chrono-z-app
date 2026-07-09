import { useState, useEffect } from 'react';
import { quizData, generateDynamicQuizzes } from '../quizData';
import { autoTimelineData } from '../scannedData';
import { Play, CheckCircle2, XCircle, BrainCircuit, RefreshCw } from 'lucide-react';

const QuizArena = () => {
  const [questions, setQuestions] = useState([]);
  const [currentAnswers, setCurrentAnswers] = useState({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [examCode, setExamCode] = useState(0);

  // Function to shuffle an array
  const shuffleArray = (array) => {
    let shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  const startQuiz = () => {
    // Sinh câu hỏi động từ dữ liệu dòng thời gian
    const dynamicQuizzes = generateDynamicQuizzes(autoTimelineData);
    
    // Gộp câu hỏi tĩnh và câu hỏi động
    const fullBank = [...quizData, ...dynamicQuizzes];

    // Chọn ngẫu nhiên 12 câu hỏi từ kho
    const shuffledBank = shuffleArray(fullBank).slice(0, 12);
    
    // Trộn đáp án cho mỗi câu
    const processedQuestions = shuffledBank.map(q => ({
      ...q,
      options: shuffleArray(q.options)
    }));
    
    setQuestions(processedQuestions);
    setCurrentAnswers({});
    setIsSubmitted(false);
    setScore(0);
    setExamCode(Math.floor(1000 + Math.random() * 9000));
  };

  useEffect(() => {
    startQuiz();
  }, []);

  const handleSelectOption = (questionId, option) => {
    if (isSubmitted) return;
    setCurrentAnswers(prev => ({
      ...prev,
      [questionId]: option
    }));
  };

  const handleSubmit = () => {
    let newScore = 0;
    questions.forEach(q => {
      if (currentAnswers[q.id] === q.answer) {
        newScore += 1;
      }
    });
    setScore(newScore);
    setIsSubmitted(true);
  };

  const getEvaluation = (score, total) => {
    const percentage = score / total;
    if (percentage >= 0.8) return "Xuất sắc! Kiến thức lịch sử của bạn cực kỳ vững vàng.";
    if (percentage >= 0.5) return "Khá tốt! Bạn đã nắm được những sự kiện cốt lõi, tuy nhiên cần ôn tập thêm phần phân tích.";
    return "Bạn cần cố gắng hơn nhé! Đừng lo, hãy đọc phần Giải thích chi tiết để hiểu sâu hơn về bản chất vấn đề.";
  };

  return (
    <div className="p-8 h-full flex flex-col relative overflow-hidden">
      <div className="mb-8 flex justify-between items-end z-10">
        <div>
          <h2 className="text-4xl font-heading font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500 mb-2 flex items-center gap-3 flex-wrap drop-shadow-[0_0_15px_rgba(250,204,21,0.5)]">
            <BrainCircuit size={36} className="text-yellow-400" />
            Quiz Arena
            {examCode > 0 && (
              <span className="text-sm bg-yellow-400/20 text-yellow-400 px-3 py-1 rounded-full border border-yellow-400/50 shadow-[0_0_10px_rgba(250,204,21,0.3)]">
                Mã đề: #{examCode}
              </span>
            )}
          </h2>
          <p className="text-white/60">Bài thi gồm {questions.length} câu hỏi ngẫu nhiên. Trả lời để kiểm tra kiến thức và nhận giải thích chi tiết.</p>
        </div>
        
        {isSubmitted && (
          <button 
            onClick={startQuiz}
            className="flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold transition-colors border border-white/20 shadow-lg"
          >
            <RefreshCw size={20} /> Thi lại (Đề mới)
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto pr-4 z-10 space-y-6">
        {isSubmitted && (
          <div className="bg-yellow-400/10 border border-yellow-400/30 rounded-2xl p-8 text-center mb-8">
            <h3 className="text-xl text-yellow-400 font-bold uppercase tracking-widest mb-2">Kết quả của bạn</h3>
            <div className="text-6xl font-heading font-black text-white mb-4">
              {score} <span className="text-3xl text-white/50">/ {questions.length}</span>
            </div>
            <p className="text-lg text-white/80 max-w-2xl mx-auto italic">
              {getEvaluation(score, questions.length)}
            </p>
          </div>
        )}

        <div className="space-y-8 pb-12">
          {questions.map((q, index) => {
            const selectedOption = currentAnswers[q.id];
            const isCorrect = selectedOption === q.answer;
            const hasAnswered = selectedOption !== undefined;

            return (
              <div key={q.id} className={`backdrop-blur-md bg-white/5 border rounded-2xl p-6 transition-all duration-300 shadow-glass ${
                isSubmitted 
                  ? (isCorrect ? 'border-green-500/50 bg-green-500/10 shadow-[0_0_20px_rgba(34,197,94,0.2)]' : 'border-red-500/50 bg-red-500/10 shadow-[0_0_20px_rgba(239,68,68,0.2)]')
                  : 'border-white/10 hover:border-white/30 hover:bg-white/10'
              }`}>
                <h4 className="text-xl font-heading font-bold text-white mb-4 flex gap-3">
                  <span className="text-yellow-400">Câu {index + 1}:</span>
                  <span>{q.question}</span>
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {q.options.map((opt, i) => {
                    let optionStyle = "bg-white/5 border-white/10 text-white/80 hover:bg-white/10 hover:border-white/30";
                    
                    if (isSubmitted) {
                      if (opt === q.answer) {
                        optionStyle = "bg-green-500/20 border-green-500 text-green-400 font-bold shadow-[0_0_15px_rgba(34,197,94,0.3)]";
                      } else if (opt === selectedOption && !isCorrect) {
                        optionStyle = "bg-red-500/20 border-red-500 text-red-400/50 line-through";
                      } else {
                        optionStyle = "bg-white/5 border-transparent text-white/30";
                      }
                    } else if (opt === selectedOption) {
                      optionStyle = "bg-yellow-400/20 border-yellow-400 text-yellow-400 font-bold shadow-[0_0_15px_rgba(250,204,21,0.5)] scale-[1.02]";
                    }

                    return (
                      <button
                        key={i}
                        onClick={() => handleSelectOption(q.id, opt)}
                        disabled={isSubmitted}
                        className={`text-left p-4 rounded-xl border transition-all ${optionStyle}`}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>

                {isSubmitted && (
                  <div className="mt-6 p-4 bg-black/40 backdrop-blur-md rounded-xl border border-white/10 shadow-inner">
                    <div className="flex items-center gap-2 mb-2">
                      {isCorrect ? (
                        <CheckCircle2 className="text-green-400" size={20} />
                      ) : (
                        <XCircle className="text-red-400" size={20} />
                      )}
                      <span className="font-bold uppercase text-xs tracking-wider text-white/50">
                        Giải thích chi tiết (Explanation)
                      </span>
                    </div>
                    <p className="text-white/90 text-sm leading-relaxed">{q.explanation}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {!isSubmitted && (
        <div className="mt-4 pt-4 border-t border-white/10 flex justify-end z-20">
          <button 
            onClick={handleSubmit}
            disabled={Object.keys(currentAnswers).length < questions.length}
            className={`flex items-center gap-2 px-8 py-4 rounded-xl font-bold transition-all shadow-lg text-lg
              ${Object.keys(currentAnswers).length < questions.length 
                ? 'bg-white/10 text-white/30 cursor-not-allowed' 
                : 'bg-yellow-400 text-chrono-dark hover:bg-yellow-500 shadow-[0_0_20px_rgba(250,204,21,0.5)] scale-105'
              }`}
          >
            <Play size={20} /> Nộp bài & Xem đánh giá
          </button>
        </div>
      )}

      {/* Decorative background element */}
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-yellow-400/10 blur-[100px] rounded-full pointer-events-none"></div>
    </div>
  );
};

export default QuizArena;
