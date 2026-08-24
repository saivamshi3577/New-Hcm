// Global AudioContext singleton to preserve unlock state
let audioCtx: AudioContext | null = null;

const getAudioContext = (): AudioContext | null => {
  if (audioCtx) return audioCtx;
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  } catch (e) {
    console.warn("AudioContext not supported", e);
  }
  return audioCtx;
};

// Unlock AudioContext on first user interaction to bypass autoplay restrictions
const unlockAudio = () => {
  const ctx = getAudioContext();
  if (!ctx) return;
  
  if (ctx.state === 'suspended') {
    ctx.resume().catch(() => {});
  }
  
  // Play a silent buffer to guarantee unlock (especially for Safari)
  try {
    const buffer = ctx.createBuffer(1, 1, 22050);
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    source.start(0);
  } catch (e) {}
  
  // Remove listeners after unlock
  document.removeEventListener('click', unlockAudio);
  document.removeEventListener('touchstart', unlockAudio);
  document.removeEventListener('keydown', unlockAudio);
};

// Attach listeners as soon as this utility loads
if (typeof document !== 'undefined') {
  document.addEventListener('click', unlockAudio);
  document.addEventListener('touchstart', unlockAudio);
  document.addEventListener('keydown', unlockAudio);
}

export const playNotificationSound = () => {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    
    // Ensure it's resumed in case the unlock somehow missed
    if (ctx.state === 'suspended') ctx.resume().catch(() => {});

    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    osc.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    // A pleasant "ding" sound
    osc.type = 'sine';
    
    // High pitched frequency for notification
    osc.frequency.setValueAtTime(880, ctx.currentTime); // A5
    osc.frequency.exponentialRampToValueAtTime(1760, ctx.currentTime + 0.05); // A6
    
    // Quick attack, slow decay
    gainNode.gain.setValueAtTime(0, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.02);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
    
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.4);
  } catch (error) {
    // Ignore errors (e.g. if autoplay policy blocks it before user interaction)
    console.warn("Could not play notification sound", error);
  }
};

export const playAnnouncementSound = () => {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    
    if (ctx.state === 'suspended') ctx.resume().catch(() => {});
    
    // Create a smooth, professional glass chime
    const playTone = (freq: number, startTime: number) => {
      // Main fundamental tone (smooth sine)
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);
      
      // Subtle overtone (one octave up) for a glassy bell-like quality
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(freq * 2, startTime);
      
      // Connect to their respective gain nodes
      osc.connect(gain);
      osc2.connect(gain2);
      
      // Master volume for this specific note
      const masterGain = ctx.createGain();
      gain.connect(masterGain);
      gain2.connect(masterGain);
      masterGain.connect(ctx.destination);
      
      // Smooth attack and long exponential decay for the main tone
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.2, startTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 1.5);
      
      // Sharper, quieter decay for the overtone to mimic a mallet strike
      gain2.gain.setValueAtTime(0, startTime);
      gain2.gain.linearRampToValueAtTime(0.05, startTime + 0.02);
      gain2.gain.exponentialRampToValueAtTime(0.001, startTime + 0.8);
      
      osc.start(startTime);
      osc2.start(startTime);
      osc.stop(startTime + 1.5);
      osc2.stop(startTime + 0.8);
    };
    
    // Play a professional "Ding... Dong..." two-tone melody
    const now = ctx.currentTime;
    playTone(523.25, now);       // C5 (Ding)
    playTone(659.25, now + 0.2); // E5 (Dong)
  } catch (error) {
    console.warn("Could not play announcement sound", error);
  }
};
