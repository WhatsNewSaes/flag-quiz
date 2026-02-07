import { useState, useCallback, useMemo } from 'react';
import { countries, Country, Continent, Difficulty } from '../data/countries';
import { shuffle, getRandomElements } from '../utils/shuffle';

export type QuestionType = 'name-the-flag' | 'pick-the-flag';

export interface JeopardyCell {
  continent: Continent;
  difficulty: Difficulty;
  country: Country;
  questionType: QuestionType;
  used: boolean;
  value: number;
}

export interface JeopardyState {
  board: JeopardyCell[][];
  score: number;
  dailyDoubleLocation: { row: number; col: number };
  selectedCell: { row: number; col: number } | null;
  currentQuestion: JeopardyCell | null;
  options: Country[];
  answeredCorrectly: boolean | null;
  selectedAnswer: Country | null;
  showDailyDouble: boolean;
  dailyDoubleWager: number;
  gameOver: boolean;
}

const continentOrder: Continent[] = [
  'Africa',
  'Asia',
  'Europe',
  'North America',
  'South America',
  'Oceania',
];

const difficultyValues: Record<Difficulty, number> = {
  1: 200,
  2: 400,
  3: 600,
  4: 800,
  5: 1000,
};

function getRandomCountryForCell(continent: Continent, difficulty: Difficulty): Country | null {
  const matching = countries.filter(
    c => c.continent === continent && c.difficulty === difficulty
  );
  if (matching.length === 0) return null;
  return matching[Math.floor(Math.random() * matching.length)];
}

function generateBoard(): JeopardyCell[][] {
  const board: JeopardyCell[][] = [];

  for (let row = 0; row < 5; row++) {
    const difficulty = (row + 1) as Difficulty;
    const rowCells: JeopardyCell[] = [];

    for (let col = 0; col < 6; col++) {
      const continent = continentOrder[col];
      const country = getRandomCountryForCell(continent, difficulty);

      rowCells.push({
        continent,
        difficulty,
        country: country || countries.find(c => c.continent === continent)!, // fallback
        questionType: Math.random() < 0.5 ? 'name-the-flag' : 'pick-the-flag',
        used: false,
        value: difficultyValues[difficulty],
      });
    }

    board.push(rowCells);
  }

  return board;
}

function generateOptions(currentCountry: Country): Country[] {
  const others = countries.filter(c => c.code !== currentCountry.code);
  const wrongAnswers = getRandomElements(others, 3);
  return shuffle([currentCountry, ...wrongAnswers]);
}

export function useJeopardy() {
  const [state, setState] = useState<JeopardyState>(() => {
    const board = generateBoard();
    // Random daily double location
    const dailyDoubleRow = Math.floor(Math.random() * 5);
    const dailyDoubleCol = Math.floor(Math.random() * 6);

    return {
      board,
      score: 0,
      dailyDoubleLocation: { row: dailyDoubleRow, col: dailyDoubleCol },
      selectedCell: null,
      currentQuestion: null,
      options: [],
      answeredCorrectly: null,
      selectedAnswer: null,
      showDailyDouble: false,
      dailyDoubleWager: 0,
      gameOver: false,
    };
  });

  const remainingCells = useMemo(() => {
    let count = 0;
    state.board.forEach(row => {
      row.forEach(cell => {
        if (!cell.used) count++;
      });
    });
    return count;
  }, [state.board]);

  const selectCell = useCallback((row: number, col: number) => {
    setState(prev => {
      const cell = prev.board[row][col];
      if (cell.used) return prev;

      const isDailyDouble =
        prev.dailyDoubleLocation.row === row &&
        prev.dailyDoubleLocation.col === col;

      if (isDailyDouble) {
        return {
          ...prev,
          selectedCell: { row, col },
          currentQuestion: cell,
          showDailyDouble: true,
          dailyDoubleWager: 0,
        };
      }

      return {
        ...prev,
        selectedCell: { row, col },
        currentQuestion: cell,
        options: generateOptions(cell.country),
        answeredCorrectly: null,
        selectedAnswer: null,
      };
    });
  }, []);

  const setDailyDoubleWager = useCallback((wager: number) => {
    setState(prev => ({
      ...prev,
      dailyDoubleWager: Math.max(0, Math.min(wager, Math.max(prev.score, 1000))),
    }));
  }, []);

  const confirmDailyDoubleWager = useCallback(() => {
    setState(prev => {
      if (!prev.currentQuestion) return prev;

      return {
        ...prev,
        showDailyDouble: false,
        options: generateOptions(prev.currentQuestion.country),
        answeredCorrectly: null,
        selectedAnswer: null,
      };
    });
  }, []);

  const checkAnswer = useCallback((answer: Country): boolean => {
    const isCorrect = answer.code === state.currentQuestion?.country.code;

    setState(prev => {
      if (!prev.currentQuestion || !prev.selectedCell) return prev;

      const isDailyDouble =
        prev.dailyDoubleLocation.row === prev.selectedCell.row &&
        prev.dailyDoubleLocation.col === prev.selectedCell.col;

      const valueChange = isDailyDouble
        ? prev.dailyDoubleWager
        : prev.currentQuestion.value;

      const newScore = isCorrect
        ? prev.score + valueChange
        : prev.score - valueChange;

      // Mark cell as used
      const newBoard = prev.board.map((row, rowIdx) =>
        row.map((cell, colIdx) => {
          if (rowIdx === prev.selectedCell!.row && colIdx === prev.selectedCell!.col) {
            return { ...cell, used: true };
          }
          return cell;
        })
      );

      // Check if game is over
      const cellsRemaining = newBoard.flat().filter(c => !c.used).length;

      return {
        ...prev,
        board: newBoard,
        score: newScore,
        answeredCorrectly: isCorrect,
        selectedAnswer: answer,
        gameOver: cellsRemaining === 0,
      };
    });

    return isCorrect;
  }, [state.currentQuestion]);

  const closeQuestion = useCallback(() => {
    setState(prev => ({
      ...prev,
      selectedCell: null,
      currentQuestion: null,
      options: [],
      answeredCorrectly: null,
      selectedAnswer: null,
    }));
  }, []);

  const resetGame = useCallback(() => {
    const board = generateBoard();
    const dailyDoubleRow = Math.floor(Math.random() * 5);
    const dailyDoubleCol = Math.floor(Math.random() * 6);

    setState({
      board,
      score: 0,
      dailyDoubleLocation: { row: dailyDoubleRow, col: dailyDoubleCol },
      selectedCell: null,
      currentQuestion: null,
      options: [],
      answeredCorrectly: null,
      selectedAnswer: null,
      showDailyDouble: false,
      dailyDoubleWager: 0,
      gameOver: false,
    });
  }, []);

  return {
    ...state,
    remainingCells,
    selectCell,
    setDailyDoubleWager,
    confirmDailyDoubleWager,
    checkAnswer,
    closeQuestion,
    resetGame,
  };
}

export { continentOrder, difficultyValues };
