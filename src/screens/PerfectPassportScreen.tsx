import { useEffect, useMemo, useState } from 'react';
import { FlagImage } from '../components/FlagImage';
import { usePerfectPassport, type PassportOption, type PassportPick } from '../hooks/usePerfectPassport';
import { playMenuSelectSound } from '../utils/sounds';

interface PerfectPassportScreenProps {
  onBack?: () => void;
}

interface ChallengeInvite {
  score: string;
  title: string;
  best: string;
  grade: string;
  seed: string;
  seedLabel: string;
}

type ResultHelpKey = 'draw-luck' | 'best-picks';

function CopyIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2.5"
      viewBox="0 0 24 24"
    >
      <rect x="9" y="9" width="10" height="10" rx="1" />
      <path d="M5 15H4a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h9a1 1 0 0 1 1 1v1" />
    </svg>
  );
}

function ShareIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2.5"
      viewBox="0 0 24 24"
    >
      <path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7" />
      <path d="M12 16V4" />
      <path d="m7 9 5-5 5 5" />
    </svg>
  );
}

function ResultHelpButton({
  label,
  text,
  isOpen,
  onToggle,
}: {
  label: string;
  text: string;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <span className="relative inline-flex align-middle">
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          onToggle();
        }}
        aria-label={label}
        aria-expanded={isOpen}
        className="ml-1 inline-flex h-5 w-5 items-center justify-center rounded-full border-2 border-retro-border bg-retro-surface font-retro text-[0.48rem] leading-none text-retro-text shadow-pixel-sm"
      >
        ?
      </button>
      {isOpen && (
        <span className="absolute bottom-7 left-1/2 z-20 w-40 -translate-x-1/2 rounded border-2 border-retro-border bg-white px-2 py-2 text-center font-body text-[0.68rem] font-bold leading-snug text-retro-text shadow-pixel">
          {text}
        </span>
      )}
    </span>
  );
}

async function copyText(text: string): Promise<void> {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.left = '-9999px';
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand('copy');
  document.body.removeChild(textarea);
}

function readChallengeInvite(): ChallengeInvite | null {
  if (typeof window === 'undefined') return null;
  const params = new URLSearchParams(window.location.search);
  if (params.get('challenge') !== '1') return null;

  const score = params.get('score') ?? '';
  const seed = params.get('seed') ?? '';
  if (!/^\d{1,3}(?:-\d{1,3}|\/197)$/.test(score) || !seed) return null;
  const scoreLabel = score.includes('-') ? `${score.split('-')[0]}/197` : score;

  return {
    score: scoreLabel,
    seed,
    title: (params.get('title') ?? 'Perfect Passport Run').slice(0, 40),
    best: (params.get('best') ?? '?').slice(0, 3),
    grade: (params.get('grade') ?? '?').slice(0, 3),
    seedLabel: (params.get('label') ?? 'Challenge Run').slice(0, 32),
  };
}

function CopyChallengeLinkButton({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await copyText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      aria-label="Copy challenge link"
      className="retro-btn flex h-11 w-12 shrink-0 items-center justify-center bg-white text-retro-text"
      title="Copy challenge link"
    >
      {copied ? (
        <span className="font-retro text-[0.55rem]">OK</span>
      ) : (
        <CopyIcon />
      )}
    </button>
  );
}

function ShareChallengeLinkButton({
  url,
  score,
}: {
  url: string;
  score: string;
}) {
  const [shared, setShared] = useState(false);

  async function share() {
    try {
      const title = `Can you beat my ${score} in Perfect Passport?`;
      const text = `I scored ${score} in Perfect Passport. Can you beat my score?`;
      if (navigator.share) {
        await navigator.share({ title, text, url });
      } else {
        await copyText(`${text}\n${url}`);
      }
      setShared(true);
      setTimeout(() => setShared(false), 1800);
    } catch {
      setShared(false);
    }
  }

  return (
    <button
      type="button"
      onClick={share}
      aria-label="Share challenge link"
      className="retro-btn flex h-11 w-12 shrink-0 items-center justify-center bg-retro-neon-blue text-white"
      title="Share challenge link"
    >
      {shared ? (
        <span className="font-retro text-[0.55rem]">OK</span>
      ) : (
        <ShareIcon />
      )}
    </button>
  );
}

function PassportCard({
  option,
  selectedPick,
  onChoose,
}: {
  option: PassportOption;
  selectedPick: PassportPick | null;
  onChoose: (code: string) => void;
}) {
  const isSelected = selectedPick?.country.code === option.country.code;
  const cardState = selectedPick
    ? isSelected
      ? 'keycap-btn-pressed text-retro-text'
      : 'keycap-btn-faded opacity-60'
    : 'text-retro-text';

  return (
    <button
      type="button"
      disabled={!!selectedPick}
      onClick={() => onChoose(option.country.code)}
      className={`keycap-btn relative flex min-h-[78px] flex-col items-center justify-center p-1.5 text-center transition-all sm:min-h-[98px] sm:p-2.5 ${cardState}`}
    >
      <div className="flex min-h-0 w-full flex-col items-center justify-center gap-1">
        <div className="max-w-full truncate font-retro text-[0.5rem] leading-relaxed sm:text-[0.6rem]">
          {option.country.name}
        </div>
        <FlagImage code={option.country.code} name={option.country.name} className="my-0.5 text-2xl sm:my-1 sm:text-3xl" />
        <div className="max-w-full truncate font-body text-[0.56rem] font-normal text-retro-text-secondary/70 sm:text-[0.66rem]">
          {option.country.continent}
        </div>

        {isSelected ? (
          <div className="mt-0.5 font-retro text-[0.44rem] text-retro-text-secondary sm:text-[0.5rem]">
            Locked in
          </div>
        ) : null}
      </div>
    </button>
  );
}

function PassportBoardReveal({
  options,
  selectedPick,
}: {
  options: PassportOption[];
  selectedPick: PassportPick;
}) {
  const ranked = [...options].sort((a, b) => (
    b.strength - a.strength || a.rank - b.rank
  ));

  return (
    <div className="keyboard-case w-full max-w-xl animate-[fadeIn_450ms_ease-out_both]">
      <div className="grid gap-1.5">
        {ranked.map((option, index) => {
          const isSelected = option.country.code === selectedPick.country.code;
          const isBest = index === 0;

          return (
            <div
              key={option.country.code}
                className={`flex min-h-[42px] items-center gap-2 rounded border-2 px-2 py-1.5 shadow-pixel-sm ${
                  isSelected
                    ? 'border-retro-neon-green bg-retro-surface'
                    : 'border-retro-border bg-white'
                }`}
            >
              <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded border-2 border-retro-border font-retro text-[0.48rem] ${
                isBest ? 'bg-retro-accent text-retro-text' : 'bg-retro-surface text-retro-text-secondary'
              }`}>
                {index + 1}
              </div>
              <FlagImage code={option.country.code} name={option.country.name} className="shrink-0 text-xl" />
              <div className="min-w-0 flex-1">
                <div className="truncate font-body text-sm font-black leading-tight text-retro-text">
                  {option.country.name}
                </div>
                <div className="truncate font-body text-[0.68rem] leading-tight text-retro-text-secondary">
                  {selectedPick.category.formatValue(option.value)}
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                {isSelected && (
                  <span className="rounded border-2 border-retro-border bg-retro-neon-green px-1.5 py-1 font-retro text-[0.42rem] text-white">
                    YOUR PICK
                  </span>
                )}
                {isBest && (
                  <span className="rounded border-2 border-retro-border bg-retro-accent px-1.5 py-1 font-retro text-[0.42rem] text-retro-text">
                    BEST
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function PerfectPassportScreen({ onBack }: PerfectPassportScreenProps) {
  const passport = usePerfectPassport();
  const challengeInvite = useMemo(() => readChallengeInvite(), []);
  const [showLobbyDetails, setShowLobbyDetails] = useState(false);
  const [showBoardReveal, setShowBoardReveal] = useState(false);
  const [autoAdvanceReveal, setAutoAdvanceReveal] = useState(false);
  const [openResultHelp, setOpenResultHelp] = useState<ResultHelpKey | null>(null);
  const activeSelectedPick = passport.selectedPick?.category.key === passport.category.key
    ? passport.selectedPick
    : null;

  useEffect(() => {
    if (passport.phase !== 'drafting' || !activeSelectedPick) {
      setShowBoardReveal(false);
      return;
    }

    setShowBoardReveal(false);
    const revealTimeout = window.setTimeout(() => {
      setShowBoardReveal(true);
    }, 500);

    return () => {
      window.clearTimeout(revealTimeout);
    };
  }, [passport.phase, activeSelectedPick]);

  useEffect(() => {
    if (passport.phase !== 'drafting' || !activeSelectedPick || !showBoardReveal || !autoAdvanceReveal) return;

    const timeout = window.setTimeout(() => {
      passport.continueRun();
    }, 2500);

    return () => window.clearTimeout(timeout);
  }, [passport.phase, activeSelectedPick, showBoardReveal, autoAdvanceReveal, passport.continueRun]);

  useEffect(() => {
    if (passport.phase !== 'summary') {
      setOpenResultHelp(null);
    }
  }, [passport.phase]);

  if (passport.phase === 'lobby') {
    return (
      <div className="flex min-h-screen-nav flex-col bg-retro-bg px-4 pb-4 pt-3">
        {onBack && (
          <button
            onClick={onBack}
            className="mb-2 flex items-center gap-1 self-start font-body text-sm text-retro-text-secondary transition-colors hover:text-retro-text"
          >
            <span>&#8592;</span> Back
          </button>
        )}

        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-md">
            <div className="mb-8 text-center">
              <div className="pixel-border mx-auto mb-4 w-full max-w-sm overflow-hidden rounded-lg bg-retro-surface">
                <img
                  src="/modes/perfect-passport.webp"
                  alt="Perfect Passport"
                  width={760}
                  height={507}
                  className="block aspect-[760/507] w-full object-cover"
                />
              </div>
              <h1 className="mb-2 font-retro text-lg text-retro-text">Perfect Passport</h1>
              <p className="font-body text-sm text-retro-text-secondary">
                Draft countries from random spins, then see if your passport can survive the world tour.
              </p>
            </div>

            {challengeInvite && (
              <div className="mb-4 rounded-lg border-[3px] border-retro-border bg-white p-4 shadow-pixel-sm">
                <div className="font-retro text-[0.58rem] text-retro-neon-blue">Score to beat</div>
                <div className="mt-2 font-retro text-3xl leading-none text-retro-text">
                  {challengeInvite.score}
                </div>
                <div className="mt-2 font-body text-sm font-bold text-retro-text-secondary">
                  {challengeInvite.title} · {challengeInvite.best}/10 best picks · grade {challengeInvite.grade}
                </div>
                <button
                  onClick={() => {
                    playMenuSelectSound();
                    passport.startRun('daily', {
                      seed: challengeInvite.seed,
                      seedLabel: challengeInvite.seedLabel,
                    });
                  }}
                  className="retro-btn mt-4 w-full bg-retro-neon-green px-4 py-3 font-retro text-xs text-white"
                >
                  Play This Challenge
                </button>
              </div>
            )}

            <div className="mb-6 text-center">
              <div className="inline-block rounded-lg bg-retro-surface px-6 py-3 pixel-border">
                <span className="font-retro text-sm text-retro-gold">10</span>
                <span className="ml-2 font-body text-sm text-retro-text">round draft</span>
              </div>
            </div>

            <button
              onClick={() => { playMenuSelectSound(); passport.startRun('daily'); }}
              className="retro-btn mb-4 w-full bg-retro-neon-green px-4 py-4 font-retro text-sm text-white"
            >
              Play
            </button>

            <button
              onClick={() => setShowLobbyDetails(!showLobbyDetails)}
              className="retro-btn mb-4 w-full bg-retro-surface px-4 py-3 font-retro text-xs text-retro-text"
            >
              {showLobbyDetails ? 'Hide Game Details' : 'Game Details'}
            </button>

            {showLobbyDetails && (
              <div className="space-y-4">
                <div>
                  <h3 className="mb-2 font-retro text-[0.6rem] text-retro-text-secondary">Run Setup</h3>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      ['6', 'per spin'],
                      ['2', 'rerolls'],
                      ['197', 'goal'],
                    ].map(([value, label]) => (
                      <div key={label} className="rounded-lg bg-white px-2 py-2 text-center ring-1 ring-retro-border/20">
                        <div className="font-retro text-xs text-retro-text">{value}</div>
                        <div className="mt-1 font-body text-[0.65rem] text-retro-text-secondary">{label}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="mb-2 font-retro text-[0.6rem] text-retro-text-secondary">Categories</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {passport.categories.map((category) => (
                      <div
                        key={category.key}
                        className="truncate rounded-full bg-white px-3 py-1.5 text-center text-xs font-bold text-retro-text-secondary ring-1 ring-retro-border/20"
                      >
                        {category.title}
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => { playMenuSelectSound(); passport.startRun('random'); }}
                  className="retro-btn w-full bg-retro-surface px-4 py-3 font-retro text-xs text-retro-text"
                >
                  Free Run
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (passport.phase === 'summary' && passport.summary) {
    const { summary } = passport;
    return (
      <div className="min-h-screen-nav bg-retro-bg px-4 py-5">
        <div className="mx-auto max-w-5xl">
          <div className="mb-3 flex items-center justify-between">
            <button
              onClick={passport.reset}
              className="flex items-center gap-1 font-body text-sm text-retro-text-secondary transition-colors hover:text-retro-text"
            >
              &#8592; Modes
            </button>
            <div className="font-retro text-[0.58rem] text-retro-text sm:text-xs">
              {passport.seedLabel}
            </div>
          </div>

          <div className="grid min-w-0 gap-4 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
            <section className="pixel-border min-w-0 overflow-hidden rounded-lg bg-retro-surface p-4 text-center shadow-pixel-lg sm:p-6">
              <div className="inline-block rounded-lg border-2 border-retro-border bg-retro-neon-green px-3 py-1.5 font-retro text-[0.56rem] text-white shadow-pixel-sm">
                FINAL SCORE
              </div>
              <div className="mt-4 max-w-full overflow-hidden font-retro text-4xl leading-none text-retro-text sm:text-5xl md:text-7xl">
                {summary.scoreLabel}
              </div>
              <h1 className="mt-3 font-retro text-sm leading-relaxed text-retro-gold sm:text-base">
                {summary.title}
              </h1>
              <p className="mx-auto mt-2 max-w-sm font-body text-sm leading-relaxed text-retro-text-secondary sm:mt-3">
                Send this challenge link and dare someone to beat your score.
              </p>

              <div className="mt-4 grid min-w-0 grid-cols-2 gap-2 sm:mt-5">
                <div className="relative rounded border-2 border-retro-border bg-white px-2 py-2 sm:py-3">
                  <div className="font-retro text-sm text-retro-text">{summary.luckGrade} Tier</div>
                  <div className="mt-1 flex items-center justify-center font-body text-[0.66rem] text-retro-text-secondary">
                    <span>Draw Luck</span>
                    <ResultHelpButton
                      label="What is draw luck?"
                      text="How strong your random country options were across all 10 spins."
                      isOpen={openResultHelp === 'draw-luck'}
                      onToggle={() => setOpenResultHelp((current) => current === 'draw-luck' ? null : 'draw-luck')}
                    />
                  </div>
                </div>
                <div className="relative rounded border-2 border-retro-border bg-white px-2 py-2 sm:py-3">
                  <div className="font-retro text-sm text-retro-text">{summary.bestPicks}/10</div>
                  <div className="mt-1 flex items-center justify-center font-body text-[0.66rem] text-retro-text-secondary">
                    <span>Best Picks</span>
                    <ResultHelpButton
                      label="What are best picks?"
                      text="How many times you chose the strongest country available on that board."
                      isOpen={openResultHelp === 'best-picks'}
                      onToggle={() => setOpenResultHelp((current) => current === 'best-picks' ? null : 'best-picks')}
                    />
                  </div>
                </div>
              </div>

              <button
                onClick={() => passport.startRun('daily')}
                className="retro-btn mt-4 w-full bg-retro-neon-green px-4 py-3 font-retro text-[0.58rem] text-white sm:mt-5 sm:text-xs"
              >
                Play Again
              </button>

              <div className="mt-4 min-w-0 rounded-lg border-2 border-retro-border bg-white p-3 text-left shadow-pixel-sm sm:mt-5">
                <div className="mb-2 font-retro text-[0.5rem] leading-relaxed text-retro-text-secondary sm:text-[0.56rem]">
                  Share your score and challenge a friend
                </div>
                <div className="flex min-w-0 gap-2">
                  <div className="min-w-0 flex-1 rounded border-2 border-retro-border bg-retro-surface px-3 py-2 font-body text-xs text-retro-text-secondary">
                    <div className="truncate">{summary.challengeUrl}</div>
                  </div>
                  <ShareChallengeLinkButton
                    url={summary.challengeUrl}
                    score={summary.scoreLabel}
                  />
                  <CopyChallengeLinkButton url={summary.challengeUrl} />
                </div>
              </div>
            </section>

            <section className="keyboard-case min-w-0">
              <div className="grid gap-1.5">
                <div className="flex items-center justify-between rounded bg-retro-surface px-3 py-2">
                  <h2 className="font-retro text-[0.62rem] text-retro-text">Your Passport</h2>
                  <span className="font-body text-xs font-bold text-retro-text-secondary">
                    {passport.picks.length} picks
                  </span>
                </div>
                {passport.picks.map((pick, index) => (
                  <div
                    key={`${pick.category.key}-${pick.country.code}`}
                    className="flex items-center gap-2 rounded bg-white px-2 py-2 shadow-pixel-sm"
                  >
                    <span className="w-5 shrink-0 text-center font-retro text-[0.5rem] text-retro-gold">
                      {index + 1}
                    </span>
                    <FlagImage code={pick.country.code} name={pick.country.name} className="text-2xl" />
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-body text-sm font-black text-retro-text">
                        {pick.category.shortLabel}: {pick.country.name}
                      </div>
                      <div className="truncate font-body text-[0.7rem] text-retro-text-secondary">
                        {pick.category.formatValue(pick.value)}
                      </div>
                    </div>
                    <span className={`shrink-0 rounded border-2 border-retro-border px-2 py-1 font-retro text-[0.48rem] ${
                      pick.isBestAvailable ? 'bg-retro-neon-green text-white' : 'bg-retro-accent text-retro-text'
                    }`}>
                      {pick.isBestAvailable ? 'BEST' : passport.optionGrade(pick.strength)}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      </div>
    );
  }

  const selectedPick = activeSelectedPick;
  const roundProgress = Math.round(((passport.roundIndex + (selectedPick ? 1 : 0)) / passport.totalRounds) * 100);

  return (
    <div className="h-screen-nav overflow-hidden bg-retro-bg px-3 py-2 sm:px-4 sm:py-6">
      <div className="mx-auto flex h-full max-w-2xl flex-col">
        <div className="mb-2 flex items-center justify-between gap-3 px-1">
          <button
            onClick={passport.reset}
            className="flex items-center gap-1 font-body text-sm text-retro-text-secondary transition-colors hover:text-retro-text"
          >
            &#8592; Exit
          </button>
          <div className="font-retro text-[0.58rem] text-retro-text sm:text-xs">
            {passport.roundIndex + 1}/{passport.totalRounds}
          </div>
        </div>

        <div className="pixel-border mb-5 h-4 w-full overflow-hidden rounded-full bg-retro-surface sm:mb-7">
          <div
            className="h-full rounded-full bg-retro-neon-green transition-all duration-300"
            style={{ width: `${roundProgress}%` }}
          />
        </div>

        <section className="flex min-h-0 flex-1 flex-col items-center">
          <div className="mb-4 text-center sm:mb-6">
            <h1 className="font-retro text-base leading-relaxed text-retro-text sm:text-3xl">
              {passport.category.title}
            </h1>
            <p className="mx-auto mt-2 max-w-xl font-body text-xs text-retro-text-secondary sm:mt-3 sm:text-sm">
              {passport.category.prompt}
            </p>
          </div>

          {selectedPick && showBoardReveal ? (
            <PassportBoardReveal
              options={passport.options}
              selectedPick={selectedPick}
            />
          ) : (
            <div className="keyboard-case w-full max-w-xl">
              <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
                {passport.options.map((option) => (
                  <PassportCard
                    key={option.country.code}
                    option={option}
                    selectedPick={selectedPick}
                    onChoose={(code) => {
                      playMenuSelectSound();
                      passport.choose(code);
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          <div className="mt-2 flex w-full max-w-xl shrink-0 gap-2 sm:mt-4 sm:gap-3">
            {!selectedPick ? (
              <button
                onClick={() => { playMenuSelectSound(); passport.reroll(); }}
                disabled={passport.rerollsRemaining <= 0}
                className="retro-btn w-full bg-retro-surface px-3 py-2 font-retro text-[0.56rem] text-retro-text-secondary disabled:opacity-50 sm:px-4 sm:text-xs"
              >
                Reroll Spin ({passport.rerollsRemaining})
              </button>
            ) : showBoardReveal ? (
              <div className="flex w-full flex-col gap-2">
                <button
                  type="button"
                  onClick={() => {
                    playMenuSelectSound();
                    passport.continueRun();
                  }}
                  className="retro-btn relative w-full overflow-hidden bg-retro-neon-green px-2 py-2 font-retro text-[0.52rem] text-white sm:px-4 sm:py-3 sm:text-xs"
                >
                  {autoAdvanceReveal && (
                    <span
                      aria-hidden="true"
                      className="absolute inset-y-0 left-0 z-0 w-full origin-left bg-white/30"
                      style={{ animation: 'autoAdvanceFill 2500ms linear forwards' }}
                    />
                  )}
                  <span className="relative z-10">
                    {passport.roundIndex === passport.totalRounds - 1 ? 'See Results' : 'Next Question'}
                  </span>
                </button>
                <label className="retro-btn flex w-full cursor-pointer items-center justify-center gap-2 bg-retro-surface px-2 py-2 font-retro text-[0.42rem] text-retro-text-secondary sm:px-4 sm:text-[0.58rem]">
                  <span className="truncate">Auto advance: {autoAdvanceReveal ? 'On' : 'Off'}</span>
                  <input
                    type="checkbox"
                    checked={autoAdvanceReveal}
                    onChange={() => {
                      playMenuSelectSound();
                      setAutoAdvanceReveal((current) => !current);
                    }}
                    className="peer sr-only"
                    aria-label={`Auto advance: ${autoAdvanceReveal ? 'On' : 'Off'}`}
                  />
                  <span
                    aria-hidden="true"
                    className="relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-retro-border bg-white shadow-pixel-sm transition-colors after:absolute after:left-0 after:top-0 after:h-4 after:w-4 after:rounded-full after:border after:border-retro-border after:bg-retro-text after:transition-transform peer-checked:bg-retro-neon-green peer-checked:after:translate-x-4"
                  />
                </label>
              </div>
            ) : (
              <div className="min-w-0 flex-1 rounded-lg bg-white/50 px-2 py-2 text-center sm:px-4 sm:py-3">
                <div className="truncate font-retro text-[0.52rem] text-retro-text sm:text-[0.62rem]">
                  Locked in...
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
