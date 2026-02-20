import { useEffect, useRef } from 'react';
import { JeopardyBoard } from '../components/JeopardyBoard';
import { JeopardyQuestion } from '../components/JeopardyQuestion';
import { JeopardyDailyDouble } from '../components/JeopardyDailyDouble';
import { JeopardySummary } from '../components/JeopardySummary';
import { useJeopardy } from '../hooks/useJeopardy';
import { JeopardyQuizMode } from '../components/JeopardyDifficultySelect';

interface JeopardyScreenProps {
  quizMode: JeopardyQuizMode;
}

export function JeopardyScreen({ quizMode }: JeopardyScreenProps) {
  const jeopardy = useJeopardy();
  const initialized = useRef(false);

  useEffect(() => {
    if (!initialized.current) {
      jeopardy.resetGame(quizMode);
      initialized.current = true;
    }
  }, [quizMode]);

  const isDailyDouble = jeopardy.selectedCell &&
    jeopardy.dailyDoubleLocation.row === jeopardy.selectedCell.row &&
    jeopardy.dailyDoubleLocation.col === jeopardy.selectedCell.col;

  return (
    <div className="min-h-screen bg-[#1E3A8A] py-4 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl sm:text-2xl font-bold text-yellow-300">
            Flag Jeopardy
          </h1>
          <div className="flex items-center gap-4">
            <span className={`text-2xl font-bold ${jeopardy.score >= 0 ? 'text-yellow-300' : 'text-red-400'}`}>
              ${jeopardy.score.toLocaleString()}
            </span>
            <button
              onClick={() => jeopardy.resetGame()}
              className="px-3 py-1.5 text-sm text-white hover:text-white border border-blue-400 rounded-lg transition-colors flex items-center gap-1.5"
            >
              <span>↺</span> Reset
            </button>
          </div>
        </div>

        <JeopardyBoard
          board={jeopardy.board}
          onSelectCell={jeopardy.selectCell}
        />

        <div className="mt-4 text-center text-sm text-blue-100">
          {jeopardy.remainingCells} questions remaining
        </div>
      </div>

      {jeopardy.showDailyDouble && (
        <JeopardyDailyDouble
          currentScore={jeopardy.score}
          onConfirmWager={(wager) => {
            jeopardy.setDailyDoubleWager(wager);
            jeopardy.confirmDailyDoubleWager();
          }}
        />
      )}

      {jeopardy.currentQuestion && !jeopardy.showDailyDouble && (
        <JeopardyQuestion
          cell={jeopardy.currentQuestion}
          options={jeopardy.options}
          selectedAnswer={jeopardy.selectedAnswer}
          answeredCorrectly={jeopardy.answeredCorrectly}
          onAnswer={jeopardy.checkAnswer}
          onClose={jeopardy.closeQuestion}
          isDailyDouble={isDailyDouble || false}
          wager={jeopardy.dailyDoubleWager}
          quizMode={jeopardy.quizMode}
        />
      )}

      {jeopardy.gameOver && (
        <JeopardySummary
          score={jeopardy.score}
          onPlayAgain={() => jeopardy.resetGame()}
        />
      )}
    </div>
  );
}
