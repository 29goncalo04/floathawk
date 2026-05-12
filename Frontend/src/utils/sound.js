export function playDealSound() {
  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  [[1318, 0], [1568, 0.1], [2093, 0.18]].forEach(([freq, t]) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "triangle";
    osc.frequency.value = freq;
    const s = ctx.currentTime + t;
    gain.gain.setValueAtTime(0, s);
    gain.gain.linearRampToValueAtTime(0.25, s + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, s + 0.25);
    osc.start(s);
    osc.stop(s + 0.25);
  });
}
