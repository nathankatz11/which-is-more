// Tiny Web Audio helper — synthesizes short tones in the browser so we
// don't ship any audio files. Lazy-initializes the AudioContext on first
// use (required by browser autoplay policies).

"use client";

let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  return ctx;
}

type Note = {
  freq: number;
  start: number;
  duration: number;
  type?: OscillatorType;
  gain?: number;
};

function play(notes: Note[], masterGain = 0.18) {
  const audio = getCtx();
  if (!audio) return;
  // iOS Safari suspends the context until a user gesture wakes it.
  if (audio.state === "suspended") audio.resume().catch(() => {});

  const master = audio.createGain();
  master.gain.value = masterGain;
  master.connect(audio.destination);

  const now = audio.currentTime;
  for (const n of notes) {
    const osc = audio.createOscillator();
    osc.type = n.type ?? "sine";
    osc.frequency.value = n.freq;
    const g = audio.createGain();
    const peak = n.gain ?? 0.3;
    // Bell-like envelope: quick attack, exponential decay to silence.
    g.gain.setValueAtTime(0, now + n.start);
    g.gain.linearRampToValueAtTime(peak, now + n.start + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0008, now + n.start + n.duration);
    osc.connect(g).connect(master);
    osc.start(now + n.start);
    osc.stop(now + n.start + n.duration + 0.05);
  }
}

/// Warm bell chime: stacked sines at C5 + G5 + C6 with a long decay.
/// Feels like a gentle "tink" rather than a retro game beep.
export function playCorrect() {
  play([
    { freq: 523.25, start: 0, duration: 0.9, gain: 0.36 },  // C5
    { freq: 783.99, start: 0, duration: 0.7, gain: 0.2 },   // G5 (perfect fifth)
    { freq: 1046.5, start: 0, duration: 0.55, gain: 0.14 }, // C6 (octave)
  ]);
}

/// Single soft low tone — a quiet "hmm" rather than a descending buzz.
/// Low A (220 Hz) sine, short-ish, fades smoothly.
export function playWrong() {
  play(
    [{ freq: 220, start: 0, duration: 0.45, gain: 0.32, type: "sine" }],
    0.2
  );
}
