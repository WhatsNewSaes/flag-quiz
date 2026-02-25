// Simple sound effects using Web Audio API

import { hapticCorrect, hapticIncorrect, hapticTap } from './haptics';

let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioContext;
}

export function playCorrectSound(): void {
  hapticCorrect();
  try {
    const ctx = getAudioContext();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    // Pleasant rising tone
    oscillator.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
    oscillator.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1); // E5
    oscillator.frequency.setValueAtTime(783.99, ctx.currentTime + 0.2); // G5

    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.4);
  } catch (e) {
    // Audio not supported or blocked
  }
}

export function playIncorrectSound(): void {
  hapticIncorrect();
  try {
    const ctx = getAudioContext();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    // Descending tone
    oscillator.frequency.setValueAtTime(349.23, ctx.currentTime); // F4
    oscillator.frequency.setValueAtTime(293.66, ctx.currentTime + 0.15); // D4

    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.3);
  } catch (e) {
    // Audio not supported or blocked
  }
}

// --- Retro chiptune sounds for Journey mode ---

function playSquareTone(frequency: number, duration: number, startTime: number, gain: number = 0.2): void {
  const ctx = getAudioContext();
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.connect(g);
  g.connect(ctx.destination);
  osc.type = 'square';
  osc.frequency.setValueAtTime(frequency, startTime);
  g.gain.setValueAtTime(gain, startTime);
  g.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
  osc.start(startTime);
  osc.stop(startTime + duration);
}

export function playLevelCompleteSound(): void {
  hapticCorrect();
  try {
    const ctx = getAudioContext();
    const t = ctx.currentTime;
    playSquareTone(523.25, 0.15, t);       // C5
    playSquareTone(659.25, 0.15, t + 0.12);// E5
    playSquareTone(783.99, 0.15, t + 0.24);// G5
    playSquareTone(1046.5, 0.3, t + 0.36); // C6
  } catch (e) {}
}

export function playStarEarnedSound(): void {
  hapticCorrect();
  try {
    const ctx = getAudioContext();
    const t = ctx.currentTime;
    playSquareTone(880, 0.1, t);          // A5
    playSquareTone(1108.73, 0.15, t + 0.08); // C#6
    playSquareTone(1318.51, 0.2, t + 0.18);  // E6
  } catch (e) {}
}

export function playWorldUnlockSound(): void {
  hapticCorrect();
  try {
    const ctx = getAudioContext();
    const t = ctx.currentTime;
    playSquareTone(392, 0.12, t);          // G4
    playSquareTone(523.25, 0.12, t + 0.1); // C5
    playSquareTone(659.25, 0.12, t + 0.2); // E5
    playSquareTone(783.99, 0.12, t + 0.3); // G5
    playSquareTone(1046.5, 0.4, t + 0.4);  // C6
  } catch (e) {}
}

export function playAchievementSound(): void {
  hapticCorrect();
  try {
    const ctx = getAudioContext();
    const t = ctx.currentTime;
    playSquareTone(659.25, 0.1, t);           // E5
    playSquareTone(783.99, 0.1, t + 0.08);    // G5
    playSquareTone(987.77, 0.1, t + 0.16);    // B5
    playSquareTone(1318.51, 0.3, t + 0.24);   // E6
  } catch (e) {}
}

export function playMenuSelectSound(): void {
  hapticTap();
  try {
    const ctx = getAudioContext();
    const t = ctx.currentTime;
    const rate = ctx.sampleRate;

    // Hand-craft a damped mechanical impact waveform
    const len = Math.floor(rate * 0.06);
    const buf = ctx.createBuffer(1, len, rate);
    const data = buf.getChannelData(0);

    for (let i = 0; i < len; i++) {
      const s = i / rate;
      // Damped resonance at ~2kHz — the keycap hitting the plate
      const impact = Math.sin(2 * Math.PI * 2000 * s) * Math.exp(-s / 0.006);
      // Second resonance at ~3.5kHz — the click mechanism
      const click = Math.sin(2 * Math.PI * 3500 * s) * Math.exp(-s / 0.003) * 0.5;
      // Tiny bit of noise for texture
      const texture = (Math.random() * 2 - 1) * Math.exp(-s / 0.002) * 0.15;
      data[i] = impact + click + texture;
    }

    const src = ctx.createBufferSource();
    src.buffer = buf;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.5, t);

    src.connect(gain);
    gain.connect(ctx.destination);
    src.start(t);
  } catch (e) {}
}
