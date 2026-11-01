/* ============================================================
 * 背景音樂：用 Web Audio 即時合成的原創輕快旋律（不需要音樂檔）
 * 木琴主旋律＋柔和和弦＋貝斯＋沙鈴，16 小節一輪，每輪旋律略有變化。
 * ============================================================ */
(function (root) {
  'use strict';
  const Music = (root.Music = {});
  let ctx = null, master = null, comp = null, timer = null, playing = false;
  let vol = 0.5, nextT = 0, step = 0, loop = 0, theme = 'day';
  const LOOK = 0.12, TICK = 30;

  // 主題：day（一般）、calm（嬰兒與晚年，比較慢、比較柔）
  const THEMES = {
    day: { bpm: 104, key: 60, prog: [[0, 4, 7], [7, 11, 14], [9, 12, 16], [5, 9, 12], [0, 4, 7], [7, 11, 14], [5, 9, 12], [7, 11, 14],
      [9, 12, 16], [5, 9, 12], [0, 4, 7], [7, 11, 14], [5, 9, 12], [4, 7, 11], [2, 5, 9], [7, 11, 14]] },
    calm: { bpm: 84, key: 65, prog: [[0, 4, 7], [9, 12, 16], [5, 9, 12], [7, 11, 14], [0, 4, 7], [4, 7, 11], [5, 9, 12], [7, 11, 14],
      [9, 12, 16], [4, 7, 11], [5, 9, 12], [0, 4, 7], [2, 5, 9], [7, 11, 14], [5, 9, 12], [0, 4, 7]] }
  };
  const PENTA = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21];
  const hz = m => 440 * Math.pow(2, (m - 69) / 12);

  function rng(seed) { let t = seed >>> 0; return () => { t = (t + 0x6D2B79F5) | 0; let r = Math.imul(t ^ (t >>> 15), t | 1); r ^= r + Math.imul(r ^ (r >>> 7), r | 61); return ((r ^ (r >>> 14)) >>> 0) / 4294967296; }; }
  // 每 4 小節一句；A A' B A'' 結構，旋律從和弦音與五聲音階挑
  let phrase = [];
  function buildMelody() {
    const T = THEMES[theme];
    const r = rng(1234 + (loop % 4) * 7);
    phrase = [];
    for (let bar = 0; bar < 16; bar++) {
      const sec = Math.floor(bar / 4);
      const motif = rng(99 + (bar % 4) * 13 + theme.length);
      const rr = sec === 2 ? r : sec === 3 ? () => (r() < 0.25 ? r() : motif()) : motif;
      const ch = T.prog[bar];
      const notes = [];
      let pos = 0;
      while (pos < 8) {
        const lenOpts = sec === 2 ? [1, 1, 2, 2] : [1, 2, 2, 3];
        let len = lenOpts[Math.floor(rr() * lenOpts.length)];
        if (pos + len > 8) len = 8 - pos;
        const rest = rr() < (bar % 4 === 3 && pos >= 4 ? 0.5 : 0.12);
        let n;
        if (pos === 0 || rr() < 0.55) n = ch[Math.floor(rr() * 3)] % 12 + 12 * (rr() < 0.3 ? 1 : 0);
        else n = PENTA[Math.floor(rr() * PENTA.length)];
        notes.push({ pos, len, n: rest ? null : n });
        pos += len;
      }
      phrase.push(notes);
    }
  }

  function env(g, t, a, peak, d, sus, rel) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + a);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0001, peak * sus), t + a + d);
    g.gain.exponentialRampToValueAtTime(0.0001, t + a + d + rel);
  }
  function marimba(t, m, v) {
    const o = ctx.createOscillator(), o2 = ctx.createOscillator(), g = ctx.createGain(), g2 = ctx.createGain();
    o.type = 'sine'; o.frequency.value = hz(m);
    o2.type = 'sine'; o2.frequency.value = hz(m) * 4;
    env(g, t, 0.005, 0.22 * v, 0.18, 0.25, 0.35);
    env(g2, t, 0.002, 0.05 * v, 0.05, 0.1, 0.05);
    o.connect(g); o2.connect(g2); g.connect(master); g2.connect(master);
    o.start(t); o2.start(t); o.stop(t + 0.8); o2.stop(t + 0.2);
  }
  function bell(t, m, v) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = 'triangle'; o.frequency.value = hz(m);
    env(g, t, 0.003, 0.06 * v, 0.3, 0.3, 0.8);
    o.connect(g); g.connect(master); o.start(t); o.stop(t + 1.3);
  }
  function pad(t, notes, dur) {
    const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 1100;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.045, t + 0.25);
    g.gain.setValueAtTime(0.045, t + dur - 0.2);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.15);
    f.connect(g); g.connect(master);
    for (const m of notes) {
      for (const det of [-5, 5]) {
        const o = ctx.createOscillator(); o.type = 'triangle'; o.frequency.value = hz(m); o.detune.value = det;
        o.connect(f); o.start(t); o.stop(t + dur + 0.2);
      }
    }
  }
  function bass(t, m, dur) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = 'sine'; o.frequency.value = hz(m);
    env(g, t, 0.01, 0.16, 0.12, 0.6, Math.max(0.1, dur - 0.15));
    o.connect(g); g.connect(master); o.start(t); o.stop(t + dur + 0.1);
  }
  let noiseBuf = null;
  function shaker(t, v) {
    if (!noiseBuf) { noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 0.1, ctx.sampleRate); const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; }
    const s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    s.buffer = noiseBuf; f.type = 'highpass'; f.frequency.value = 6500;
    env(g, t, 0.004, 0.05 * v, 0.03, 0.1, 0.03);
    s.connect(f); f.connect(g); g.connect(master); s.start(t); s.stop(t + 0.1);
  }

  // 一拍分兩格（八分音符），一小節 8 格
  function schedule() {
    const T = THEMES[theme];
    const e8 = 60 / T.bpm / 2;
    while (nextT < ctx.currentTime + LOOK) {
      const bar = Math.floor(step / 8) % 16, pos = step % 8;
      const ch = T.prog[bar].map(n => n + T.key);
      if (pos === 0) { pad(nextT, ch.map(n => n - 12), e8 * 8); bass(nextT, ch[0] - 24, e8 * 3); }
      if (pos === 4) bass(nextT, ch[0] - 24 + (bar % 2 ? 7 : 0), e8 * 3);
      if (pos === 3 || pos === 6) bass(nextT, ch[0] - 24 + 12, e8 * 0.9);
      if (theme === 'day') shaker(nextT, pos % 2 ? 0.6 : 1);
      else if (pos % 4 === 2) shaker(nextT, 0.5);
      const note = phrase[bar] && phrase[bar].find(x => x.pos === pos);
      if (note && note.n != null) {
        const m = T.key + 12 + note.n;
        marimba(nextT, m, pos === 0 ? 1 : 0.8);
        if (bar % 4 === 3 && pos === 0) bell(nextT, m + 12, 1);
      }
      step++;
      if (step % 128 === 0) { loop++; buildMelody(); }
      nextT += e8;
    }
  }

  function ensure() {
    if (ctx) return true;
    const AC = root.AudioContext || root.webkitAudioContext;
    if (!AC) return false;
    ctx = new AC();
    comp = ctx.createDynamicsCompressor();
    master = ctx.createGain();
    master.gain.value = 0;
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 7000;
    master.connect(lp); lp.connect(comp); comp.connect(ctx.destination);
    buildMelody();
    return true;
  }
  // iPhone：讓網頁音效走「媒體」聲道，靜音鍵開著也聽得到；並在手勢中播一段無聲音訊解鎖
  let tag = null, unlocked = false;
  function silentWav() {
    const sr = 8000, n = sr / 2, buf = new ArrayBuffer(44 + n * 2), v = new DataView(buf);
    const w = (o, str) => { for (let i = 0; i < str.length; i++) v.setUint8(o + i, str.charCodeAt(i)); };
    w(0, 'RIFF'); v.setUint32(4, 36 + n * 2, true); w(8, 'WAVE'); w(12, 'fmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
    v.setUint32(24, sr, true); v.setUint32(28, sr * 2, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true); w(36, 'data'); v.setUint32(40, n * 2, true);
    return URL.createObjectURL(new Blob([buf], { type: 'audio/wav' }));
  }
  function unlock() {
    try { if (navigator.audioSession) navigator.audioSession.type = 'playback'; } catch (e) { /* 不支援 */ }
    if (!tag && root.Audio) {
      try { tag = new Audio(silentWav()); tag.loop = true; tag.setAttribute('playsinline', ''); tag.volume = 0.01; } catch (e) { tag = null; }
    }
    if (tag) { const p = tag.play(); if (p && p.catch) p.catch(() => {}); }
    if (!unlocked && ctx) {
      const b = ctx.createBuffer(1, 1, 22050), src = ctx.createBufferSource();
      src.buffer = b; src.connect(ctx.destination); src.start(0);
      unlocked = true;
    }
  }
  Music.state = () => (ctx ? ctx.state : 'none');
  Music.supported = () => !!(root.AudioContext || root.webkitAudioContext);
  Music.isPlaying = () => playing;
  Music.start = function () {
    if (!ensure()) return false;
    unlock();
    if (ctx.state !== 'running') { const p = ctx.resume(); if (p && p.catch) p.catch(() => {}); }
    if (playing) return true;
    playing = true;
    nextT = ctx.currentTime + 0.08;
    master.gain.cancelScheduledValues(ctx.currentTime);
    master.gain.setValueAtTime(master.gain.value, ctx.currentTime);
    master.gain.linearRampToValueAtTime(vol * 1.6, ctx.currentTime + 1.2);
    clearInterval(timer);
    timer = setInterval(schedule, TICK);
    return true;
  };
  Music.stop = function () {
    if (!ctx || !playing) return;
    playing = false;
    master.gain.cancelScheduledValues(ctx.currentTime);
    master.gain.setValueAtTime(master.gain.value, ctx.currentTime);
    master.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.4);
    setTimeout(() => { if (!playing) { clearInterval(timer); timer = null; if (tag) tag.pause(); } }, 450);
  };
  Music.setVolume = function (v) {
    vol = Math.max(0, Math.min(1, v));
    if (ctx && playing) { master.gain.cancelScheduledValues(ctx.currentTime); master.gain.linearRampToValueAtTime(vol * 1.6, ctx.currentTime + 0.15); }
  };
  Music.setTheme = function (t) {
    if (!THEMES[t] || t === theme) return;
    theme = t; loop = 0;
    if (ctx) { step = Math.ceil(step / 8) * 8; buildMelody(); }
  };
  // 切到背景時暫停，回來時繼續
  if (root.document) {
    root.document.addEventListener('visibilitychange', () => {
      if (!ctx) return;
      if (root.document.hidden) { if (playing) { ctx.suspend(); if (tag) tag.pause(); } }
      else if (playing) { ctx.resume().then(() => { nextT = Math.max(nextT, ctx.currentTime + 0.05); }).catch(() => {}); if (tag) tag.play().catch(() => {}); }
    });
  }
})(typeof window !== 'undefined' ? window : globalThis);
