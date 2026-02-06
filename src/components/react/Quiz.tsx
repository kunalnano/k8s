import { useState, useEffect, useCallback } from "react";
import { quizQuestions } from "../../data/quiz-questions";
import type { QuizQuestion } from "../../data/types";

type Difficulty = "beginner" | "intermediate" | "advanced";

interface QuizAttempt {
  difficulty: Difficulty;
  score: number;
  total: number;
  percentage: number;
  date: string;
}

const HISTORY_KEY = "k8s-quiz-history";
const MAX_HISTORY = 10;

function loadHistory(): QuizAttempt[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.slice(0, MAX_HISTORY) : [];
  } catch {
    return [];
  }
}

function saveHistory(history: QuizAttempt[]) {
  localStorage.setItem(
    HISTORY_KEY,
    JSON.stringify(history.slice(0, MAX_HISTORY)),
  );
}

const DIFFICULTY_STYLES: Record<Difficulty, { active: string; badge: string }> =
  {
    beginner: {
      active: "bg-blue-600 text-white",
      badge: "bg-blue-600/20 text-blue-400",
    },
    intermediate: {
      active: "bg-yellow-600 text-white",
      badge: "bg-yellow-600/20 text-yellow-400",
    },
    advanced: {
      active: "bg-red-600 text-white",
      badge: "bg-red-600/20 text-red-400",
    },
  };

export default function Quiz() {
  const [difficulty, setDifficulty] = useState<Difficulty>("beginner");
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [history, setHistory] = useState<QuizAttempt[]>([]);

  useEffect(() => {
    setHistory(loadHistory());
  }, []);

  const questions: QuizQuestion[] = quizQuestions[difficulty];
  const total = questions.length;

  const changeDifficulty = useCallback((d: Difficulty) => {
    setDifficulty(d);
    setCurrentQuestion(0);
    setScore(0);
    setSelectedAnswer(null);
    setShowResult(false);
  }, []);

  const handleAnswer = useCallback(
    (index: number) => {
      if (selectedAnswer !== null) return;
      setSelectedAnswer(index);

      const isCorrect = index === questions[currentQuestion].correct;
      const newScore = isCorrect ? score + 1 : score;
      if (isCorrect) setScore(newScore);

      setTimeout(() => {
        if (currentQuestion + 1 < total) {
          setCurrentQuestion((q) => q + 1);
          setSelectedAnswer(null);
        } else {
          // Quiz complete - save to history
          const attempt: QuizAttempt = {
            difficulty,
            score: newScore,
            total,
            percentage: Math.round((newScore / total) * 100),
            date: new Date().toISOString(),
          };
          const updatedHistory = [attempt, ...history].slice(0, MAX_HISTORY);
          setHistory(updatedHistory);
          saveHistory(updatedHistory);
          setShowResult(true);
        }
      }, 1500);
    },
    [
      selectedAnswer,
      currentQuestion,
      total,
      score,
      difficulty,
      history,
      questions,
    ],
  );

  const restartQuiz = useCallback(() => {
    setCurrentQuestion(0);
    setScore(0);
    setSelectedAnswer(null);
    setShowResult(false);
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
    localStorage.removeItem(HISTORY_KEY);
  }, []);

  const percentage = total > 0 ? Math.round((score / total) * 100) : 0;

  const progressColor =
    percentage >= 80
      ? "bg-emerald-500"
      : percentage >= 50
        ? "bg-yellow-500"
        : "bg-red-500";

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center mb-6">
        <h2 className="text-xl sm:text-2xl font-bold mb-1 text-white">
          Knowledge Check
        </h2>
        <p className="text-slate-400 text-xs sm:text-sm">
          Test your K8s internals understanding
        </p>
      </div>

      {/* Difficulty Selection */}
      <div className="flex gap-2 justify-center mb-6">
        {(["beginner", "intermediate", "advanced"] as Difficulty[]).map(
          (level) => (
            <button
              key={level}
              onClick={() => changeDifficulty(level)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                difficulty === level
                  ? `${DIFFICULTY_STYLES[level].active} border-b-2 border-b-current`
                  : "bg-slate-800 text-slate-400 hover:bg-slate-700"
              }`}
            >
              {level.charAt(0).toUpperCase() + level.slice(1)}
              <span className="ml-1.5 text-xs opacity-70">
                ({quizQuestions[level].length}Q)
              </span>
            </button>
          ),
        )}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Quiz Area */}
        <div className="lg:col-span-2">
          {!showResult ? (
            <div className="bg-slate-900 rounded-xl border border-slate-800 p-4 sm:p-6">
              {/* Question transition wrapper */}
              <div key={currentQuestion} className="animate-fade-in-up">
                {/* Progress */}
                <div className="flex justify-between items-center mb-4">
                  <span className="text-xs font-bold text-slate-500 uppercase">
                    Q {currentQuestion + 1}/{total}
                  </span>
                  <span className="text-sm font-bold text-emerald-500">
                    Score: {score}
                  </span>
                </div>

                {/* Question */}
                <h3 className="text-base sm:text-lg font-bold mb-5 text-white">
                  {questions[currentQuestion].q}
                </h3>

                {/* Answer Options */}
                <div className="space-y-2">
                  {questions[currentQuestion].options.map((option, index) => {
                    const isSelected = selectedAnswer === index;
                    const isCorrect =
                      index === questions[currentQuestion].correct;
                    const showCorrectness = selectedAnswer !== null;

                    let cardClass =
                      "bg-slate-800 border-slate-700 hover:bg-slate-700 hover:translate-x-1 cursor-pointer";
                    let extraClass = "";
                    if (showCorrectness) {
                      if (isCorrect) {
                        cardClass =
                          "bg-emerald-600/20 border-emerald-500 cursor-default";
                        extraClass = "animate-scale-pop";
                      } else if (isSelected && !isCorrect) {
                        cardClass =
                          "bg-red-600/20 border-red-500 border-l-4 border-l-red-500 cursor-default";
                      } else {
                        cardClass =
                          "opacity-40 bg-slate-800 border-slate-700 cursor-default";
                      }
                    }

                    return (
                      <button
                        key={index}
                        onClick={() => handleAnswer(index)}
                        disabled={showCorrectness}
                        className={`w-full text-left p-3 sm:p-4 rounded-lg border transition-all text-sm ${cardClass} ${extraClass}`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-white">{option}</span>
                          {showCorrectness && isCorrect && (
                            <span className="text-emerald-500 font-bold ml-2">
                              Correct
                            </span>
                          )}
                          {showCorrectness && isSelected && !isCorrect && (
                            <span className="text-red-500 font-bold ml-2">
                              Wrong
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            /* Results Screen */
            <div className="bg-slate-900 rounded-xl border border-slate-800 p-6 text-center animate-scale-pop">
              <h3 className="text-xl font-bold mb-2 text-white">Complete!</h3>
              <p className="text-slate-400 text-base mb-4">
                Score:{" "}
                <span className="text-emerald-400 font-bold">{score}</span> /{" "}
                {total}
                <span className="ml-2 text-slate-500">({percentage}%)</span>
              </p>

              {/* Progress Bar */}
              <div className="w-full bg-slate-800 rounded-full h-3 mb-5 overflow-hidden">
                <div
                  className={`${progressColor} h-full transition-all duration-500 animate-shimmer`}
                  style={{
                    width: `${percentage}%`,
                    background: `linear-gradient(90deg, currentColor 0%, rgba(255,255,255,0.3) 50%, currentColor 100%)`,
                  }}
                />
              </div>

              <button
                onClick={restartQuiz}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg font-medium text-sm text-white transition-colors"
              >
                Try Again
              </button>
            </div>
          )}
        </div>

        {/* History Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-slate-900 rounded-xl border border-slate-800 p-4">
            <h3 className="text-sm font-bold mb-3 text-slate-300">
              Quiz History
            </h3>

            {history.length === 0 ? (
              <div className="text-center text-slate-500 text-xs py-4">
                No quiz attempts yet
              </div>
            ) : (
              <div className="space-y-2">
                {history.map((attempt, i) => (
                  <div
                    key={i}
                    className="bg-slate-800 rounded-lg p-2.5 border border-slate-700 animate-fade-in-up"
                    style={{ animationDelay: `${i * 50}ms` }}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded ${DIFFICULTY_STYLES[attempt.difficulty].badge}`}
                      >
                        {attempt.difficulty}
                      </span>
                      <span
                        className={`text-xs font-bold ${
                          attempt.percentage >= 80
                            ? "text-emerald-400"
                            : attempt.percentage >= 50
                              ? "text-yellow-400"
                              : "text-red-400"
                        }`}
                      >
                        {attempt.percentage}%
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] text-slate-400">
                        {attempt.score}/{attempt.total}
                      </span>
                      <span className="text-[9px] text-slate-500">
                        {new Date(attempt.date).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {history.length > 0 && (
              <button
                onClick={clearHistory}
                className="w-full mt-3 px-2 py-1.5 text-xs text-slate-500 hover:text-red-400 hover:bg-slate-800 rounded transition-all"
              >
                Clear History
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
