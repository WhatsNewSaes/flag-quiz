import { useState, useCallback, useRef, useEffect } from 'react';
import { countries, Country } from '../data/countries';
import { getRandomElements, getRandomElement } from '../utils/shuffle';
import { playCorrectSound, playIncorrectSound } from '../utils/sounds';
import { useLocalStorage } from './useLocalStorage';

type Phase = 'ready' | 'playing' | 'game-over';

export interface FlagRow {
  id: number;
  correctCountry: Country;
  lanes: Country[]; // [lane0, lane1, lane2]
  correctLane: number;
  y: number; // 0 = top, 100 = bottom (percentage)
  resolved: boolean;
}

const BASE_SPEED = 0.4;
const SPEED_INCREMENT = 0.03;
const PLAYER_ZONE_Y = 82;
const COLLISION_THRESHOLD = 6;
const INITIAL_LIVES = 3;
const LEVEL_UP_INTERVAL = 5;

function generateQuestion(exclude?: Country): { correctCountry: Country; lanes: Country[]; correctLane: number } {
  const pool = exclude ? countries.filter(c => c.code !== exclude.code) : countries;
  const correctCountry = getRandomElement(pool);
  const distractors = getRandomElements(
    countries.filter(c => c.code !== correctCountry.code),
    2,
  );
  const correctLane = Math.floor(Math.random() * 3);
  const lanes: Country[] = [];
  let distIdx = 0;
  for (let i = 0; i < 3; i++) {
    if (i === correctLane) {
      lanes.push(correctCountry);
    } else {
      lanes.push(distractors[distIdx++]);
    }
  }
  return { correctCountry, lanes, correctLane };
}

function spawnRow(idRef: React.MutableRefObject<number>, excludeCountry?: Country): FlagRow {
  const q = generateQuestion(excludeCountry);
  const id = ++idRef.current;
  return {
    id,
    correctCountry: q.correctCountry,
    lanes: q.lanes,
    correctLane: q.correctLane,
    y: -15,
    resolved: false,
  };
}

export function useFlagRunner() {
  const [phase, setPhase] = useState<Phase>('ready');
  const [playerLane, setPlayerLane] = useState(1);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(INITIAL_LIVES);
  const [level, setLevel] = useState(1);
  const [combo, setCombo] = useState(0);
  const [currentCountry, setCurrentCountry] = useState<Country | null>(null);
  const [flagRows, setFlagRows] = useState<FlagRow[]>([]);
  const [highScore, setHighScore] = useLocalStorage('flag-runner-high-score', 0);
  const [showCorrectFlash, setShowCorrectFlash] = useState(false);

  const rowIdRef = useRef(0);
  const frameRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);

  // All mutable game state lives in refs — the game loop reads/writes these
  // directly, then syncs to React state once per frame for rendering.
  const phaseRef = useRef<Phase>('ready');
  const livesRef = useRef(INITIAL_LIVES);
  const playerLaneRef = useRef(1);
  const correctCountRef = useRef(0);
  const comboRef = useRef(0);
  const scoreRef = useRef(0);
  const rowsRef = useRef<FlagRow[]>([]);

  const getSpeed = useCallback((cc: number) => {
    const lvl = Math.floor(cc / LEVEL_UP_INTERVAL) + 1;
    return BASE_SPEED + (lvl - 1) * SPEED_INCREMENT;
  }, []);

  const gameLoop = useCallback((timestamp: number) => {
    if (phaseRef.current !== 'playing') return;

    if (!lastTimeRef.current) lastTimeRef.current = timestamp;
    const delta = Math.min(timestamp - lastTimeRef.current, 50);
    lastTimeRef.current = timestamp;

    const speed = getSpeed(correctCountRef.current);
    const movement = speed * (delta / 16.67);

    // Work entirely with the ref — no state updater
    let rows = rowsRef.current.map(row => {
      if (row.resolved) return row;
      return { ...row, y: row.y + movement };
    });

    // Collision detection
    let needsNewRow = false;
    let newCountryForPrompt: Country | null = null;
    let lastResolvedCountry: Country | undefined;

    rows = rows.map(row => {
      if (row.resolved) return row;
      if (row.y >= PLAYER_ZONE_Y - COLLISION_THRESHOLD && row.y <= PLAYER_ZONE_Y + COLLISION_THRESHOLD + 4) {
        const isCorrect = playerLaneRef.current === row.correctLane;
        if (isCorrect) {
          playCorrectSound();
          setShowCorrectFlash(true);
          setTimeout(() => setShowCorrectFlash(false), 600);
          const newCombo = comboRef.current + 1;
          const points = 100 + (newCombo - 1) * 25;
          comboRef.current = newCombo;
          correctCountRef.current += 1;
          scoreRef.current += points;
        } else {
          playIncorrectSound();
          comboRef.current = 0;
          livesRef.current -= 1;
          if (livesRef.current <= 0) {
            phaseRef.current = 'game-over';
          }
        }
        needsNewRow = true;
        lastResolvedCountry = row.correctCountry;
        return { ...row, resolved: true };
      }
      return row;
    });

    // Remove rows that went off screen
    rows = rows.filter(row => row.y < 110);

    // Spawn new row if needed
    if (needsNewRow && phaseRef.current === 'playing') {
      const newRow = spawnRow(rowIdRef, lastResolvedCountry);
      newCountryForPrompt = newRow.correctCountry;
      rows = [...rows, newRow];
    }

    // If no active rows, spawn one
    if (!rows.some(r => !r.resolved) && phaseRef.current === 'playing') {
      const newRow = spawnRow(rowIdRef);
      newCountryForPrompt = newRow.correctCountry;
      rows = [...rows, newRow];
    }

    // Commit ref
    rowsRef.current = rows;

    // Sync all ref state → React state in one batch
    setFlagRows(rows);
    setScore(scoreRef.current);
    setLives(livesRef.current);
    setCombo(comboRef.current);
    setLevel(Math.floor(correctCountRef.current / LEVEL_UP_INTERVAL) + 1);
    if (newCountryForPrompt) {
      setCurrentCountry(newCountryForPrompt);
    }

    if ((phaseRef.current as Phase) === 'game-over') {
      setPhase('game-over');
      setHighScore(prev => Math.max(prev, scoreRef.current));
      return; // stop loop
    }

    frameRef.current = requestAnimationFrame(gameLoop);
  }, [getSpeed, setHighScore]);

  const startGame = useCallback(() => {
    rowIdRef.current = 0;
    lastTimeRef.current = 0;
    correctCountRef.current = 0;
    comboRef.current = 0;
    scoreRef.current = 0;
    livesRef.current = INITIAL_LIVES;
    playerLaneRef.current = 1;

    const firstRow = spawnRow(rowIdRef);
    rowsRef.current = [firstRow];

    setScore(0);
    setLives(INITIAL_LIVES);
    setLevel(1);
    setCombo(0);
    setPlayerLane(1);
    setFlagRows([firstRow]);
    setCurrentCountry(firstRow.correctCountry);
    setPhase('playing');
    phaseRef.current = 'playing';

    cancelAnimationFrame(frameRef.current);
    lastTimeRef.current = 0;
    frameRef.current = requestAnimationFrame(gameLoop);
  }, [gameLoop]);

  // Cleanup on unmount
  useEffect(() => {
    return () => cancelAnimationFrame(frameRef.current);
  }, []);

  // Stop loop when game over
  useEffect(() => {
    if (phase === 'game-over') {
      cancelAnimationFrame(frameRef.current);
    }
  }, [phase]);

  const movePlayer = useCallback((lane: number) => {
    if (phaseRef.current !== 'playing') return;
    const clamped = Math.max(0, Math.min(2, lane));
    setPlayerLane(clamped);
    playerLaneRef.current = clamped;
  }, []);

  const moveLeft = useCallback(() => {
    movePlayer(playerLaneRef.current - 1);
  }, [movePlayer]);

  const moveRight = useCallback(() => {
    movePlayer(playerLaneRef.current + 1);
  }, [movePlayer]);

  return {
    phase,
    playerLane,
    score,
    lives,
    level,
    combo,
    currentCountry,
    flagRows,
    highScore,
    showCorrectFlash,
    startGame,
    movePlayer,
    moveLeft,
    moveRight,
  };
}
