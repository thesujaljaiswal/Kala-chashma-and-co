import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ThemeProps } from "../ThemeProps";

// Ambient continuous background floating embers
const AMBIENT_EMBERS = [
  { id: 1, left: "10%", size: 3, delay: 0.2, duration: 6, xDrift: 25 },
  { id: 2, left: "20%", size: 4, delay: 1.5, duration: 5.5, xDrift: -30 },
  { id: 3, left: "30%", size: 2.5, delay: 0.8, duration: 7, xDrift: 40 },
  { id: 4, left: "42%", size: 5, delay: 2.1, duration: 5, xDrift: -20 },
  { id: 5, left: "50%", size: 3.5, delay: 0.4, duration: 6.5, xDrift: 35 },
  { id: 6, left: "60%", size: 4.5, delay: 1.8, duration: 5.8, xDrift: -45 },
  { id: 7, left: "70%", size: 3, delay: 2.8, duration: 6.2, xDrift: 20 },
  { id: 8, left: "80%", size: 4, delay: 0.9, duration: 5.2, xDrift: -35 },
  { id: 9, left: "90%", size: 2.5, delay: 2.4, duration: 7.5, xDrift: 25 },
  { id: 10, left: "25%", size: 3.5, delay: 3.2, duration: 6, xDrift: 30 },
  { id: 11, left: "35%", size: 4, delay: 3.7, duration: 5.4, xDrift: -25 },
  { id: 12, left: "65%", size: 3, delay: 3.0, duration: 6.8, xDrift: 15 },
  { id: 13, left: "48%", size: 5, delay: 4.2, duration: 4.8, xDrift: -15 },
  { id: 14, left: "15%", size: 3, delay: 4.6, duration: 6.3, xDrift: 20 },
  { id: 15, left: "85%", size: 4.5, delay: 4.0, duration: 5.7, xDrift: -25 },
];

// 70 pre-computed multi-sized particles for the bottom eruption shower
const ERUPTION_SHOWER_PARTICLES = Array.from({ length: 70 }, (_, i) => {
  let size = 6;
  let type: "tiny" | "small" | "medium" | "large" | "giant" = "tiny";

  if (i % 15 === 0) {
    size = 46 + (i % 10);
    type = "giant";
  } else if (i % 6 === 0) {
    size = 28 + (i % 8);
    type = "large";
  } else if (i % 3 === 0) {
    size = 15 + (i % 8);
    type = "medium";
  } else if (i % 2 === 0) {
    size = 9 + (i % 5);
    type = "small";
  } else {
    size = 4 + (i % 4);
    type = "tiny";
  }

  const left = `${(i * 1.45 + ((i * 7) % 15)) % 98}%`;
  const duration = 1.3 + ((i % 10) * 0.16);
  const delay = ((i % 12) * 0.08);
  const xDrift = ((i % 2 === 0 ? 1 : -1) * (20 + (i % 5) * 18));

  return { id: i, size, type, left, duration, delay, xDrift };
});

// Twinkling stars in the night sky
const STARS = [
  { top: "8%", left: "12%", size: 2, delay: 0.5, dur: 3 },
  { top: "14%", left: "28%", size: 1.5, delay: 1.2, dur: 4 },
  { top: "6%", left: "48%", size: 2.5, delay: 0.2, dur: 2.5 },
  { top: "18%", left: "62%", size: 1.5, delay: 1.8, dur: 3.5 },
  { top: "10%", left: "78%", size: 2, delay: 0.9, dur: 4.2 },
  { top: "22%", left: "88%", size: 1.8, delay: 2.1, dur: 3 },
  { top: "28%", left: "8%", size: 2, delay: 1.5, dur: 2.8 },
  { top: "35%", left: "22%", size: 1.5, delay: 0.7, dur: 3.8 },
  { top: "30%", left: "92%", size: 2.2, delay: 1.1, dur: 4 },
  { top: "42%", left: "82%", size: 1.5, delay: 2.4, dur: 3.2 },
  { top: "4%", left: "85%", size: 2, delay: 1.6, dur: 3.6 },
  { top: "16%", left: "38%", size: 2.2, delay: 0.4, dur: 4.5 },
  { top: "25%", left: "54%", size: 1.6, delay: 1.9, dur: 3.9 },
  { top: "38%", left: "70%", size: 2.4, delay: 0.7, dur: 2.9 },
];

const CAMP_VIBE_ACHIEVEMENTS = [
  "🪵 Added a fresh pine log to the fire!",
  "🔥 Embers crackling warm and bright!",
  "🍢 Golden toasted marshmallow ready!",
  "🎸 Acoustic chords echoing under the trees...",
  "✨ Telling stories around the bonfire!",
  "🦉 Night breeze rustling through the pines...",
  "☕ Warm cocoa by the starlight!",
  "🌌 Stargazing: Constellation spotted!",
  "⛺ Ready for a cozy overnight stay in the tents!",
  "🏕️ The EMBER camping vibe is unmatched!"
];

const CAMP_HIGHLIGHTS = [
  { icon: "🔥", label: "Calming Bonfire" },
  { icon: "⛺", label: "Overnight Stay" },
  { icon: "🎯", label: "Camp Activities" },
  { icon: "🎸", label: "Acoustic Jam" },
];

// ----------------------------------------------------
// WEB AUDIO API SYNTHESIZER: BONFIRE, CRICKETS & ERUPTION
// ----------------------------------------------------
class BonfireAudioSystem {
  private ctx: AudioContext | null = null;
  private isRunning: boolean = false;
  private crackleIntervalId: any = null;
  private cricketIntervalId: any = null;
  private windNode: AudioNode | null = null;
  private mainGain: GainNode | null = null;

  public init() {
    if (this.ctx) return;
    try {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtxClass) {
        this.ctx = new AudioCtxClass();
      }
    } catch (e) {
      console.warn("AudioContext init error:", e);
    }
  }

  public start() {
    this.init();
    if (!this.ctx) return;
    if (this.ctx.state === "suspended") {
      this.ctx.resume();
    }
    if (this.isRunning) return;
    this.isRunning = true;

    this.mainGain = this.ctx.createGain();
    this.mainGain.gain.setValueAtTime(0.4, this.ctx.currentTime);
    this.mainGain.connect(this.ctx.destination);

    this.startWindAndRumble();
    this.startWoodCrackleLoop();
    this.startNightCricketsLoop();
  }

  public stop() {
    this.isRunning = false;
    if (this.crackleIntervalId) clearInterval(this.crackleIntervalId);
    if (this.cricketIntervalId) clearInterval(this.cricketIntervalId);
    if (this.windNode) {
      try { (this.windNode as any).stop?.(); } catch {}
      this.windNode = null;
    }
    if (this.ctx) {
      try {
        this.ctx.suspend();
      } catch {}
    }
  }

  private startWindAndRumble() {
    if (!this.ctx || !this.mainGain) return;
    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      output[i] = (b0 + b1 + b2) * 0.1;
    }

    const whiteNoiseSource = this.ctx.createBufferSource();
    whiteNoiseSource.buffer = noiseBuffer;
    whiteNoiseSource.loop = true;

    const flameFilter = this.ctx.createBiquadFilter();
    flameFilter.type = "bandpass";
    flameFilter.frequency.setValueAtTime(320, this.ctx.currentTime);
    flameFilter.Q.setValueAtTime(1.8, this.ctx.currentTime);

    const flameGain = this.ctx.createGain();
    flameGain.gain.setValueAtTime(0.28, this.ctx.currentTime);

    whiteNoiseSource.connect(flameFilter);
    flameFilter.connect(flameGain);
    flameGain.connect(this.mainGain);

    whiteNoiseSource.start();
    this.windNode = whiteNoiseSource;
  }

  private startWoodCrackleLoop() {
    if (!this.ctx) return;
    const scheduleNextPop = () => {
      if (!this.isRunning || !this.ctx || !this.mainGain) return;
      this.playSnap(0.15 + Math.random() * 0.25);
      const nextDelay = 80 + Math.random() * 260;
      this.crackleIntervalId = setTimeout(scheduleNextPop, nextDelay);
    };
    scheduleNextPop();
  }

  private startNightCricketsLoop() {
    if (!this.ctx) return;
    const scheduleCrickets = () => {
      if (!this.isRunning || !this.ctx || !this.mainGain) return;
      this.playCricketChirp();
      const nextCricket = 1800 + Math.random() * 2500;
      this.cricketIntervalId = setTimeout(scheduleCrickets, nextCricket);
    };
    this.cricketIntervalId = setTimeout(scheduleCrickets, 1000);
  }

  private playCricketChirp() {
    if (!this.ctx || !this.mainGain) return;
    const now = this.ctx.currentTime;
    for (let i = 0; i < 3; i++) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(4600 + (i % 2 === 0 ? 150 : -100), now + i * 0.07);

      gain.gain.setValueAtTime(0.0001, now + i * 0.07);
      gain.gain.exponentialRampToValueAtTime(0.025, now + i * 0.07 + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.07 + 0.055);

      osc.connect(gain);
      gain.connect(this.mainGain);
      osc.start(now + i * 0.07);
      osc.stop(now + i * 0.07 + 0.06);
    }
  }

  public playSnap(volume = 0.3) {
    if (!this.ctx || !this.mainGain) return;
    const now = this.ctx.currentTime;
    const popDuration = 0.015 + Math.random() * 0.025;
    const buffer = this.ctx.createBuffer(1, Math.floor(this.ctx.sampleRate * popDuration), this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (data.length * 0.3));
    }

    const popSource = this.ctx.createBufferSource();
    popSource.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(1400 + Math.random() * 3200, now);
    filter.Q.setValueAtTime(4.0, now);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + popDuration);

    popSource.connect(filter);
    filter.connect(gain);
    gain.connect(this.mainGain);

    popSource.start(now);
  }

  public playStokeWhoosh(intensity = 1) {
    this.init();
    if (!this.ctx) return;
    if (this.ctx.state === "suspended") this.ctx.resume();

    const now = this.ctx.currentTime;
    const bufferSize = Math.floor(this.ctx.sampleRate * (0.35 + intensity * 0.15));
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1);
    }

    const source = this.ctx.createBufferSource();
    source.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(300, now);
    filter.frequency.exponentialRampToValueAtTime(Math.min(3000, 1200 + intensity * 500), now + 0.12);
    filter.frequency.exponentialRampToValueAtTime(200, now + 0.4);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.01, now);
    gain.gain.exponentialRampToValueAtTime(Math.min(0.8, 0.3 + intensity * 0.15), now + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    source.start(now);

    for (let i = 0; i < 4; i++) {
      setTimeout(() => this.playSnap(0.3 + Math.random() * 0.3), 30 + i * 40);
    }
  }

  public playMaxEruption() {
    this.init();
    if (!this.ctx) return;
    if (this.ctx.state === "suspended") this.ctx.resume();

    const now = this.ctx.currentTime;
    const bufferSize = Math.floor(this.ctx.sampleRate * 1.8);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1);
    }

    const source = this.ctx.createBufferSource();
    source.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(250, now);
    filter.frequency.exponentialRampToValueAtTime(3500, now + 0.35);
    filter.frequency.exponentialRampToValueAtTime(150, now + 1.8);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.05, now);
    gain.gain.exponentialRampToValueAtTime(0.85, now + 0.25);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 1.8);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    source.start(now);

    for (let i = 0; i < 18; i++) {
      setTimeout(() => this.playSnap(0.4 + Math.random() * 0.45), 50 + i * 55);
    }
  }
}

export default function EmberTheme({
  form,
  responses,
  setResponses,
  isSubmitting,
  paymentConfirmed,
  setPaymentConfirmed,
  isSuccess,
  errorMsg,
  errorField,
  handleSubmit,
  showUndertakingModal,
  setShowUndertakingModal,
  currentUndertakingField,
  setCurrentUndertakingField,
  totalPaymentAmount
}: ThemeProps) {

  // Dynamic States
  const [flamePower, setFlamePower] = useState(0); // 0% to 100%
  const [isShowerActive, setIsShowerActive] = useState(false);
  const [hasRevealedForm, setHasRevealedForm] = useState(false);
  const [stokedLogsCount, setStokedLogsCount] = useState(0);

  // Audio & Ambiance
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [clickSparks, setClickSparks] = useState<{ id: number; x: number; y: number }[]>([]);
  const [achievementToast, setAchievementToast] = useState<string | null>(null);
  const [shootingStar, setShootingStar] = useState<{ id: number; startX: number; startY: number } | null>(null);
  const [marshmallowToastLevel, setMarshmallowToastLevel] = useState(0);

  const audioSystemRef = useRef<BonfireAudioSystem | null>(null);
  const lastClickTimeRef = useRef<number>(0);
  const holdIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isHoldingRef = useRef(false);

  // Initialize Audio System once on client
  useEffect(() => {
    audioSystemRef.current = new BonfireAudioSystem();
    return () => {
      audioSystemRef.current?.stop();
      if (holdIntervalRef.current) {
        clearInterval(holdIntervalRef.current);
      }
    };
  }, []);

  const stopHolding = useCallback(() => {
    if (holdIntervalRef.current) {
      clearInterval(holdIntervalRef.current);
      holdIntervalRef.current = null;
    }
    isHoldingRef.current = false;
  }, []);

  // ONLY decay when the form is NOT opened yet and user is not holding (the fast click/hold challenge!)
  // Once the form is opened, decay is completely disabled.
  useEffect(() => {
    if (isShowerActive || hasRevealedForm) return;

    const decayInterval = setInterval(() => {
      if (isHoldingRef.current) return;

      setFlamePower((prev) => {
        if (prev <= 0) return 0;
        return Math.max(0, prev - 1.8);
      });
    }, 60);

    return () => clearInterval(decayInterval);
  }, [isShowerActive, hasRevealedForm]);

  const toggleAudio = useCallback(() => {
    if (!audioSystemRef.current) return;
    if (isAudioPlaying) {
      audioSystemRef.current.stop();
      setIsAudioPlaying(false);
    } else {
      audioSystemRef.current.start();
      setIsAudioPlaying(true);
      showAchievement("🎧 Bonfire crackles & night crickets sound ON!");
    }
  }, [isAudioPlaying]);

  const showAchievement = (msg: string) => {
    setAchievementToast(msg);
    setTimeout(() => {
      setAchievementToast((prev) => (prev === msg ? null : prev));
    }, 3200);
  };

  // Trigger Maximum Bottom Shower Eruption
  const triggerMaxEruption = useCallback(() => {
    stopHolding();
    setIsShowerActive(true);
    audioSystemRef.current?.playMaxEruption();
    showAchievement("💥 MAXIMUM INFERNO! Bonfire Embers Shower! 🔥✨");

    // Reveal the form smoothly
    setTimeout(() => {
      setHasRevealedForm(true);
    }, 1200);

    // Cooldown and reset so user can repeat anytime
    setTimeout(() => {
      setIsShowerActive(false);
      setFlamePower(0);
    }, 3200);
  }, [stopHolding]);

  const emitBonfireSpark = (x: number, y: number) => {
    const sparkId = Date.now() + Math.random();
    setClickSparks((prev) => [...prev.slice(-15), { id: sparkId, x, y }]);
    setTimeout(() => {
      setClickSparks((prev) => prev.filter((s) => s.id !== sparkId));
    }, 1000);
  };

  // Tap handler (works for both fast clicks and initial touch down)
  const handleBonfireTap = (clientX?: number, clientY?: number, rect?: DOMRect) => {
    if (isShowerActive || hasRevealedForm) return;

    const now = Date.now();
    const interval = now - lastClickTimeRef.current;
    lastClickTimeRef.current = now;

    if (!isAudioPlaying) {
      audioSystemRef.current?.start();
      setIsAudioPlaying(true);
    } else {
      audioSystemRef.current?.playStokeWhoosh(interval < 250 ? 2.0 : 1.2);
    }

    const sparkX = clientX !== undefined && rect ? clientX - rect.left : 100;
    const sparkY = clientY !== undefined && rect ? clientY - rect.top : 100;
    emitBonfireSpark(sparkX, sparkY);

    const boost = interval < 200 ? 18 : interval < 350 ? 13 : 9;
    setFlamePower((prev) => {
      const nextPower = prev + boost;
      if (nextPower >= 100) {
        triggerMaxEruption();
        return 100;
      }
      return nextPower;
    });
  };

  // Pointer down handler: supports immediate tap and continuous hold-to-charge
  const handleBonfirePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    if (isShowerActive || hasRevealedForm) return;

    const target = e.currentTarget;
    try {
      target.setPointerCapture(e.pointerId);
    } catch {}

    const rect = target.getBoundingClientRect();
    isHoldingRef.current = true;

    // Instant boost and spark on press
    handleBonfireTap(e.clientX, e.clientY, rect);

    // Continuous hold loop: builds power smoothly proportional to time held (~35% per second)
    let ticks = 0;
    if (holdIntervalRef.current) clearInterval(holdIntervalRef.current);

    holdIntervalRef.current = setInterval(() => {
      if (isShowerActive || hasRevealedForm) {
        stopHolding();
        return;
      }

      ticks++;
      setFlamePower((prev) => {
        const nextPower = prev + 1.4;
        if (nextPower >= 100) {
          triggerMaxEruption();
          stopHolding();
          return 100;
        }
        return nextPower;
      });

      // Embers crackle and spark periodically while holding
      if (ticks % 5 === 0) {
        audioSystemRef.current?.playSnap(0.3 + Math.random() * 0.3);
        const sparkX = rect.width / 2 + (Math.random() - 0.5) * 80;
        const sparkY = rect.height / 2 + (Math.random() - 0.5) * 80;
        emitBonfireSpark(sparkX, sparkY);
      }

      // Whoosh sound every ~600ms of holding
      if (ticks % 15 === 0) {
        audioSystemRef.current?.playStokeWhoosh(1.3);
      }
    }, 40);
  };

  const handleBonfirePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}
    stopHolding();
  };

  const handleBonfirePointerCancel = (e: React.PointerEvent<HTMLDivElement>) => {
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}
    stopHolding();
  };

  // Bonfire Click Handler for post-reveal / dock / victory fire
  const handleBonfireClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const now = Date.now();
    const interval = now - lastClickTimeRef.current;
    lastClickTimeRef.current = now;

    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    if (!isAudioPlaying) {
      audioSystemRef.current?.start();
      setIsAudioPlaying(true);
    } else {
      audioSystemRef.current?.playStokeWhoosh(hasRevealedForm ? 1.0 : (interval < 250 ? 2.0 : 1.2));
    }

    emitBonfireSpark(clickX, clickY);

    if (isShowerActive) return;

    if (hasRevealedForm) {
      // Normal stoking mode once form is open
      const newLogs = stokedLogsCount + 1;
      setStokedLogsCount(newLogs);
      const msg = CAMP_VIBE_ACHIEVEMENTS[newLogs % CAMP_VIBE_ACHIEVEMENTS.length];
      showAchievement(msg);
    } else {
      handleBonfireTap(e.clientX, e.clientY, rect);
    }
  };

  // Sky click creates shooting star (only on open sky, never on bonfire or interactive elements)
  const handleSkyClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (
      target.closest("main") || 
      target.closest("button") || 
      target.closest("[data-bonfire]") || 
      target.closest(".cursor-pointer")
    ) {
      return;
    }
    const startX = e.clientX;
    const startY = e.clientY;
    const starId = Date.now();
    setShootingStar({ id: starId, startX, startY });
    setTimeout(() => {
      setShootingStar((prev) => (prev?.id === starId ? null : prev));
    }, 1000);
  };

  // Marshmallow Roaster Mini-Game
  const handleRoastMarshmallow = (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextLevel = (marshmallowToastLevel + 1) % 5;
    setMarshmallowToastLevel(nextLevel);
    audioSystemRef.current?.playSnap(0.4);

    const stages = [
      "🍢 Fresh white marshmallow ready to roast!",
      "🍢 Warming up nicely by the campfire embers...",
      "🍢 Golden brown perfection! Pure campfire bliss ✨",
      "🍢 Caramelized and gooey, ready to enjoy! 😋",
      "🍢 Extra crispy and charred, but still delicious! 🔥"
    ];
    showAchievement(stages[nextLevel]);
  };

  // Scale is clamped strictly between 0.55 and 0.90 so it stays INSIDE the circle without overflowing!
  const currentFlameScale = 0.55 + (flamePower / 100) * 0.35;

  return (
    <div 
      onClick={handleSkyClick}
      className="min-h-screen flex flex-col items-center justify-center p-3 sm:p-6 bg-[#040810] relative overflow-hidden font-sans text-amber-50 selection:bg-orange-600/40 selection:text-orange-200"
    >
      
      {/* ================= BACKGROUND: NIGHT SKY, MOUNTAINS, PINELINES & BONFIRE GLOW ================= */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_#0d1a2c_0%,_#070f1a_50%,_#020509_100%)]" />

        {/* Ambient Warm Campfire Glow from the bottom */}
        <motion.div 
          animate={{ 
            opacity: [
              0.55 + (flamePower / 100) * 0.35, 
              0.8 + (flamePower / 100) * 0.35, 
              0.6 + (flamePower / 100) * 0.35
            ],
            scale: [1, 1.02 + (flamePower / 100) * 0.15, 1]
          }}
          transition={{ duration: Math.max(0.8, 3.2 - (flamePower / 100) * 2), repeat: Infinity, ease: "easeInOut" }}
          className="absolute -bottom-32 left-1/2 -translate-x-1/2 w-[120vw] sm:w-[90vw] h-[580px] bg-[radial-gradient(ellipse_at_bottom,_rgba(249,115,22,0.45)_0%,_rgba(234,88,12,0.25)_35%,_rgba(180,83,9,0.1)_65%,_transparent_80%)] blur-[90px]"
        />

        {/* Screen flash on maximum eruption */}
        {isShowerActive && (
          <motion.div 
            initial={{ opacity: 0.8 }}
            animate={{ opacity: 0 }}
            transition={{ duration: 1.2 }}
            className="fixed inset-0 bg-gradient-to-t from-orange-500/30 via-amber-400/15 to-transparent pointer-events-none z-30"
          />
        )}

        {/* Crescent Moon */}
        <div className="absolute top-10 right-12 w-24 h-24 rounded-full bg-amber-100/10 blur-[50px]" />
        <div className="absolute top-12 right-16 w-8 h-8 rounded-full bg-gradient-to-tr from-amber-100 to-amber-200/80 shadow-[0_0_20px_rgba(254,243,199,0.4)] opacity-85">
          <div className="w-full h-full rounded-full bg-[#08101a] translate-x-1.5 -translate-y-0.5" />
        </div>

        {/* Twinkling Stars */}
        {STARS.map((star, idx) => (
          <motion.div
            key={idx}
            animate={{ 
              opacity: [0.2, 0.95, 0.3],
              scale: [0.8, 1.25, 0.8] 
            }}
            transition={{ 
              duration: star.dur, 
              repeat: Infinity, 
              delay: star.delay, 
              ease: "easeInOut" 
            }}
            style={{ 
              top: star.top, 
              left: star.left, 
              width: star.size, 
              height: star.size 
            }}
            className="absolute rounded-full bg-amber-100 shadow-[0_0_6px_rgba(254,243,199,0.8)]"
          />
        ))}

        {/* Interactive Shooting Star Animation on Sky Click (appears precisely where user clicks) */}
        {shootingStar && (
          <div 
            key={shootingStar.id}
            style={{ 
              position: "fixed", 
              left: shootingStar.startX, 
              top: shootingStar.startY, 
              pointerEvents: "none",
              zIndex: 30 
            }}
          >
            {/* Click Sparkle point right at cursor */}
            <motion.div
              initial={{ scale: 0, opacity: 1, rotate: 0 }}
              animate={{ scale: [0, 1.4, 0], opacity: [1, 1, 0], rotate: 45 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="absolute -left-3 -top-3 w-6 h-6 flex items-center justify-center text-sm pointer-events-none"
            >
              ✨
            </motion.div>

            {/* Streaking shooting star tail shooting across from the click point */}
            <motion.div
              initial={{ x: 0, y: 0, opacity: 1, scaleX: 0.5 }}
              animate={{ x: 260, y: 150, opacity: 0, scaleX: 3.0 }}
              transition={{ duration: 0.75, ease: "easeOut" }}
              className="absolute left-0 top-0 w-24 h-[2px] bg-gradient-to-r from-white via-amber-200 to-transparent rotate-25 origin-left shadow-[0_0_14px_#fff] rounded-full pointer-events-none"
            />
          </div>
        )}

        {/* Mountain Silhouette layer */}
        <svg 
          className="absolute bottom-0 left-0 w-full h-64 text-[#060b13] opacity-65" 
          viewBox="0 0 1440 320" 
          preserveAspectRatio="none"
          fill="currentColor"
        >
          <path d="M0,224L60,208C120,192,240,160,360,165.3C480,171,600,213,720,208C840,203,960,149,1080,144C1200,139,1320,181,1380,202.7L1440,224L1440,320L1380,320C1320,320,1200,320,1080,320C960,320,840,320,720,320C600,320,480,320,360,320C240,320,120,320,60,320L0,320Z" />
        </svg>

        {/* Pine Trees Silhouette layer */}
        <svg 
          className="absolute bottom-0 left-0 w-full h-36 text-[#020406] opacity-85" 
          viewBox="0 0 1200 120" 
          preserveAspectRatio="none"
          fill="currentColor"
        >
          <path d="M0,120 L20,95 L25,120 L50,85 L55,120 L80,90 L90,120 L120,75 L130,120 L160,95 L170,120 L210,80 L220,120 L260,90 L275,120 L310,70 L325,120 L370,85 L385,120 L430,75 L445,120 L490,90 L505,120 L550,70 L565,120 L610,85 L625,120 L670,75 L685,120 L730,90 L745,120 L790,65 L805,120 L850,85 L865,120 L910,75 L925,120 L970,90 L985,120 L1020,70 L1035,120 L1080,85 L1095,120 L1140,75 L1155,120 L1200,85 L1200,120 Z" />
        </svg>

        {/* Ambient background rising embers */}
        {AMBIENT_EMBERS.map((ember) => (
          <motion.div
            key={ember.id}
            initial={{ y: "105vh", x: 0, opacity: 0 }}
            animate={{ 
              y: "-15vh", 
              x: [0, ember.xDrift, ember.xDrift * -0.6, ember.xDrift * 0.8],
              opacity: [0, 0.9, 0.8, 0.4, 0]
            }}
            transition={{
              duration: ember.duration,
              repeat: Infinity,
              delay: ember.delay,
              ease: "easeOut"
            }}
            style={{
              position: "absolute",
              left: ember.left,
              bottom: 0,
              width: `${ember.size}px`,
              height: `${ember.size * 1.2}px`,
              borderRadius: "50%",
              background: "radial-gradient(circle, #fef08a 0%, #f97316 60%, #ea580c 100%)",
              boxShadow: "0 0 10px #f97316, 0 0 18px #ea580c"
            }}
          />
        ))}
      </div>

      {/* ================= MASSIVE MAXIMUM ERUPTION SHOWER FROM BOTTOM IN DIFFERENT SIZES ================= */}
      <AnimatePresence>
        {isShowerActive && (
          <div className="fixed inset-0 z-50 pointer-events-none overflow-hidden">
            {ERUPTION_SHOWER_PARTICLES.map((particle) => (
              <motion.div
                key={particle.id}
                initial={{ 
                  y: "105vh", 
                  x: 0, 
                  opacity: 0, 
                  scale: 0.3 
                }}
                animate={{ 
                  y: "-125vh", 
                  x: [0, particle.xDrift * 0.4, particle.xDrift, particle.xDrift * 1.3],
                  opacity: [0, 1, 0.95, 0.8, 0],
                  scale: [0.4, 1.4, 1.1, 0.5]
                }}
                transition={{
                  duration: particle.duration,
                  delay: particle.delay,
                  ease: [0.15, 0.85, 0.35, 1.0]
                }}
                style={{
                  position: "absolute",
                  left: particle.left,
                  bottom: "-60px",
                  width: `${particle.size}px`,
                  height: `${particle.size * 1.2}px`,
                  borderRadius: particle.type === "giant" ? "50%" : "50% 50% 40% 40%",
                  background: particle.type === "giant" 
                    ? "radial-gradient(circle at 35% 35%, #fff 0%, #fef08a 20%, #f97316 55%, #c2410c 100%)"
                    : particle.type === "large"
                      ? "radial-gradient(circle at 35% 35%, #fef08a 0%, #f97316 50%, #ea580c 100%)"
                      : "radial-gradient(circle, #fff 0%, #fef08a 35%, #f97316 100%)",
                  boxShadow: particle.type === "giant" 
                    ? "0 0 35px #f97316, 0 0 65px #ea580c, 0 0 95px rgba(234, 88, 12, 0.8)"
                    : particle.type === "large"
                      ? "0 0 20px #f97316, 0 0 40px #ea580c"
                      : "0 0 12px #f97316, 0 0 24px #ea580c"
                }}
              />
            ))}
          </div>
        )}
      </AnimatePresence>

      {/* ================= FLOATING DOCK (Audio, Marshmallow & Stoke Trigger) ================= */}
      <div className="fixed top-4 right-4 z-40 flex items-center gap-2">
        <button
          type="button"
          onClick={handleRoastMarshmallow}
          title="Click to roast your marshmallow!"
          className="group relative flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-[#0b1420]/85 backdrop-blur-xl border border-orange-500/30 hover:border-orange-500/60 transition-all shadow-lg hover:scale-105 active:scale-95"
        >
          <span className="text-xl transition-transform group-hover:rotate-12 select-none">
            {marshmallowToastLevel === 0 && "🍢"}
            {marshmallowToastLevel === 1 && "🍡"}
            {marshmallowToastLevel === 2 && "🥞"}
            {marshmallowToastLevel === 3 && "🍯"}
            {marshmallowToastLevel === 4 && "🍫"}
          </span>
          <span className="text-xs font-bold text-orange-300 hidden sm:inline">
            {marshmallowToastLevel === 0 && "Marshmallow"}
            {marshmallowToastLevel === 1 && "Warm"}
            {marshmallowToastLevel === 2 && "Golden 🔥"}
            {marshmallowToastLevel === 3 && "Crispy ✨"}
            {marshmallowToastLevel === 4 && "Charred 😋"}
          </span>
        </button>

        {hasRevealedForm && (
          <button
            type="button"
            onClick={handleBonfireClick}
            title="Add a log to the fire!"
            className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-orange-500/15 hover:bg-orange-500/30 border border-orange-400/40 text-orange-300 text-xs font-bold backdrop-blur-xl transition-all shadow-lg hover:scale-105 active:scale-95"
          >
            <span>🔥 Click Fire</span>
            {stokedLogsCount > 0 && <span className="text-[10px] bg-orange-500 text-black px-1.5 py-0.2 rounded font-mono">{stokedLogsCount}</span>}
          </button>
        )}

        {hasRevealedForm && (
          <button
            type="button"
            onClick={triggerMaxEruption}
            title="Celebrate with an ember shower!"
            className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-[#0b1420]/85 hover:bg-orange-500/20 border border-orange-500/30 hover:border-orange-400/50 text-amber-200 text-xs font-bold backdrop-blur-xl transition-all shadow-lg hover:scale-105 active:scale-95 hidden md:flex"
          >
            <span>✨ Shower</span>
          </button>
        )}

        <button
          type="button"
          onClick={toggleAudio}
          className={`flex items-center gap-2 px-3 sm:px-3.5 py-2 rounded-2xl backdrop-blur-xl border transition-all shadow-lg ${
            isAudioPlaying 
              ? 'bg-orange-500/20 border-orange-500/50 text-orange-300 shadow-[0_0_20px_rgba(249,115,22,0.25)]' 
              : 'bg-[#0b1420]/85 border-white/10 text-amber-200/70 hover:border-orange-500/30 hover:text-white'
          }`}
          title={isAudioPlaying ? "Mute Bonfire Audio" : "Play Bonfire & Night Ambiance"}
        >
          {isAudioPlaying ? (
            <div className="flex items-center gap-1 h-3.5">
              <span className="w-1 bg-orange-400 rounded-full animate-pulse h-3" />
              <span className="w-1 bg-orange-400 rounded-full animate-pulse h-4" style={{ animationDelay: '0.15s' }} />
              <span className="w-1 bg-orange-400 rounded-full animate-pulse h-2" style={{ animationDelay: '0.3s' }} />
            </div>
          ) : (
            <svg className="w-4 h-4 text-amber-200/60" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" /></svg>
          )}
          <span className="text-xs font-bold uppercase tracking-wider hidden sm:inline">
            {isAudioPlaying ? "Sound ON" : "Sound"}
          </span>
        </button>
      </div>

      {/* Floating Camp Toast / Achievement Popups */}
      <AnimatePresence>
        {achievementToast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -15, scale: 0.9 }}
            className="fixed top-20 z-50 px-5 py-2.5 rounded-2xl bg-[#0e1927]/95 border border-orange-500/40 text-amber-100 text-sm font-bold shadow-[0_0_30px_rgba(249,115,22,0.3)] backdrop-blur-xl flex items-center gap-2.5 max-w-[90vw] text-center"
          >
            <span>{achievementToast}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ================= BEFORE FORM OPENS: SPEED CHALLENGE HERO ================= */}
      {!hasRevealedForm ? (
        <div className="w-full max-w-xl flex flex-col items-center z-20 my-auto text-center px-4">
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-gradient-to-r from-orange-500/15 via-amber-500/25 to-orange-500/15 border border-orange-500/40 rounded-full text-xs font-extrabold tracking-widest text-orange-300 uppercase mb-3 shadow-[0_0_25px_rgba(249,115,22,0.2)]">
              <span>EMBER 2026 • OVERNIGHT CAMPING RETREAT</span>
              <span>⛺</span>
            </div>
            
            <h1 className="text-4xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-100 via-orange-200 to-amber-300 tracking-tight">
              {form.name}
            </h1>
            
            <p className="text-amber-200/80 text-sm sm:text-base mt-2 font-medium max-w-md mx-auto">
              🔥 <span className="font-bold text-orange-400">Tap or hold fire</span> to reach 100% & open the form!
            </p>
          </motion.div>

          {/* Interactive Fast-Click / Hold Fire Container */}
          <div className="relative flex flex-col items-center">
            
            {/* The circular boundary container: flame NEVER exceeds this circle! */}
            <div 
              data-bonfire="true"
              onPointerDown={handleBonfirePointerDown}
              onPointerUp={handleBonfirePointerUp}
              onPointerCancel={handleBonfirePointerCancel}
              onPointerLeave={handleBonfirePointerCancel}
              onContextMenu={(e) => e.preventDefault()}
              onClick={(e) => e.stopPropagation()}
              tabIndex={0}
              role="button"
              aria-label="Bonfire - tap or hold to build heat"
              className="relative w-48 h-48 sm:w-56 sm:h-56 rounded-full border-2 border-orange-500/40 bg-gradient-to-b from-[#101b2a]/95 to-[#070e17]/95 shadow-[0_0_40px_rgba(249,115,22,0.3)] flex items-center justify-center cursor-pointer select-none overflow-hidden group touch-none active:scale-[0.98] transition-transform"
              title="Click or hold to grow the fire!"
            >
              {/* Sparks flying from click / hold points */}
              {clickSparks.map((spark) => (
                <motion.div
                  key={spark.id}
                  initial={{ scale: 0.6, opacity: 1, y: 0 }}
                  animate={{ scale: 2.0, opacity: 0, y: -40 }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                  style={{ left: spark.x, top: spark.y }}
                  className="absolute pointer-events-none text-2xl z-30"
                >
                  ✨
                </motion.div>
              ))}

              {/* Ambient radial glow inside circle */}
              <motion.div 
                animate={{ opacity: [0.35, 0.7, 0.35] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                className="absolute inset-0 bg-radial from-orange-500/30 via-amber-600/10 to-transparent rounded-full pointer-events-none"
              />

              {/* Smooth spring-scaled flame wrapper (strictly 0.55 to 0.90 inside circle!) */}
              <motion.div 
                animate={{ scale: currentFlameScale }}
                transition={{ type: "spring", stiffness: 140, damping: 20 }}
                className="relative flex items-center justify-center z-10 pointer-events-none"
              >
                <motion.div
                  animate={{ rotate: [-1.5, 1.5, -1.5] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                  className="flex items-center justify-center"
                >
                  <span 
                    className="text-7xl sm:text-8xl select-none"
                    style={{
                      filter: `drop-shadow(0 0 ${10 + flamePower * 0.25}px #f97316) drop-shadow(0 0 ${20 + flamePower * 0.3}px #ea580c)`
                    }}
                  >
                    🔥
                  </span>
                </motion.div>

                {flamePower > 60 && (
                  <motion.span 
                    animate={{ scale: [1, 1.25, 1], opacity: [0.7, 1, 0.7] }}
                    transition={{ duration: 0.3, repeat: Infinity }}
                    className="absolute text-3xl select-none -top-1 filter drop-shadow-[0_0_10px_#fef08a]"
                  >
                    ⚡
                  </motion.span>
                )}
              </motion.div>
            </div>

            {/* Firewood Logs Base */}
            <div className="relative -mt-3 flex items-center justify-center pointer-events-none">
              <div className="w-24 h-4 bg-[#381e0f] rounded-full border border-amber-900/60 rotate-12 shadow-lg" />
              <div className="w-24 h-4 bg-[#281409] rounded-full border border-amber-900/60 -rotate-12 shadow-lg -ml-20" />
            </div>

            {/* Live Energy Progress Bar */}
            <div className="mt-5 text-center select-none">
              <div className="flex items-center gap-2 justify-center mb-1.5">
                <span className="text-xs font-black uppercase tracking-widest text-orange-300">
                  {flamePower >= 95 ? "💥 MAXIMUM ROAR!" : flamePower >= 60 ? "🔥 HEAT SURGING!" : "🪵 TAP OR HOLD TO BUILD HEAT!"}
                </span>
                <span className="text-xs font-mono font-black text-amber-200 bg-orange-500/20 px-2 py-0.5 rounded-md border border-orange-400/30">
                  {Math.round(flamePower)}%
                </span>
              </div>

              <div className="w-48 sm:w-64 h-2.5 bg-black/60 rounded-full p-0.5 border border-orange-500/30 shadow-inner overflow-hidden mx-auto">
                <motion.div 
                  className="h-full rounded-full bg-gradient-to-r from-amber-500 via-orange-500 to-amber-300 shadow-[0_0_12px_#f97316]"
                  style={{ width: `${Math.min(100, Math.max(0, flamePower))}%` }}
                />
              </div>
              
              <p className="text-[11px] text-amber-200/60 font-semibold mt-1.5">
                Reach 100% to shower embers & open form!
              </p>
            </div>

            {/* Direct Skip Option */}
            <button
              type="button"
              onClick={() => setHasRevealedForm(true)}
              className="mt-6 text-xs text-amber-200/50 hover:text-orange-300 underline underline-offset-4 font-semibold transition-colors"
            >
              Skip intro & open form directly 🏕️
            </button>

          </div>
        </div>
      ) : null}

      {/* ================= REGISTRATION FORM (CLEAN, ELEGANT, UNCLUTTERED) ================= */}
      <AnimatePresence>
        {hasRevealedForm && (
          <motion.main 
            initial={{ opacity: 0, y: 40, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30 }}
            transition={{ type: "spring", stiffness: 95, damping: 20 }}
            className="w-full max-w-xl bg-[#09111c]/92 backdrop-blur-2xl border border-orange-500/25 shadow-[0_0_60px_rgba(249,115,22,0.18)] rounded-3xl p-6 sm:p-10 relative z-10 my-4 sm:my-8"
          >
            {/* Top Amber Accent Line */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-600 via-orange-500 to-amber-400 rounded-t-3xl shadow-[0_0_15px_rgba(249,115,22,0.7)]" />

            {isSuccess ? (
              /* ================= SUCCESS STATE ================= */
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: "spring", damping: 20 }}
                className="text-center py-10 sm:py-14 relative"
              >
                <div 
                  onClick={handleBonfireClick}
                  className="relative inline-flex items-center justify-center mb-6 cursor-pointer group"
                  title="Click to add another log to the victory fire!"
                >
                  <motion.div 
                    animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.9, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute inset-0 bg-gradient-to-tr from-orange-600 to-amber-400 rounded-full blur-2xl"
                  />
                  <div className="relative w-24 h-24 rounded-3xl bg-gradient-to-b from-orange-500/20 to-amber-950/60 border border-orange-500/40 flex flex-col items-center justify-center shadow-[0_0_35px_rgba(249,115,22,0.5)] group-hover:scale-105 transition-transform">
                    <span className="text-5xl select-none animate-bounce">🔥</span>
                    <span className="text-[10px] text-orange-300 font-extrabold uppercase tracking-widest mt-1">Click Fire</span>
                  </div>
                </div>

                <div className="inline-block px-3.5 py-1 bg-orange-500/15 border border-orange-500/40 rounded-full text-xs font-bold tracking-widest text-orange-400 uppercase mb-4">
                  Reservation Confirmed ⛺
                </div>

                <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4 tracking-tight">
                  You're Going Camping! 🌌
                </h2>

                <p className="text-amber-100/80 text-base sm:text-lg leading-relaxed max-w-md mx-auto">
                  Your spot for <span className="text-orange-400 font-bold">{form.name}</span> is locked in! Pack your warm jacket, sleeping bag, and get ready for a memorable night around the bonfire with great people and music.
                </p>

                {form.isPaymentEnabled && totalPaymentAmount > 0 && (
                  <div className="mt-8 p-4 rounded-2xl bg-orange-950/40 border border-orange-500/30 text-amber-200 text-sm max-w-md mx-auto flex items-center gap-3 text-left">
                    <div className="w-9 h-9 rounded-xl bg-orange-500/20 border border-orange-400/40 flex items-center justify-center flex-shrink-0 text-orange-400">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </div>
                    <p>
                      Your camping access pass and registration ticket will be sent to your email as soon as payment verification is completed.
                    </p>
                  </div>
                )}

                <div className="mt-8 pt-6 border-t border-white/5 flex flex-wrap items-center justify-center gap-5 text-xs text-amber-200/60 uppercase tracking-widest font-semibold">
                  <span className="flex items-center gap-1.5">🏕️ Tent Reserved</span>
                  <span>•</span>
                  <span className="flex items-center gap-1.5">🔥 Fire Clicks: {stokedLogsCount}</span>
                  <span>•</span>
                  <span className="flex items-center gap-1.5">✨ Overnight Stay</span>
                </div>
              </motion.div>
            ) : (
              /* ================= PRISTINE, CLEAN FORM CONTENT ================= */
              <>
                <div className="mb-8 text-center relative">
                  
                  {/* Event Subtitle Badge */}
                  <div 
                    onClick={handleBonfireClick}
                    className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-gradient-to-r from-orange-500/15 via-amber-500/20 to-orange-500/15 border border-orange-500/35 rounded-full text-xs font-bold tracking-widest text-orange-300 uppercase mb-4 shadow-[0_0_20px_rgba(249,115,22,0.15)] cursor-pointer hover:border-orange-400/60 transition-colors"
                    title="Tap badge to feed the fire!"
                  >
                    <span className="w-2 h-2 rounded-full bg-orange-400 animate-pulse" />
                    <span>CAMP EMBER • OVERNIGHT RETREAT</span>
                    <span>🏕️</span>
                  </div>

                  <h2 className="text-3xl sm:text-4xl font-black mb-3 text-transparent bg-clip-text bg-gradient-to-r from-amber-100 via-orange-200 to-amber-300 tracking-tight">
                    {form.name}
                  </h2>

                  {/* Moving Infinite Highlights Carousel (Moving from Left to Right continuously) */}
                  <div className="w-full overflow-hidden py-1.5 my-3 relative select-none">
                    {/* Left and right fade gradient mask for smooth edges */}
                    <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-[#09111c] to-transparent z-10 pointer-events-none" />
                    <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-[#09111c] to-transparent z-10 pointer-events-none" />

                    <motion.div
                      className="flex items-center gap-2.5 whitespace-nowrap will-change-transform"
                      animate={{ x: ["-50%", "0%"] }}
                      transition={{
                        x: {
                          repeat: Infinity,
                          repeatType: "loop",
                          duration: 22,
                          ease: "linear",
                        },
                      }}
                    >
                      {[...CAMP_HIGHLIGHTS, ...CAMP_HIGHLIGHTS, ...CAMP_HIGHLIGHTS, ...CAMP_HIGHLIGHTS].map((item, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-500/10 border border-orange-500/25 text-amber-100/90 text-xs font-semibold shadow-sm backdrop-blur-sm flex-shrink-0 hover:border-orange-400/50 hover:bg-orange-500/20 transition-colors"
                        >
                          <span>{item.icon}</span>
                          <span>{item.label}</span>
                        </span>
                      ))}
                    </motion.div>
                  </div>

                  {form.description ? (
                    <div className="p-4 rounded-2xl bg-[#0e1724]/70 border border-orange-500/15 text-left text-sm text-amber-100/75 leading-relaxed whitespace-pre-wrap">
                      {form.description}
                    </div>
                  ) : (
                    <p className="text-amber-100/60 text-sm">
                      Please enter your details below to reserve your tent and overnight access pass.
                    </p>
                  )}
                </div>

                {/* Form Inputs */}
                <form onSubmit={handleSubmit} className="space-y-6" noValidate>
                  
                  {/* Error Notification */}
                  <AnimatePresence>
                    {errorMsg && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0, y: -8 }} 
                        animate={{ opacity: 1, height: 'auto', y: 0 }} 
                        exit={{ opacity: 0, height: 0 }}
                        className="bg-red-500/15 text-red-300 px-4 py-3.5 rounded-2xl border border-red-500/30 text-sm font-semibold flex items-center gap-3 overflow-hidden shadow-lg shadow-red-950/40"
                      >
                        <div className="w-8 h-8 rounded-xl bg-red-500/20 flex items-center justify-center flex-shrink-0 text-red-400">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                        </div>
                        <span>{errorMsg}</span>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Form Fields */}
                  {form.fields.map((field: any, idx: number) => (
                    <div 
                      key={idx} 
                      id={`field-${field.label.replace(/\s+/g, '-')}`}
                      className={`space-y-2.5 transition-all p-3 rounded-2xl ${
                        errorField === field.label 
                          ? 'ring-1 ring-red-500/60 bg-red-500/5 -mx-1' 
                          : 'hover:bg-white/[0.02]'
                      }`}
                    >
                      <label className="block text-sm font-bold text-amber-100/90 tracking-wide">
                        {field.label} {field.required && <span className="text-orange-400 ml-1 font-mono">*</span>}
                      </label>

                      {/* Dropdown */}
                      {field.type === 'dropdown' ? (
                        <div className="relative">
                          <select
                            required={field.required}
                            value={responses[field.label] || ""}
                            onChange={(e) => setResponses({ ...responses, [field.label]: e.target.value })}
                            disabled={isSubmitting}
                            className="w-full bg-[#0b1420] border border-orange-500/20 rounded-xl px-4 py-3.5 text-amber-50 appearance-none focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all cursor-pointer disabled:opacity-50 text-base"
                          >
                            <option value="" disabled className="bg-[#0b1420] text-gray-400">Choose an option...</option>
                            {(field.type === 'dynamic_pricing' ? (field.dynamicPricingOptions || []).map((o: any) => o.label) : field.options)?.map((opt: string, i: number) => (
                              <option key={i} value={opt} className="bg-[#0b1420] text-white">{opt}</option>
                            ))}
                          </select>
                          <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-orange-400">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                          </div>
                        </div>
                      ) : field.type === 'radio' || field.type === 'dynamic_pricing' ? (
                        /* Radio or Dynamic Pricing */
                        <div className="space-y-2.5 pt-1">
                          {field.type === 'dynamic_pricing' ? (
                            (field.dynamicPricingOptions || []).map((opt: any, i: number) => {
                              const isSelected = responses[field.label] === opt.label;
                              return (
                                <label 
                                  key={i} 
                                  className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all ${
                                    isSelected 
                                      ? 'bg-orange-500/15 border-orange-500/60 shadow-[0_0_20px_rgba(249,115,22,0.15)]' 
                                      : 'bg-[#0b1420]/70 border-white/10 hover:border-orange-500/30 hover:bg-[#0b1420]'
                                  }`}
                                >
                                  <div className="flex items-center gap-3.5 min-w-0">
                                    <input
                                      type="radio"
                                      name={field.label}
                                      value={opt.label}
                                      required={field.required}
                                      checked={isSelected}
                                      onChange={(e) => setResponses({ ...responses, [field.label]: e.target.value })}
                                      disabled={isSubmitting}
                                      className="w-5 h-5 text-orange-500 bg-black/60 border-orange-400/40 focus:ring-orange-500 cursor-pointer"
                                    />
                                    <span className="font-semibold text-amber-100 truncate">{opt.label}</span>
                                  </div>
                                  <span className="px-3 py-1 bg-orange-500/20 border border-orange-400/40 rounded-lg text-orange-300 font-bold text-sm tracking-wide flex-shrink-0">
                                    ₹{opt.price}
                                  </span>
                                </label>
                              );
                            })
                          ) : (
                            field.options?.map((opt: string, i: number) => {
                              const isSelected = responses[field.label] === opt;
                              return (
                                <label 
                                  key={i} 
                                  className={`flex items-center gap-3.5 p-3.5 rounded-xl border cursor-pointer transition-all ${
                                    isSelected 
                                      ? 'bg-orange-500/15 border-orange-500/60 shadow-[0_0_15px_rgba(249,115,22,0.15)]' 
                                      : 'bg-[#0b1420]/70 border-white/10 hover:border-orange-500/30 hover:bg-[#0b1420]'
                                  }`}
                                >
                                  <input
                                    type="radio"
                                    name={field.label}
                                    value={opt}
                                    required={field.required}
                                    checked={isSelected}
                                    onChange={(e) => setResponses({ ...responses, [field.label]: e.target.value })}
                                    disabled={isSubmitting}
                                    className="w-5 h-5 text-orange-500 bg-black/60 border-orange-400/40 focus:ring-orange-500 cursor-pointer"
                                  />
                                  <span className="font-medium text-amber-100">{opt}</span>
                                </label>
                              );
                            })
                          )}
                        </div>
                      ) : field.type === 'checkbox' ? (
                        /* Checkbox */
                        <div className="space-y-2.5 pt-1">
                          {field.options?.map((opt: string, i: number) => {
                            const currentVal = responses[field.label] || "";
                            const selectedArr = currentVal ? currentVal.split(", ") : [];
                            const isChecked = selectedArr.includes(opt);
                            return (
                              <label 
                                key={i} 
                                className={`flex items-center gap-3.5 p-3.5 rounded-xl border cursor-pointer transition-all ${
                                  isChecked 
                                    ? 'bg-orange-500/15 border-orange-500/60 shadow-[0_0_15px_rgba(249,115,22,0.15)]' 
                                    : 'bg-[#0b1420]/70 border-white/10 hover:border-orange-500/30 hover:bg-[#0b1420]'
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  name={field.label}
                                  value={opt}
                                  checked={isChecked}
                                  onChange={(e) => {
                                    const arr = [...selectedArr];
                                    if (e.target.checked) {
                                      arr.push(opt);
                                    } else {
                                      const itemIdx = arr.indexOf(opt);
                                      if (itemIdx > -1) arr.splice(itemIdx, 1);
                                    }
                                    setResponses({ ...responses, [field.label]: arr.join(", ") });
                                  }}
                                  disabled={isSubmitting}
                                  className="w-5 h-5 text-orange-500 bg-black/60 border-orange-400/40 rounded focus:ring-orange-500 cursor-pointer"
                                />
                                <span className="font-medium text-amber-100">{opt}</span>
                              </label>
                            );
                          })}
                        </div>
                      ) : field.type === 'undertaking' ? (
                        /* Camp Guidelines & Undertaking */
                        <div className="pt-1">
                          {responses[field.label] === "Accepted" ? (
                            <div className="flex items-center justify-between bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 p-4 rounded-xl shadow-inner">
                              <div className="flex items-center gap-3">
                                <div className="w-7 h-7 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                                </div>
                                <span className="font-bold text-sm tracking-wide">Camp Guidelines Agreed & Signed</span>
                              </div>
                              <span className="text-xs bg-emerald-500/20 px-2.5 py-1 rounded-md font-mono">Accepted ✅</span>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                setCurrentUndertakingField(field.label);
                                setShowUndertakingModal(true);
                              }}
                              disabled={isSubmitting}
                              className="w-full bg-[#0b1420] hover:bg-[#101c2c] border border-orange-500/30 hover:border-orange-500/60 text-amber-100 p-4 rounded-xl font-semibold tracking-wide transition-all flex items-center justify-between group shadow-sm"
                            >
                              <div className="flex items-center gap-3">
                                <span className="text-xl">📜</span>
                                <span className="text-sm">Read & Accept Camping Safety Guidelines</span>
                              </div>
                              <svg className="w-5 h-5 text-orange-400 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                            </button>
                          )}
                        </div>
                      ) : field.type === 'file' ? (
                        /* Photo ID / Attachment */
                        <div className="pt-1">
                          <div className="p-4 bg-[#0b1420]/80 border border-dashed border-orange-500/30 rounded-xl hover:border-orange-500/60 transition-colors">
                            <input
                              type="file"
                              accept="image/*"
                              required={field.required}
                              disabled={isSubmitting}
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  const reader = new FileReader();
                                  reader.onloadend = () => {
                                    setResponses({ ...responses, [field.label]: reader.result as string });
                                  };
                                  reader.readAsDataURL(file);
                                } else {
                                  const newResponses = { ...responses };
                                  delete newResponses[field.label];
                                  setResponses(newResponses);
                                }
                              }}
                              className="w-full text-sm text-amber-200/70 file:mr-4 file:py-2.5 file:px-5 file:rounded-xl file:border-0 file:text-sm file:font-bold file:bg-orange-500/20 file:text-orange-300 hover:file:bg-orange-500/30 file:border file:border-orange-400/30 transition-all cursor-pointer"
                            />
                          </div>
                          {responses[field.label] && responses[field.label].startsWith('data:image') && (
                            <div className="mt-4 rounded-2xl overflow-hidden w-36 h-36 border border-orange-500/30 shadow-lg shadow-orange-950/50 relative group">
                              <img src={responses[field.label]} alt="Preview" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-2">
                                <span className="text-[10px] text-amber-200 font-bold uppercase tracking-wider">Photo Ready</span>
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        /* Text, Email, Number */
                        <input
                          type={field.type === 'number' ? 'number' : field.type === 'email' ? 'email' : 'text'}
                          required={field.required}
                          value={responses[field.label] || ""}
                          onChange={(e) => setResponses({ ...responses, [field.label]: e.target.value })}
                          disabled={isSubmitting}
                          className="w-full bg-[#0b1420] border border-orange-500/20 rounded-xl px-4 py-3.5 text-amber-50 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all placeholder-amber-200/30 font-medium text-base shadow-inner"
                          placeholder={field.type === 'email' ? 'your.email@example.com' : field.type === 'number' ? 'e.g. 9876543210' : 'Type your answer here...'}
                        />
                      )}
                    </div>
                  ))}

                  {/* ================= PAYMENT INTEGRATION ================= */}
                  {form.isPaymentEnabled && totalPaymentAmount > 0 && (
                    <div className="bg-[#0b1420]/90 p-6 sm:p-7 rounded-2xl border border-orange-500/30 space-y-5 mt-8 shadow-xl relative overflow-hidden">
                      <div className="absolute -right-12 -top-12 w-40 h-40 bg-orange-600/15 blur-[45px] rounded-full pointer-events-none" />
                      
                      <div className="flex items-center justify-between border-b border-white/10 pb-4 relative z-10">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xl">🏕️</span>
                            <h3 className="text-lg font-bold text-white tracking-wide">Campsite & Activity Pass</h3>
                          </div>
                          <p className="text-amber-100/60 text-xs mt-0.5">Includes overnight tent stay, dinner by the fire, bonfire & all activities</p>
                        </div>
                        <div className="text-right">
                          <span className="text-2xl font-black text-orange-400 font-mono">₹{totalPaymentAmount}</span>
                        </div>
                      </div>
                      
                      <div className="text-center relative z-10">
                        <p className="text-xs text-amber-200/60 uppercase tracking-widest font-semibold mb-3">Scan with Any UPI App to Pay</p>
                        <div className="w-52 h-52 bg-white rounded-2xl p-2.5 mx-auto shadow-[0_0_25px_rgba(249,115,22,0.2)] border-2 border-orange-500/30">
                          <img src="/payment QR.jpeg" alt="Payment QR Code" className="w-full h-full object-cover rounded-xl" />
                        </div>
                      </div>
                      
                      <div className="pt-2 text-center relative z-10">
                        <a 
                          href={`upi://pay?pa=musabansariofficial212005@oksbi&pn=Rtr.%20Musab%20Ansari&aid=uGICAgKDGwvbnHg&am=${totalPaymentAmount}&cu=INR`}
                          className="inline-flex items-center gap-2.5 bg-gradient-to-r from-orange-600/30 to-amber-600/30 hover:from-orange-600/50 hover:to-amber-600/50 text-orange-200 px-6 py-3 rounded-xl font-bold transition-all border border-orange-500/40 text-sm shadow-sm"
                        >
                          <svg className="w-4 h-4 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                          Click to Pay via UPI App
                        </a>
                      </div>

                      <div className="pt-4 border-t border-white/10 relative z-10">
                        <label className="flex items-center justify-center gap-3 cursor-pointer group select-none">
                          <input 
                            type="checkbox" 
                            checked={paymentConfirmed} 
                            onChange={(e) => setPaymentConfirmed(e.target.checked)} 
                            className="w-5 h-5 bg-black/60 border-orange-400/40 text-orange-500 focus:ring-orange-500 rounded cursor-pointer"
                          />
                          <span className="text-sm font-semibold text-amber-100 group-hover:text-white transition-colors">
                            I have completed the payment of ₹{totalPaymentAmount}
                          </span>
                        </label>
                      </div>
                    </div>
                  )}

                  {/* Submit Button */}
                  <div className="pt-4 mt-8">
                    <button
                      type="submit"
                      disabled={isSubmitting || (form.isPaymentEnabled && totalPaymentAmount > 0 && !paymentConfirmed)}
                      className="w-full relative group overflow-hidden bg-gradient-to-r from-orange-600 via-amber-600 to-orange-500 hover:from-orange-500 hover:via-amber-500 hover:to-orange-400 text-white font-extrabold py-4 px-8 rounded-2xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_30px_rgba(249,115,22,0.4)] hover:shadow-[0_0_45px_rgba(249,115,22,0.6)] tracking-wide flex items-center justify-center gap-2 text-base uppercase"
                    >
                      <span className="relative z-10">
                        {isSubmitting 
                          ? "Securing Your Campsite..." 
                          : form.isPaymentEnabled && totalPaymentAmount > 0 
                            ? `Pay ₹${totalPaymentAmount} & Reserve My Campsite 🏕️` 
                            : "Lock In My Camping Spot 🏕️"}
                      </span>
                      {!isSubmitting && <span className="text-xl">🔥</span>}
                    </button>
                  </div>

                </form>
              </>
            )}
          </motion.main>
        )}
      </AnimatePresence>

      {/* ================= CAMPING UNDERTAKING MODAL ================= */}
      <AnimatePresence>
        {showUndertakingModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 25 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 25 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-[#0b1420] rounded-3xl border border-orange-500/30 p-6 sm:p-8 max-w-lg w-full shadow-[0_0_60px_rgba(249,115,22,0.25)] relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-500 via-amber-400 to-orange-600" />

              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl bg-orange-500/20 border border-orange-400/30 flex items-center justify-center text-orange-400 text-xl">
                  ⛺
                </div>
                <div>
                  <h3 className="text-xl font-extrabold text-white">Camping Safety & Guidelines</h3>
                  <p className="text-xs text-amber-200/60 uppercase tracking-widest">EMBER Event Guidelines</p>
                </div>
              </div>
              
              <div className="bg-[#060a11] border border-white/5 rounded-2xl p-5 mb-6 h-[320px] overflow-y-auto text-sm text-amber-100/75 space-y-4 font-normal scrollbar-thin scrollbar-thumb-orange-500/20">
                <ol className="list-decimal pl-5 space-y-3.5 marker:text-orange-400 marker:font-bold">
                  <li>
                    <strong className="text-amber-100">Campfire & Bonfire Safety:</strong> The central bonfire is organized and maintained by the event team. Please enjoy the warmth and stories around the fire circle! No open flames are allowed inside or near sleeping tents.
                  </li>
                  <li>
                    <strong className="text-amber-100">Clean Campsite (Leave No Trace):</strong> Help keep the campgrounds and nature clean. Garbage bins are set up across camp—please dispose of waste properly.
                  </li>
                  <li>
                    <strong className="text-amber-100">Tent & Overnight Respect:</strong> Respect tent allocations and designated camping zones. Quiet hours will begin late at night so all campers can enjoy a peaceful sleep under the stars.
                  </li>
                  <li>
                    <strong className="text-amber-100">Fun Activities & Games:</strong> Participate in games, group activities, and music at your own comfort level. Have fun and look out for your camp buddies!
                  </li>
                  <li>
                    <strong className="text-amber-100">Authentic Information:</strong> All contact and personal info provided is accurate so the team can reach you with passes and emergency updates.
                  </li>
                  <li>
                    <strong className="text-amber-100">Support & Good Vibes:</strong> Camp hosts and first-aid kits are available on site 24/7 if you need any help. Respect fellow campers and let's make it an unforgettable night!
                  </li>
                </ol>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setShowUndertakingModal(false)}
                  className="py-3 px-6 text-amber-200/60 font-semibold hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-colors text-sm"
                >
                  Go Back
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (currentUndertakingField) {
                      setResponses({ ...responses, [currentUndertakingField]: "Accepted" });
                    }
                    setShowUndertakingModal(false);
                  }}
                  className="py-3 px-6 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-white font-extrabold rounded-xl transition-all shadow-[0_0_20px_rgba(249,115,22,0.4)] text-sm"
                >
                  I Understand & Agree 🏕️
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
