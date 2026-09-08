/**
 * CIRCLE DEFENSE - Mobile-First (1080x1920) Infinite World Survival Shooter
 * Background: #6D6987
 * Features:
 * - 1080x1920 Virtual Resolution with responsive touch & mouse scaling
 * - Infinite world movement with smooth follow camera
 * - 3 Player Lives with Extra Life drops
 * - Power-Ups: Extra Life (❤️), Rapid Fire (🔥), Hyper Speed (⚡), Mega Nuke (💥), Energy Shield (🛡️)
 * - Enemy-based scoring: Minion (+5), Orc (+10), Bat (+15), Brute (+20)
 * - Beautiful visual destruction effects: Shockwaves, particles, smoke, floating popups, decals
 * - 3 Weapons: Pistol, Rifle, Shotgun
 * - Web Audio procedural sound synthesizer
 */

(function () {
  'use strict';

  // --- VIRTUAL RESOLUTION (1080 x 1920 PORTRAIT) ---
  const V_WIDTH = 1080;
  const V_HEIGHT = 1920;

  const CANVAS = document.getElementById('gameCanvas');
  const CTX = CANVAS.getContext('2d');
  CANVAS.width = V_WIDTH;
  CANVAS.height = V_HEIGHT;

  // --- SOUND SYNTHESIZER ---
  class SoundFX {
    constructor() {
      this.ctx = null;
      this.muted = false;
    }

    init() {
      if (!this.ctx) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) {
          this.ctx = new AudioContext();
        }
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
    }

    playPistol() {
      if (this.muted || !this.ctx) return;
      this.init();
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(600, t);
      osc.frequency.exponentialRampToValueAtTime(160, t + 0.11);
      gain.gain.setValueAtTime(0.25, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.11);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.11);
    }

    playRifle() {
      if (this.muted || !this.ctx) return;
      this.init();
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(780, t);
      osc.frequency.exponentialRampToValueAtTime(240, t + 0.08);
      gain.gain.setValueAtTime(0.2, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.08);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.08);
    }

    playShotgun() {
      if (this.muted || !this.ctx) return;
      this.init();
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(240, t);
      osc.frequency.exponentialRampToValueAtTime(45, t + 0.28);
      gain.gain.setValueAtTime(0.35, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.28);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.28);

      const bufSize = this.ctx.sampleRate * 0.2;
      const buffer = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufSize * 0.3));
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      const nGain = this.ctx.createGain();
      nGain.gain.setValueAtTime(0.35, t);
      nGain.gain.exponentialRampToValueAtTime(0.01, t + 0.2);
      noise.connect(nGain);
      nGain.connect(this.ctx.destination);
      noise.start(t);
    }

    playHit() {
      if (this.muted || !this.ctx) return;
      this.init();
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(260, t);
      osc.frequency.exponentialRampToValueAtTime(90, t + 0.08);
      gain.gain.setValueAtTime(0.2, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.08);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.08);
    }

    playExplosion(isLarge = false) {
      if (this.muted || !this.ctx) return;
      this.init();
      const t = this.ctx.currentTime;
      const dur = isLarge ? 0.6 : 0.35;
      const bufSize = Math.floor(this.ctx.sampleRate * dur);
      const buffer = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufSize * 0.25));
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(isLarge ? 500 : 750, t);
      filter.frequency.exponentialRampToValueAtTime(60, t + dur);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(isLarge ? 0.5 : 0.35, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + dur);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);
      noise.start(t);
    }

    playPowerup() {
      if (this.muted || !this.ctx) return;
      this.init();
      const notes = [330, 440, 554.37, 659.25, 880];
      notes.forEach((freq, i) => {
        const t = this.ctx.currentTime + i * 0.06;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, t);
        gain.gain.setValueAtTime(0.25, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.15);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t);
        osc.stop(t + 0.15);
      });
    }

    playLife() {
      if (this.muted || !this.ctx) return;
      this.init();
      const notes = [440, 554.37, 659.25, 880, 1108.73];
      notes.forEach((freq, i) => {
        const t = this.ctx.currentTime + i * 0.07;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t);
        gain.gain.setValueAtTime(0.3, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.22);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t);
        osc.stop(t + 0.22);
      });
    }

    playNuke() {
      if (this.muted || !this.ctx) return;
      this.init();
      const t = this.ctx.currentTime;
      // High rising siren into huge boom
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(180, t);
      osc.frequency.linearRampToValueAtTime(800, t + 0.2);
      osc.frequency.exponentialRampToValueAtTime(40, t + 0.9);
      gain.gain.setValueAtTime(0.4, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.9);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.9);
      this.playExplosion(true);
    }

    playShieldBreak() {
      if (this.muted || !this.ctx) return;
      this.init();
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(900, t);
      osc.frequency.exponentialRampToValueAtTime(120, t + 0.2);
      gain.gain.setValueAtTime(0.35, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.2);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.2);
    }

    playPlayerHurt() {
      if (this.muted || !this.ctx) return;
      this.init();
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(200, t);
      osc.frequency.setValueAtTime(100, t + 0.1);
      gain.gain.setValueAtTime(0.4, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.35);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.35);
    }

    playWave() {
      if (this.muted || !this.ctx) return;
      this.init();
      const notes = [261.63, 329.63, 392.0, 523.25];
      notes.forEach((freq, i) => {
        const t = this.ctx.currentTime + i * 0.09;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, t);
        gain.gain.setValueAtTime(0.25, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.2);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t);
        osc.stop(t + 0.2);
      });
    }

    playGameOver() {
      if (this.muted || !this.ctx) return;
      this.init();
      const notes = [330, 293, 261, 196];
      notes.forEach((freq, i) => {
        const t = this.ctx.currentTime + i * 0.16;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, t);
        gain.gain.setValueAtTime(0.3, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.3);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t);
        osc.stop(t + 0.3);
      });
    }

    playSMG() {
      if (this.muted || !this.ctx) return;
      this.init();
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(850, t);
      osc.frequency.exponentialRampToValueAtTime(320, t + 0.05);
      gain.gain.setValueAtTime(0.2, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.05);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.05);
    }

    playAR() {
      if (this.muted || !this.ctx) return;
      this.init();
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(480, t);
      osc.frequency.exponentialRampToValueAtTime(140, t + 0.09);
      gain.gain.setValueAtTime(0.25, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.09);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.09);
    }

    playPlasma() {
      if (this.muted || !this.ctx) return;
      this.init();
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1200, t);
      osc.frequency.exponentialRampToValueAtTime(260, t + 0.16);
      gain.gain.setValueAtTime(0.3, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.16);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.16);
    }

    playGatling() {
      if (this.muted || !this.ctx) return;
      this.init();
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(320, t);
      osc.frequency.exponentialRampToValueAtTime(90, t + 0.06);
      gain.gain.setValueAtTime(0.28, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.06);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.06);
    }

    playSniper() {
      if (this.muted || !this.ctx) return;
      this.init();
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(280, t);
      osc.frequency.exponentialRampToValueAtTime(35, t + 0.35);
      gain.gain.setValueAtTime(0.45, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.35);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.35);

      const bufSize = Math.floor(this.ctx.sampleRate * 0.28);
      const buffer = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufSize * 0.2));
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      const nGain = this.ctx.createGain();
      nGain.gain.setValueAtTime(0.4, t);
      nGain.gain.exponentialRampToValueAtTime(0.01, t + 0.28);
      noise.connect(nGain);
      nGain.connect(this.ctx.destination);
      noise.start(t);
    }

    playWeaponPickup() {
      if (this.muted || !this.ctx) return;
      this.init();
      const notes = [523.25, 659.25, 783.99, 1046.5];
      notes.forEach((freq, i) => {
        const t = this.ctx.currentTime + i * 0.07;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t);
        gain.gain.setValueAtTime(0.35, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.25);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t);
        osc.stop(t + 0.25);
      });
    }

    playSwitch() {
      if (this.muted || !this.ctx) return;
      this.init();
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(650, t);
      osc.frequency.setValueAtTime(950, t + 0.05);
      gain.gain.setValueAtTime(0.18, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.1);
    }

    playPortalOpen() {
      if (this.muted || !this.ctx) return;
      this.init();
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(80, t);
      osc.frequency.exponentialRampToValueAtTime(520, t + 1.2);
      gain.gain.setValueAtTime(0.35, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 1.3);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 1.3);
    }

    playTimeWarp() {
      if (this.muted || !this.ctx) return;
      this.init();
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, t);
      osc.frequency.exponentialRampToValueAtTime(920, t + 1.4);
      gain.gain.setValueAtTime(0.22, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 1.5);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 1.5);
    }

    playMeteorLanding() {
      if (this.muted || !this.ctx) return;
      this.init();
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(150, t);
      osc.frequency.exponentialRampToValueAtTime(32, t + 0.5);
      gain.gain.setValueAtTime(0.45, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.6);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.6);
    }
  }

  const SOUNDS = new SoundFX();

  // --- WEAPONS CONFIG ---
  const WEAPONS = {
    1: {
      name: 'BLASTER PISTOL',
      shortName: 'PISTOL',
      key: 'weapon_pistol',
      bulletSprite: 'bullet_orb_red',
      cooldown: 250,
      damage: 28,
      speed: 18,
      spread: 0,
      pellets: 1,
      knockback: 5,
      bulletColor: '#ffe600',
      bulletSize: 7,
      sound: () => SOUNDS.playPistol(),
    },
    2: {
      name: 'RAPID RIFLE',
      shortName: 'RIFLE',
      key: 'weapon_rifle',
      bulletSprite: 'bullet_pulse_blue',
      cooldown: 95,
      damage: 15,
      speed: 21,
      spread: 0.1,
      pellets: 1,
      knockback: 3,
      bulletColor: '#00f7ff',
      bulletSize: 6,
      sound: () => SOUNDS.playRifle(),
    },
    3: {
      name: 'HEAVY SHOTGUN',
      shortName: 'SHOTGUN',
      key: 'weapon_shotgun',
      bulletSprite: 'bullet_pellet_gold',
      cooldown: 600,
      damage: 20,
      speed: 16,
      spread: 0.38,
      pellets: 6,
      knockback: 12,
      bulletColor: '#ff5e00',
      bulletSize: 8,
      sound: () => SOUNDS.playShotgun(),
    },
    4: {
      name: 'TACTICAL SMG',
      shortName: 'SMG',
      key: 'weapon_smg',
      bulletSprite: 'bullet_pulse_cyan',
      cooldown: 65,
      damage: 28,
      speed: 24,
      spread: 0.12,
      pellets: 1,
      knockback: 4,
      bulletColor: '#38bdf8',
      bulletSize: 6,
      sound: () => SOUNDS.playSMG(),
    },
    5: {
      name: 'COMMANDO AR',
      shortName: 'COMMANDO',
      key: 'weapon_ar_launcher',
      bulletSprite: 'bullet_pellet_gold',
      cooldown: 110,
      damage: 48,
      speed: 25,
      spread: 0.06,
      pellets: 1,
      knockback: 7,
      bulletColor: '#fb923c',
      bulletSize: 8,
      hasGrenades: true,
      sound: () => SOUNDS.playAR(),
    },
    6: {
      name: 'PLASMA BLASTER',
      shortName: 'PLASMA',
      key: 'weapon_plasma',
      bulletSprite: 'bullet_plasma',
      cooldown: 180,
      damage: 85,
      speed: 21,
      spread: 0,
      pellets: 1,
      knockback: 10,
      bulletColor: '#60a5fa',
      bulletSize: 14,
      pierce: 4,
      sound: () => SOUNDS.playPlasma(),
    },
    7: {
      name: 'GATLING CANNON',
      shortName: 'GATLING',
      key: 'weapon_gatling',
      bulletSprite: 'bullet_dart_gold',
      cooldown: 55,
      damage: 42,
      speed: 26,
      spread: 0.18,
      pellets: 2,
      knockback: 8,
      bulletColor: '#facc15',
      bulletSize: 7,
      screenShake: 2.5,
      sound: () => SOUNDS.playGatling(),
    },
    8: {
      name: 'AM-SNIPER',
      shortName: 'SNIPER',
      key: 'weapon_sniper',
      bulletSprite: 'bullet_laser',
      cooldown: 750,
      damage: 260,
      speed: 40,
      spread: 0,
      pellets: 1,
      knockback: 25,
      bulletColor: '#f43f5e',
      bulletSize: 11,
      pierce: 99,
      screenShake: 6,
      sound: () => SOUNDS.playSniper(),
    },
  };

  // --- ENEMY CONFIG (15 DISTINCT ARCHETYPES) ---
  const ENEMY_TYPES = {
    1: {
      name: 'SCOUT TROOPER',
      hp: 35,
      speed: 2.8,
      radius: 28,
      score: 5,
      scale: 0.52,
      color: '#94a3b8',
      shockRadius: 65,
      canShoot: true,
      shootRange: 540,
      shootCooldown: 220,
    },
    2: {
      name: 'ASSAULT COMMANDO',
      hp: 65,
      speed: 2.5,
      radius: 32,
      score: 10,
      scale: 0.58,
      color: '#84cc16',
      shockRadius: 75,
      canShoot: true,
      shootRange: 500,
      shootCooldown: 180,
    },
    3: {
      name: 'SPEC-OPS GUNNER',
      hp: 95,
      speed: 2.2,
      radius: 34,
      score: 15,
      scale: 0.62,
      color: '#38bdf8',
      shockRadius: 85,
      canShoot: true,
      shootRange: 600,
      shootCooldown: 150,
    },
    4: {
      name: 'SHADOW STALKER',
      hp: 55,
      speed: 3.4,
      radius: 28,
      score: 12,
      scale: 0.54,
      color: '#a855f7',
      shockRadius: 70,
    },
    5: {
      name: 'HEAVY JUGGERNAUT',
      hp: 240,
      speed: 1.6,
      radius: 46,
      score: 25,
      scale: 0.82,
      color: '#f97316',
      shockRadius: 130,
    },
    6: {
      name: 'TACTICAL INFANTRY',
      hp: 45,
      speed: 2.6,
      radius: 30,
      score: 8,
      scale: 0.56,
      color: '#cbd5e1',
      shockRadius: 65,
    },
    7: {
      name: 'ARMORED ENFORCER',
      hp: 130,
      speed: 2.0,
      radius: 36,
      score: 14,
      scale: 0.65,
      color: '#06b6d4',
      shockRadius: 85,
    },
    8: {
      name: 'CYBER MERCENARY',
      hp: 85,
      speed: 2.9,
      radius: 32,
      score: 16,
      scale: 0.6,
      color: '#10b981',
      shockRadius: 80,
    },
    9: {
      name: 'ELITE VANGUARD',
      hp: 165,
      speed: 2.2,
      radius: 38,
      score: 20,
      scale: 0.72,
      color: '#e11d48',
      shockRadius: 100,
    },
    10: {
      name: 'DESERT MARAUDER',
      hp: 75,
      speed: 3.1,
      radius: 30,
      score: 15,
      scale: 0.58,
      color: '#f59e0b',
      shockRadius: 75,
    },
    11: {
      name: 'HEAVY DREADNOUGHT',
      hp: 340,
      speed: 1.4,
      radius: 50,
      score: 35,
      scale: 0.88,
      color: '#64748b',
      shockRadius: 140,
    },
    12: {
      name: 'MUTANT BERSERKER',
      hp: 115,
      speed: 3.5,
      radius: 34,
      score: 18,
      scale: 0.66,
      color: '#ec4899',
      shockRadius: 90,
    },
    13: {
      name: 'TOXIC RAIDER',
      hp: 100,
      speed: 2.4,
      radius: 32,
      score: 20,
      scale: 0.62,
      color: '#22c55e',
      shockRadius: 85,
    },
    14: {
      name: 'STEALTH INFILTRATOR',
      hp: 80,
      speed: 3.3,
      radius: 30,
      score: 22,
      scale: 0.58,
      color: '#475569',
      shockRadius: 80,
    },
    15: {
      name: 'MECH TITAN BOSS',
      hp: 580,
      speed: 1.3,
      radius: 62,
      score: 50,
      scale: 1.05,
      color: '#ef4444',
      shockRadius: 160,
      isBoss: true,
    },
  };

  // --- POWER-UP DEFINITIONS ---
  const POWERUP_TYPES = {
    LIFE: {
      id: 'LIFE',
      icon: '❤️',
      name: 'EXTRA LIFE',
      color: '#ff2a4b',
      duration: 0, // instant
      desc: '+1 Life Recovered!',
    },
    RAPID: {
      id: 'RAPID',
      icon: '🔥',
      name: 'RAPID FIRE',
      color: '#f97316',
      duration: 10,
      desc: 'Rapid Fire & Triple Stream!',
    },
    SPEED: {
      id: 'SPEED',
      icon: '⚡',
      name: 'HYPER SPEED',
      color: '#38bdf8',
      duration: 10,
      desc: '+60% Movement Velocity!',
    },
    NUKE: {
      id: 'NUKE',
      icon: '💥',
      name: 'MEGA NUKE',
      color: '#eab308',
      duration: 0, // instant
      desc: 'Screen Enemies Obliterated!',
    },
    SHIELD: {
      id: 'SHIELD',
      icon: '🛡️',
      name: 'AEGIS SHIELD',
      color: '#818cf8',
      duration: 20,
      desc: 'Absorbs 1 Deadly Hit!',
    },
    CLONE: {
      id: 'CLONE',
      icon: '👥',
      name: 'SHADOW CLONE',
      color: '#c084fc',
      duration: 30,
      desc: 'Clones multiply firepower simultaneously for 30s!',
    },
    VANISH: {
      id: 'VANISH',
      icon: '👻',
      name: 'GHOST CLOAK',
      color: '#a78bfa',
      duration: 10,
      desc: 'Become invisible to enemies and shoot freely!',
    },
  };

  // --- ASSET LOADER ---
  const IMAGES = {};
  const ENEMY_ANIMATIONS = {};
  const MANIFEST = {
    frameSizes: {
      player_idle: { width: 128, height: 145 },
      player_walk: { width: 128, height: 145 },
      player_hit: { width: 128, height: 145 },
      player_death: { width: 128, height: 145 },
      enemy1_walk: { width: 128, height: 145 },
      enemy1_hit: { width: 128, height: 145 },
      enemy1_death: { width: 128, height: 145 },
      enemy2_walk: { width: 128, height: 145 },
      enemy2_hit: { width: 128, height: 145 },
      enemy2_death: { width: 128, height: 145 },
      enemy3_fly: { width: 140, height: 126 },
      enemy4_walk: { width: 128, height: 145 },
      enemy4_hit: { width: 128, height: 145 },
      enemy4_death: { width: 128, height: 145 },
      weapon_pistol: { width: 64, height: 34 },
      weapon_rifle: { width: 90, height: 44 },
      weapon_shotgun: { width: 90, height: 27 },
      weapon_gatling: { width: 110, height: 49 },
      weapon_plasma: { width: 75, height: 44 },
      weapon_sniper: { width: 125, height: 35 },
      weapon_smg: { width: 85, height: 31 },
      weapon_ar_launcher: { width: 95, height: 41 },
    },
  };

  function buildEnemyAssetList() {
    const list = [];
    function add(typeId, action, dir, prefix, count) {
      if (!ENEMY_ANIMATIONS[typeId]) ENEMY_ANIMATIONS[typeId] = {};
      ENEMY_ANIMATIONS[typeId][action] = new Array(count);
      for (let i = 0; i < count; i++) {
        const pad = String(i).padStart(2, '0');
        const src = `${dir}/${prefix}_${pad}.png`;
        list.push({ typeId, action, index: i, src });
      }
    }

    // En01
    add(1, 'move', 'images', 'Moving and idle', 14);
    add(1, 'shoot', 'images', 'Shoot', 14);
    add(1, 'death', 'images', 'Death', 14);

    // En02
    add(2, 'move', 'images/En02/PNG', 'Moving and idle', 14);
    add(2, 'shoot', 'images/En02/PNG', 'Shoot', 14);
    add(2, 'death', 'images/En02/PNG', 'Death', 14);

    // En03
    add(3, 'move', 'images/En03/PNG/Moving and idle', 'Moving and idle', 14);
    add(3, 'shoot', 'images/En03/PNG/Shoot', 'Shoot', 14);
    add(3, 'death', 'images/En03/PNG/Death', 'Death', 14);

    // En04
    add(4, 'move', 'images/En04/PNG/Moving and idle', 'Moving and idle', 14);
    add(4, 'death', 'images/En04/PNG/Death', 'Death', 14);

    // En05
    add(5, 'move', 'images/En05/PNG/Moving and idle', 'Moving and idle', 14);
    add(5, 'death', 'images/En05/PNG/Death', 'Death', 14);

    // En06 - En13, En15
    for (let id of [6, 7, 8, 9, 10, 11, 12, 13, 15]) {
      const pad = String(id).padStart(2, '0');
      const base = `images/En${pad}/PNG`;
      add(id, 'move', `${base}/Walk`, 'Walk', 14);
      add(id, 'idle', `${base}/Idle`, 'Idle', 14);
      add(id, 'death', `${base}/Death`, 'Death', 14);
    }

    // En14
    add(14, 'move', 'images/En14/PNG/Walk', 'Walk', 14);
    add(14, 'idle', 'images/En14/PNG/Idle', 'Idle', 14);
    add(14, 'death', 'images/En14/PNG/Death', 'Death', 10);

    return list;
  }

  function loadAssets() {
    const files = [
      'player_idle',
      'player_walk',
      'player_hit',
      'player_death',
      'weapon_pistol',
      'weapon_rifle',
      'weapon_shotgun',
      'weapon_gatling',
      'weapon_plasma',
      'weapon_sniper',
      'weapon_smg',
      'weapon_ar_launcher',
      'bullet_orb_red',
      'bullet_laser',
      'bullet_pulse_cyan',
      'bullet_pulse_blue',
      'bullet_pellet_gold',
      'bullet_plasma',
      'bullet_rocket',
      'bullet_dart_gold',
      'bullet_heavy_dart',
      'prop_rock_large',
      'prop_rock_medium',
      'prop_broken_metal',
      'prop_water_puddle',
      'prop_rock_small',
      'prop_rock_cluster',
      'defense_ring',
      'crosshair',
      'muzzle_flash',
      'smoke',
      'shadow',
    ];

    const enemyList = buildEnemyAssetList();
    const totalAssets = files.length + enemyList.length;
    let loadedCount = 0;
    const loadingStatus = document.getElementById('loadingStatus');

    return new Promise((resolve) => {
      let isResolved = false;
      function done() {
        if (!isResolved) {
          isResolved = true;
          if (loadingStatus) {
            loadingStatus.innerText = `Ready to Play! Tap START DEFENSE! 🎖️`;
            loadingStatus.style.color = '#4ade80';
          }
          resolve();
        }
      }

      // Safety timeout: Never block engine longer than 1.2s
      setTimeout(done, 1200);

      function checkFinished() {
        loadedCount++;
        if (loadingStatus) {
          const pct = Math.min(100, Math.floor((loadedCount / totalAssets) * 100));
          loadingStatus.innerText = `Loading Arsenal & Enemies... ${pct}%`;
          if (pct >= 100) {
            loadingStatus.innerText = `Ready! All 15 Enemy Armies Assembled! 🎖️`;
            loadingStatus.style.color = '#4ade80';
          }
        }
        if (loadedCount >= totalAssets) {
          done();
        }
      }

      files.forEach((name) => {
        const img = new Image();
        img.src = `assets/${name}.png`;
        img.onload = () => {
          IMAGES[name] = img;
          checkFinished();
        };
        img.onerror = () => {
          checkFinished();
        };
      });

      enemyList.forEach((item) => {
        const img = new Image();
        img.src = item.src;
        img.onload = () => {
          if (!ENEMY_ANIMATIONS[item.typeId]) ENEMY_ANIMATIONS[item.typeId] = {};
          if (!ENEMY_ANIMATIONS[item.typeId][item.action]) ENEMY_ANIMATIONS[item.typeId][item.action] = [];
          ENEMY_ANIMATIONS[item.typeId][item.action][item.index] = img;
          checkFinished();
        };
        img.onerror = () => {
          checkFinished();
        };
      });
    });
  }

  // --- VIRTUAL COORDINATE CONVERSION ---
  function getCanvasCoords(e) {
    const rect = CANVAS.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const x = ((clientX - rect.left) / rect.width) * V_WIDTH;
    const y = ((clientY - rect.top) / rect.height) * V_HEIGHT;
    return { x, y };
  }

  // --- PROGRESSIVE WEAPON UNLOCK TIERS BY WAVE ---
  // Player starts with 1 (Blaster Pistol). Upgraded weapons appear in field as waves advance!
  const WAVE_WEAPON_TIERS = {
    2: 2,  // Wave 2  -> Rapid Rifle
    4: 3,  // Wave 4  -> Heavy Shotgun
    6: 4,  // Wave 6  -> Tactical SMG
    8: 5,  // Wave 8  -> Commando AR
    10: 6, // Wave 10 -> Plasma Blaster
    12: 7, // Wave 12 -> Devastator Gatling Cannon
    14: 8, // Wave 14 -> Anti-Material Sniper
  };

  // --- PROCEDURAL ENVIRONMENT PROPS (ROCKS, METAL BARRICADES, PUDDLES) ---
  const PROP_CHUNK_SIZE = 640;
  const PROP_TYPES = [
    { key: 'prop_rock_large', scale: 0.45, isObstacle: true, obstacleRadius: 62, shadowRadius: 75, shadowY: 28 },
    { key: 'prop_rock_medium', scale: 0.50, isObstacle: true, obstacleRadius: 44, shadowRadius: 50, shadowY: 20 },
    { key: 'prop_broken_metal', scale: 0.45, isObstacle: true, obstacleRadius: 48, shadowRadius: 54, shadowY: 18 },
    { key: 'prop_water_puddle', scale: 0.55, isPuddle: true, isObstacle: false, shadowRadius: 0, shadowY: 0 },
    { key: 'prop_rock_cluster', scale: 0.52, isObstacle: false, shadowRadius: 30, shadowY: 14 },
    { key: 'prop_rock_small', scale: 0.50, isObstacle: false, shadowRadius: 20, shadowY: 10 },
  ];

  const chunkPropsCache = new Map();
  function getPropsForChunk(cx, cy) {
    const chunkKey = `${cx},${cy}`;
    if (chunkPropsCache.has(chunkKey)) {
      return chunkPropsCache.get(chunkKey);
    }
    if (chunkPropsCache.size > 250) {
      chunkPropsCache.clear();
    }

    let seed = ((cx * 73856093) ^ (cy * 19349663)) >>> 0;
    function rand() {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return (seed >>> 0) / 4294967296;
    }

    const count = Math.floor(rand() * 3) + 1;
    const items = [];
    for (let i = 0; i < count; i++) {
      const typeIdx = Math.floor(rand() * PROP_TYPES.length);
      const propDef = PROP_TYPES[typeIdx];
      const relX = 60 + rand() * (PROP_CHUNK_SIZE - 120);
      const relY = 60 + rand() * (PROP_CHUNK_SIZE - 120);
      const wx = cx * PROP_CHUNK_SIZE + relX;
      const wy = cy * PROP_CHUNK_SIZE + relY;

      if (Math.hypot(wx, wy) < 260) continue;

      const flipH = rand() > 0.5;
      const rot = (rand() - 0.5) * 0.25;
      items.push({
        ...propDef,
        x: wx,
        y: wy,
        flipH,
        rot,
      });
    }

    chunkPropsCache.set(chunkKey, items);
    return items;
  }

  // --- GAME STATE VARIABLES ---
  let gameState = 'START';
  let score = 0;
  let highScore = parseInt(localStorage.getItem('circle_def_high') || '0', 10);
  let kills = 0;
  let wave = 1;
  let waveTimer = 0;
  let waveBanner = { text: 'WAVE 1 - GET READY!', timer: 140 };
  let survivalTime = 0;
  let screenShake = 0;
  let currentWeaponId = 1;
  let unlockedWeapons = [1]; // Start with only 1 weapon in hand!

  // Wave Progression State
  let waveState = 'REGULAR'; // 'REGULAR', 'BOSS_INCOMING', 'BOSS_FIGHT', 'BOSS_REWARD', 'WAVE_ARRIVAL'
  let waveRegularKills = 0;
  let waveBossCountdown = 0;
  let waveBoss = null;
  let waveCinematicTimer = 0;

  // Quantum Ground Tunnel / Time-Travel Rift State
  const portal = {
    active: false,
    x: 0,
    y: 0,
    radius: 0,
    maxRadius: 170,
    swirl: 0,
    particles: [],
  };

  // Hyperspace Time Warp Speed Lines
  const timeWarpLines = [];
  for (let i = 0; i < 90; i++) {
    timeWarpLines.push({
      angle: Math.random() * Math.PI * 2,
      dist: Math.random() * 800 + 40,
      len: Math.random() * 140 + 60,
      speed: Math.random() * 32 + 24,
      color: ['#38bdf8', '#c084fc', '#facc15', '#ffffff', '#818cf8'][Math.floor(Math.random() * 5)],
      width: Math.random() * 3.5 + 1.5,
    });
  }

  // Active Power-ups state
  const activePowerups = {
    RAPID: 0,
    SPEED: 0,
    SHIELD: false,
    VANISH: 0,
  };

  // Shadow Clone Squad Ability State (1 -> 2 -> 4 players, 10s duration)
  const cloneSquad = {
    count: 1, // 1 (solo), 2 (dual), 4 (quad)
    timer: 0,
    maxTimer: 10,
    clones: [],
  };

  // Follow Camera (World offset)
  const camera = {
    x: 0,
    y: 0,
  };

  // Player (in Infinite World Coordinates)
  const player = {
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    baseSpeed: 5.5,
    radius: 32,
    lives: 3,
    invincibleTimer: 0,
    facingLeft: false,
    animState: 'idle',
    animFrame: 0,
    animTick: 0,
    lastShotTime: 0,
    muzzleFlash: null,
    dead: false,
    trailTimer: 0,
  };

  // Ghost trail for Speed Boost
  let playerGhostTrails = [];

  // Entities Collections (World coordinates)
  let enemies = [];
  let bullets = [];
  let enemyBullets = [];
  let particles = [];
  let shockwaves = [];
  let drops = [];
  let floatTexts = [];
  let groundDecals = [];

  let spawnInterval = 1300;
  let lastSpawnTime = 0;

  // Input States (Virtual screen coordinates 1080x1920)
  const keys = {};
  const mouse = {
    x: V_WIDTH / 2,
    y: V_HEIGHT / 2,
    down: false,
    isDesktopDown: false,
    lastActive: 0,
  };

  // Mobile Virtual Joystick (Left Thumb Movement)
  const joystick = {
    active: false,
    touchId: null,
    originX: 220,
    originY: V_HEIGHT - 360,
    curX: 220,
    curY: V_HEIGHT - 360,
    dx: 0,
    dy: 0,
    distance: 0,
    angle: 0,
    maxRadius: 85,
    deadZone: 10,
    alpha: 0,
  };

  // Mobile Aim & Fire Controller (Right Thumb)
  const aimControl = {
    active: false,
    isDragging: false,
    touchId: null,
    originX: V_WIDTH - 220,
    originY: V_HEIGHT - 360,
    curX: V_WIDTH - 220,
    curY: V_HEIGHT - 360,
    angle: 0,
  };

  // Auto-Fire & Smart Target Lock States
  let autoFireEnabled = localStorage.getItem('circle_def_autofire') !== 'false';
  let lockedEnemy = null;
  let lockReticleTick = 0;

  function getTouchVirtualCoords(touch) {
    const rect = CANVAS.getBoundingClientRect();
    const x = ((touch.clientX - rect.left) / rect.width) * V_WIDTH;
    const y = ((touch.clientY - rect.top) / rect.height) * V_HEIGHT;
    return { x, y };
  }

  // Helper to determine if an enemy is inside the visible screen viewport
  function isEnemyOnScreen(e, margin = 0) {
    return (
      e.x + e.radius >= camera.x - margin &&
      e.x - e.radius <= camera.x + V_WIDTH + margin &&
      e.y + e.radius >= camera.y - margin &&
      e.y - e.radius <= camera.y + V_HEIGHT + margin
    );
  }

  function getNearestEnemy() {
    let nearest = null;
    let minDist = Infinity;
    for (let i = 0; i < enemies.length; i++) {
      const e = enemies[i];
      if (e.hp <= 0 || e.isDying) continue;
      // Strictly must be within visible screen viewport
      if (!isEnemyOnScreen(e, 0)) continue;

      const d = Math.hypot(e.x - player.x, e.y - player.y);
      if (d < minDist) {
        minDist = d;
        nearest = e;
      }
    }
    return nearest;
  }

  function cycleWeapon() {
    if (!unlockedWeapons || unlockedWeapons.length <= 1) return;
    const idx = unlockedWeapons.indexOf(currentWeaponId);
    const nextIdx = (idx + 1) % unlockedWeapons.length;
    selectWeapon(unlockedWeapons[nextIdx]);
  }

  function cycleWeaponPrev() {
    if (!unlockedWeapons || unlockedWeapons.length <= 1) return;
    const idx = unlockedWeapons.indexOf(currentWeaponId);
    const prevIdx = (idx - 1 + unlockedWeapons.length) % unlockedWeapons.length;
    selectWeapon(unlockedWeapons[prevIdx]);
  }

  function toggleAutoFire() {
    autoFireEnabled = !autoFireEnabled;
    localStorage.setItem('circle_def_autofire', autoFireEnabled);
    updateAutoFireUI();
    if (SOUNDS && SOUNDS.playSwitch) SOUNDS.playSwitch();
    addFloatText(
      player.x,
      player.y - 80,
      autoFireEnabled ? 'AUTO FIRE ON' : 'MANUAL FIRE',
      autoFireEnabled ? '#4ade80' : '#f87171',
      24
    );
  }

  function updateAutoFireUI() {
    const settingBtn = document.getElementById('settingAutoFireToggle');
    const settingText = document.getElementById('settingAutoFireText');
    if (settingBtn && settingText) {
      if (autoFireEnabled) {
        settingBtn.classList.add('active');
        settingText.innerText = 'ON';
      } else {
        settingBtn.classList.remove('active');
        settingText.innerText = 'OFF';
      }
    }
  }

  function updateSoundUI() {
    const muteBtn = document.getElementById('muteBtn');
    if (muteBtn) {
      muteBtn.innerText = SOUNDS.muted ? '🔇' : '🔊';
    }
    const settingBtn = document.getElementById('settingSoundToggle');
    const settingText = document.getElementById('settingSoundText');
    if (settingBtn && settingText) {
      if (!SOUNDS.muted) {
        settingBtn.classList.add('active');
        settingText.innerText = 'ON';
      } else {
        settingBtn.classList.remove('active');
        settingText.innerText = 'OFF';
      }
    }
  }

  // --- INPUT LISTENERS ---
  window.addEventListener('keydown', (e) => {
    keys[e.code] = true;
    const keyNum = parseInt(e.key, 10);
    if (!isNaN(keyNum) && unlockedWeapons.includes(keyNum)) {
      selectWeapon(keyNum);
    }
    if (e.code === 'KeyP' || e.code === 'Escape') togglePause();
    if (e.code === 'KeyF') toggleAutoFire();
    if (e.code === 'KeyQ') cycleWeaponPrev();
    if (e.code === 'KeyE') cycleWeapon();
  });
  window.addEventListener('keyup', (e) => {
    keys[e.code] = false;
  });

  // Desktop Mouse Inputs
  CANVAS.addEventListener('mousemove', (e) => {
    const p = getCanvasCoords(e);
    mouse.x = p.x;
    mouse.y = p.y;
    mouse.lastActive = performance.now();
  });

  CANVAS.addEventListener('mousedown', (e) => {
    SOUNDS.init();
    if (e.button === 0) {
      const p = getCanvasCoords(e);
      mouse.x = p.x;
      mouse.y = p.y;
      mouse.down = true;
      mouse.isDesktopDown = true;
      mouse.lastActive = performance.now();
    }
  });

  window.addEventListener('mouseup', (e) => {
    if (e.button === 0) {
      mouse.isDesktopDown = false;
      if (!aimControl.active && !autoFireEnabled) {
        mouse.down = false;
      }
    }
  });

  window.addEventListener('wheel', (e) => {
    if (e.deltaY > 0) {
      cycleWeapon();
    } else if (e.deltaY < 0) {
      cycleWeaponPrev();
    }
  });

  // Mobile Touch System (Dedicated Left Joystick & Right Combat/Aim Zone)
  CANVAS.addEventListener(
    'touchstart',
    (e) => {
      e.preventDefault();
      SOUNDS.init();
      for (let i = 0; i < e.changedTouches.length; i++) {
        const t = e.changedTouches[i];
        const p = getTouchVirtualCoords(t);

        // LEFT HALF OF SCREEN (x < V_WIDTH * 0.52) -> Dynamic Movement Joystick
        if (p.x < V_WIDTH * 0.52) {
          if (joystick.touchId === null) {
            joystick.touchId = t.identifier;
            joystick.active = true;
            joystick.originX = p.x;
            joystick.originY = p.y;
            joystick.curX = p.x;
            joystick.curY = p.y;
            joystick.distance = 0;
            joystick.dx = 0;
            joystick.dy = 0;
            joystick.alpha = 1;
          }
        } else {
          // RIGHT HALF OF SCREEN -> Aim & Fire Zone
          if (aimControl.touchId === null) {
            aimControl.touchId = t.identifier;
            aimControl.active = true;
            aimControl.isDragging = false;
            aimControl.originX = p.x;
            aimControl.originY = p.y;
            aimControl.curX = p.x;
            aimControl.curY = p.y;
            aimControl.angle = Math.atan2(
              p.y - (player.y - camera.y),
              p.x - (player.x - camera.x)
            );
            mouse.x = p.x;
            mouse.y = p.y;
            mouse.down = true;
          }
        }
      }
    },
    { passive: false }
  );

  CANVAS.addEventListener(
    'touchmove',
    (e) => {
      e.preventDefault();
      for (let i = 0; i < e.changedTouches.length; i++) {
        const t = e.changedTouches[i];
        const p = getTouchVirtualCoords(t);

        // Update Left Movement Joystick
        if (t.identifier === joystick.touchId) {
          joystick.curX = p.x;
          joystick.curY = p.y;
          const diffX = p.x - joystick.originX;
          const diffY = p.y - joystick.originY;
          const dist = Math.hypot(diffX, diffY);
          joystick.distance = dist;
          joystick.angle = Math.atan2(diffY, diffX);

          if (dist > joystick.deadZone) {
            const speedRatio = Math.min(
              1.0,
              (dist - joystick.deadZone) / (joystick.maxRadius - joystick.deadZone)
            );
            joystick.dx = Math.cos(joystick.angle) * speedRatio;
            joystick.dy = Math.sin(joystick.angle) * speedRatio;

            // Floating anchor: keeps joystick under thumb during large swipes
            if (dist > joystick.maxRadius) {
              const excess = dist - joystick.maxRadius;
              joystick.originX += Math.cos(joystick.angle) * excess;
              joystick.originY += Math.sin(joystick.angle) * excess;
            }
          } else {
            joystick.dx = 0;
            joystick.dy = 0;
          }
        }

        // Update Right Aim / Fire Controller
        if (t.identifier === aimControl.touchId) {
          aimControl.curX = p.x;
          aimControl.curY = p.y;
          const adx = p.x - aimControl.originX;
          const ady = p.y - aimControl.originY;
          const adist = Math.hypot(adx, ady);

          if (adist > 22) {
            aimControl.isDragging = true;
            aimControl.angle = Math.atan2(ady, adx);
            // Point aim in 360 drag direction
            const screenPx = player.x - camera.x;
            const screenPy = player.y - camera.y;
            mouse.x = screenPx + Math.cos(aimControl.angle) * 550;
            mouse.y = screenPy + Math.sin(aimControl.angle) * 550;
            mouse.down = true;
          } else {
            // Slight touch: direct tap aim
            mouse.x = p.x;
            mouse.y = p.y;
            mouse.down = true;
          }
        }
      }
    },
    { passive: false }
  );

  const onTouchEnd = (e) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      const t = e.changedTouches[i];
      if (t.identifier === joystick.touchId) {
        joystick.active = false;
        joystick.touchId = null;
        joystick.dx = 0;
        joystick.dy = 0;
        joystick.distance = 0;
      }
      if (t.identifier === aimControl.touchId) {
        aimControl.active = false;
        aimControl.isDragging = false;
        aimControl.touchId = null;
        if (!mouse.isDesktopDown && !autoFireEnabled) {
          mouse.down = false;
        }
      }
    }
    if (e.touches.length === 0) {
      joystick.active = false;
      joystick.touchId = null;
      joystick.dx = 0;
      joystick.dy = 0;
      joystick.distance = 0;
      aimControl.active = false;
      aimControl.isDragging = false;
      aimControl.touchId = null;
      if (!mouse.isDesktopDown && !autoFireEnabled) {
        mouse.down = false;
      }
    }
  };
  CANVAS.addEventListener('touchend', onTouchEnd);
  CANVAS.addEventListener('touchcancel', onTouchEnd);

  // --- GAME RESET & WEAPONS ---
  function resetGame() {
    score = 0;
    kills = 0;
    wave = 1;
    waveTimer = 0;
    waveState = 'REGULAR';
    waveRegularKills = 0;
    waveBossCountdown = 0;
    waveBoss = null;
    waveBanner = { text: 'WAVE 1 - GET READY!', timer: 140 };
    survivalTime = 0;
    screenShake = 0;

    portal.active = false;
    portal.radius = 0;
    portal.particles = [];

    activePowerups.RAPID = 0;
    activePowerups.SPEED = 0;
    activePowerups.SHIELD = false;
    activePowerups.VANISH = 0;

    cloneSquad.count = 1;
    cloneSquad.timer = 0;
    cloneSquad.clones = [];
    updatePowerupTray();

    joystick.active = false;
    joystick.touchId = null;
    joystick.dx = 0;
    joystick.dy = 0;
    joystick.distance = 0;

    aimControl.active = false;
    aimControl.isDragging = false;
    aimControl.touchId = null;

    lockedEnemy = null;
    mouse.down = false;
    mouse.isDesktopDown = false;
    updateAutoFireUI();

    player.x = 0;
    player.y = 0;
    player.vx = 0;
    player.vy = 0;
    player.lives = 3;
    player.invincibleTimer = 0;
    player.facingLeft = false;
    player.animState = 'idle';
    player.animFrame = 0;
    player.animTick = 0;
    player.dead = false;
    player.muzzleFlash = null;
    player.trailTimer = 0;

    camera.x = player.x - V_WIDTH / 2;
    camera.y = player.y - V_HEIGHT / 2;

    unlockedWeapons = [1];
    currentWeaponId = 1;
    renderWeaponsDock();
    updateWeaponUI();

    enemies = [];
    bullets = [];
    enemyBullets = [];
    particles = [];
    shockwaves = [];
    drops = [];
    floatTexts = [];
    groundDecals = [];
    playerGhostTrails = [];

    spawnInterval = 1300;
    lastSpawnTime = Date.now();
    gameState = 'PLAYING';
    SOUNDS.playWave();
    updateHUD();
    updatePowerupTray();
  }

  function selectWeapon(id) {
    if (currentWeaponId !== id && WEAPONS[id]) {
      currentWeaponId = id;
      SOUNDS.playSwitch();
      updateWeaponUI();
      addFloatText(player.x, player.y - 60, WEAPONS[id].name, '#38bdf8', 22);
    }
  }

  function togglePause() {
    if (gameState === 'PLAYING') {
      gameState = 'PAUSED';
      document.getElementById('pauseOverlay').classList.remove('hidden');
    } else if (gameState === 'PAUSED') {
      gameState = 'PLAYING';
      document.getElementById('pauseOverlay').classList.add('hidden');
    }
  }

  // --- FLOATING TEXT ---
  function addFloatText(x, y, text, color = '#ffffff', fontSize = 24) {
    floatTexts.push({
      x,
      y,
      text,
      color,
      fontSize,
      alpha: 1.0,
      scale: 1.4,
      vy: -1.8,
      life: 55,
    });
  }

  // --- BEAUTIFUL PARTICLES & DESTRUCTION FX ---
  function createShockwave(x, y, color, maxRadius = 90) {
    shockwaves.push({
      x,
      y,
      radius: 10,
      maxRadius,
      color,
      alpha: 1.0,
      lineWidth: 8,
    });
  }

  function createSparks(x, y, count, color) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 8 + 2;
      particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color,
        size: Math.random() * 6 + 3,
        alpha: 1.0,
        decay: Math.random() * 0.03 + 0.02,
      });
    }
  }

  function createEnemyDeathFX(x, y, proto) {
    // 1. Expanding Color Shockwave
    createShockwave(x, y, proto.color, proto.shockRadius);

    // 2. High Density Sparks
    createSparks(x, y, 22, proto.color);
    createSparks(x, y, 12, '#ffffff');

    // 3. Smoke Puffs
    for (let i = 0; i < (proto.radius > 40 ? 3 : 1); i++) {
      particles.push({
        x: x + (Math.random() - 0.5) * 20,
        y: y + (Math.random() - 0.5) * 20,
        vx: (Math.random() - 0.5) * 1.5,
        vy: -0.8 - Math.random() * 0.8,
        isSmoke: true,
        size: 45,
        maxSize: 110,
        alpha: 0.95,
        decay: 0.02,
        rotation: Math.random() * Math.PI * 2,
      });
    }

    // 4. Ground Decal / Splatter (lasts 6 seconds)
    groundDecals.push({
      x,
      y,
      radius: proto.radius * 0.9,
      color: proto.color,
      alpha: 0.55,
      life: 360,
    });
  }

  function spawnFieldWeaponDrop(weaponId, isBossReward = false) {
    if (!WEAPONS[weaponId]) return;
    const angle = Math.random() * Math.PI * 2;
    const dist = 320 + Math.random() * 140;
    const dropX = player.x + Math.cos(angle) * dist;
    const dropY = player.y + Math.sin(angle) * dist;
    drops.push({
      x: dropX,
      y: dropY,
      type: 'WEAPON',
      weaponId: weaponId,
      bounceTick: Math.random() * Math.PI * 2,
      life: 3600, // 60s
      isBossReward: isBossReward,
    });
    createShockwave(dropX, dropY, '#facc15', 220);
    createSparks(dropX, dropY, 40, '#facc15');
    addFloatText(dropX, dropY - 60, `${WEAPONS[weaponId].name} DISCOVERED! 🌟`, '#facc15', 30);
  }

  // --- WEAPON & POWER-UP DROP SYSTEM ---
  function checkEnemyDrop(x, y, enemy) {
    // 1. Check for Weapon Drops from Enemies according to progressive wave tiers
    const maxTier = wave >= 14 ? 8 : (wave >= 12 ? 7 : (wave >= 10 ? 6 : (wave >= 8 ? 5 : (wave >= 6 ? 4 : (wave >= 4 ? 3 : (wave >= 2 ? 2 : 1))))));
    const availableLocked = [];
    for (let id = 2; id <= maxTier; id++) {
      if (!unlockedWeapons.includes(id)) {
        availableLocked.push(id);
      }
    }

    if (availableLocked.length > 0) {
      let shouldDropWeapon = false;
      if (enemy.typeId === 4) { // RED BRUTE
        // In Wave 11+, 100% guaranteed drop! In Wave 5-10, 60% chance; earlier waves 40%.
        if (wave >= 11 || Math.random() < 0.60) {
          shouldDropWeapon = true;
        }
      } else if (enemy.typeId === 2) { // GREEN ORC
        // 45% chance in Wave 2+
        if (Math.random() < 0.45) {
          shouldDropWeapon = true;
        }
      } else {
        // Minion / Bat: 12% chance if player still only has starter pistol in wave 2+
        if (unlockedWeapons.length === 1 && wave >= 2 && Math.random() < 0.12) {
          shouldDropWeapon = true;
        }
      }

      if (shouldDropWeapon) {
        const pickedWeaponId = availableLocked[Math.floor(Math.random() * availableLocked.length)];
        drops.push({
          x,
          y,
          type: 'WEAPON',
          weaponId: pickedWeaponId,
          bounceTick: Math.random() * Math.PI * 2,
          life: 2400, // 40 seconds on ground
        });
        createShockwave(x, y, '#facc15', 180);
        createSparks(x, y, 35, '#facc15');
        addFloatText(x, y - 60, 'UPGRADED WEAPON DROPPED! ⭐', '#facc15', 28);
        return;
      }
    }

    // 2. Regular Power-Up Drop
    checkDropPowerup(x, y);
  }

  function checkDropPowerup(x, y) {
    // 28% chance to drop a powerup
    if (Math.random() > 0.28) return;

    const roll = Math.random();
    let typeKey = 'RAPID';
    if (roll < 0.20) {
      typeKey = 'LIFE'; // Uncapped extra lives drop anytime!
    } else if (wave >= 18 && (roll > 0.70 || (roll > 0.35 && roll < 0.50))) {
      typeKey = 'VANISH'; // Vanishing Ghost Cloak unlocks at Wave 18+!
    } else if (wave >= 15 && (roll < 0.36 || (roll > 0.52 && roll < 0.70))) {
      typeKey = 'CLONE'; // Shadow Clone Ability ONLY appears from Wave 15+!
    } else if (roll < 0.44) {
      typeKey = 'RAPID';
    } else if (roll < 0.60) {
      typeKey = 'SPEED';
    } else if (roll < 0.78) {
      typeKey = 'SHIELD';
    } else {
      typeKey = 'NUKE';
    }

    const info = POWERUP_TYPES[typeKey];
    drops.push({
      x,
      y,
      type: typeKey,
      info,
      bounceTick: Math.random() * 10,
      life: 900, // 15 seconds on ground
    });
  }

  // --- SHADOW CLONE SQUAD MANAGEMENT ---
  function getCloneOffsets(totalClones) {
    if (totalClones === 1) {
      return [{ dx: -54, dy: 8 }];
    }
    if (totalClones === 3) {
      return [
        { dx: -56, dy: -22 },
        { dx: 56, dy: -22 },
        { dx: 0, dy: 54 },
      ];
    }
    const offsets = [];
    const innerCount = Math.min(totalClones, 7);
    for (let i = 0; i < innerCount; i++) {
      const angle = (i / innerCount) * Math.PI * 2 - Math.PI / 2;
      const radius = 64;
      offsets.push({ dx: Math.round(Math.cos(angle) * radius), dy: Math.round(Math.sin(angle) * radius) });
    }
    const outerCount = totalClones - innerCount;
    for (let i = 0; i < outerCount; i++) {
      const angle = (i / outerCount) * Math.PI * 2 - Math.PI / 4;
      const radius = 118;
      offsets.push({ dx: Math.round(Math.cos(angle) * radius), dy: Math.round(Math.sin(angle) * radius) });
    }
    return offsets;
  }

  function initOrUpdateClones() {
    const neededClones = cloneSquad.count - 1;
    const offsets = getCloneOffsets(neededClones);

    while (cloneSquad.clones.length < neededClones) {
      const idx = cloneSquad.clones.length;
      const off = offsets[idx] || { dx: (idx + 1) * 35, dy: 0 };
      const cloneX = player.x + off.dx;
      const cloneY = player.y + off.dy;
      cloneSquad.clones.push({
        x: cloneX,
        y: cloneY,
        targetDx: off.dx,
        targetDy: off.dy,
        facingLeft: player.facingLeft,
        animState: player.animState,
        animFrame: player.animFrame,
        muzzleFlash: null,
      });
      createSparks(cloneX, cloneY, 25, '#c084fc');
      createShockwave(cloneX, cloneY, '#a855f7', 100);
    }

    // Update target offsets for existing clones
    cloneSquad.clones.forEach((c, idx) => {
      if (offsets[idx]) {
        c.targetDx = offsets[idx].dx;
        c.targetDy = offsets[idx].dy;
      }
    });
  }

  function dissolveClones() {
    if (cloneSquad.clones.length > 0) {
      cloneSquad.clones.forEach((c) => {
        createSparks(c.x, c.y, 30, '#c084fc');
        for (let s = 0; s < 5; s++) {
          particles.push({
            x: c.x + (Math.random() - 0.5) * 24,
            y: c.y + (Math.random() - 0.5) * 24,
            vx: (Math.random() - 0.5) * 1.8,
            vy: -1.2 - Math.random() * 1.6,
            color: '#a855f7',
            size: 16,
            rotation: Math.random() * Math.PI,
            isSmoke: true,
            alpha: 0.85,
            decay: 0.03,
          });
        }
      });
      addFloatText(player.x, player.y - 70, 'CLONES EXPIRED 💨', '#94a3b8', 26);
    }
    cloneSquad.count = 1;
    cloneSquad.timer = 0;
    cloneSquad.clones = [];
  }

  function collectPowerup(drop) {
    if (drop.type === 'WEAPON') {
      const wId = drop.weaponId;
      const wp = WEAPONS[wId];
      SOUNDS.playWeaponPickup();

      if (!unlockedWeapons.includes(wId)) {
        unlockedWeapons.push(wId);
        unlockedWeapons.sort((a, b) => a - b);
      }
      selectWeapon(wId);
      renderWeaponsDock();

      screenShake = 10;
      createShockwave(drop.x, drop.y, '#facc15', 180);
      createSparks(drop.x, drop.y, 40, '#facc15');
      createSparks(drop.x, drop.y, 20, '#ffffff');
      addFloatText(player.x, player.y - 80, `UNLOCKED: ${wp.name}! 🌟`, '#facc15', 30);
      return;
    }

    const info = drop.info;
    SOUNDS.playPowerup();

    if (drop.type === 'LIFE') {
      SOUNDS.playLife();
      player.lives++;
      screenShake = 8;
      createShockwave(player.x, player.y, '#ff2a4b', 180);
      createSparks(player.x, player.y, 25, '#ff2a4b');
      addFloatText(player.x, player.y - 70, `+1 LIFE! (${player.lives} ❤️)`, '#ff2a4b', 32);
      updateHUD();
    } else if (drop.type === 'CLONE') {
      SOUNDS.playPowerup();
      // Continuous doubling: 1 -> 2 -> 4 -> 8 -> 16 -> 32
      const nextCount = cloneSquad.count === 1 ? 2 : cloneSquad.count * 2;
      cloneSquad.count = Math.min(32, nextCount);
      cloneSquad.timer = 30;
      cloneSquad.maxTimer = 30;

      screenShake = 14 + Math.min(cloneSquad.count * 2, 22);
      createShockwave(player.x, player.y, '#c084fc', 200 + cloneSquad.count * 12);
      createSparks(player.x, player.y, 35 + cloneSquad.count * 4, '#c084fc');
      addFloatText(player.x, player.y - 70, `👥 CLONE SQUAD x${cloneSquad.count}! (30s)`, '#c084fc', 32);

      initOrUpdateClones();
      updatePowerupTray();
    } else if (drop.type === 'NUKE') {
      SOUNDS.playNuke();
      screenShake = 24;
      createShockwave(player.x, player.y, '#eab308', 900);
      addFloatText(player.x, player.y - 70, 'TACTICAL NUKE! 💥', '#eab308', 36);

      // Kill all visible enemies
      const camLeft = camera.x - 100;
      const camRight = camera.x + V_WIDTH + 100;
      const camTop = camera.y - 100;
      const camBottom = camera.y + V_HEIGHT + 100;

      for (let i = enemies.length - 1; i >= 0; i--) {
        const e = enemies[i];
        if (!e.isDying && e.x >= camLeft && e.x <= camRight && e.y >= camTop && e.y <= camBottom) {
          const proto = ENEMY_TYPES[e.typeId];
          kills++;
          score += proto.score;
          addFloatText(e.x, e.y - 30, `+${proto.score}`, proto.color, 26);
          createEnemyDeathFX(e.x, e.y, proto);
          checkEnemyDrop(e.x, e.y, e);
          enemies.splice(i, 1);
        }
      }
      updateHUD();
    } else if (drop.type === 'SHIELD') {
      activePowerups.SHIELD = true;
      addFloatText(player.x, player.y - 70, 'AEGIS SHIELD ACTIVATED! 🛡️', '#818cf8', 30);
    } else if (drop.type === 'VANISH') {
      SOUNDS.playPowerup();
      activePowerups.VANISH = 10;
      screenShake = 14;
      createShockwave(player.x, player.y, '#a78bfa', 220);
      createSparks(player.x, player.y, 40, '#a78bfa');
      addFloatText(player.x, player.y - 70, 'GHOST CLOAK ACTIVATED! 👻 (10s)', '#a78bfa', 32);
    } else {
      activePowerups[drop.type] = info.duration;
      addFloatText(player.x, player.y - 70, `${info.name}! ${info.icon}`, info.color, 30);
    }

    createSparks(drop.x, drop.y, 25, info.color);
    updatePowerupTray();
  }

  function updatePowerupTray() {
    const tray = document.getElementById('powerupsTray');
    if (!tray) return;
    tray.innerHTML = '';

    // Ghost Cloak
    if (activePowerups.VANISH > 0) {
      const pct = Math.max(0, Math.min(1, activePowerups.VANISH / 10));
      const timeStr = `${activePowerups.VANISH.toFixed(1)}s`;
      const pill = createPill('👻', 'GHOST CLOAK', timeStr, pct, '#a78bfa');
      tray.appendChild(pill);
    }
    // Clone Squad
    if (cloneSquad.count > 1 && cloneSquad.timer > 0) {
      const pct = Math.max(0, Math.min(1, cloneSquad.timer / cloneSquad.maxTimer));
      const timeStr = `${cloneSquad.timer.toFixed(1)}s`;
      const pill = createPill('👥', `CLONES x${cloneSquad.count}`, timeStr, pct, '#c084fc');
      tray.appendChild(pill);
    }
    // Rapid Fire
    if (activePowerups.RAPID > 0) {
      const pct = Math.max(0, Math.min(1, activePowerups.RAPID / 10));
      const timeStr = `${activePowerups.RAPID.toFixed(1)}s`;
      const pill = createPill('🔥', 'RAPID FIRE', timeStr, pct, '#f97316');
      tray.appendChild(pill);
    }
    // Speed Boost
    if (activePowerups.SPEED > 0) {
      const pct = Math.max(0, Math.min(1, activePowerups.SPEED / 10));
      const timeStr = `${activePowerups.SPEED.toFixed(1)}s`;
      const pill = createPill('⚡', 'SPEED', timeStr, pct, '#38bdf8');
      tray.appendChild(pill);
    }
    // Shield
    if (activePowerups.SHIELD) {
      const pill = createPill('🛡️', 'SHIELD', 'ON', 1.0, '#818cf8');
      tray.appendChild(pill);
    }
  }

  function createPill(icon, title, timeStr, pct, color) {
    const div = document.createElement('div');
    div.className = 'powerup-pill';
    div.style.borderColor = `${color}55`;
    div.innerHTML = `
      <div class="powerup-pill-header">
        <span class="powerup-pill-title">${icon} ${title}</span>
        <span class="powerup-pill-time" style="color:${color}; text-shadow: 0 0 8px ${color}88;">${timeStr}</span>
      </div>
      <div class="powerup-bar-track">
        <div class="powerup-bar-fill" style="width:${Math.round(pct * 100)}%; background:${color}; box-shadow: 0 0 12px ${color};"></div>
      </div>
    `;
    return div;
  }

  // --- BULLET STREAM SPAWNER (PLAYER & CLONES) ---
  function spawnBulletStream(originX, originY, baseAngle, isClone = false) {
    const wp = WEAPONS[currentWeaponId];
    if (!wp) return { muzzleX: originX, muzzleY: originY };
    const isRapid = activePowerups.RAPID > 0;
    const barrelDist = 48;
    const muzzleX = originX + Math.cos(baseAngle) * barrelDist;
    const muzzleY = originY + Math.sin(baseAngle) * barrelDist;

    // Recoil (only applied to the main player)
    if (!isClone) {
      const recoilForce = wp.pellets > 1 ? 2.8 : (wp.knockback ? Math.min(wp.knockback * 0.14, 3.5) : 1.0);
      player.vx -= Math.cos(baseAngle) * recoilForce;
      player.vy -= Math.sin(baseAngle) * recoilForce;
    }

    const isGrenade = wp.hasGrenades && (player.shotCount % 3 === 0);
    const streamOffsets = isRapid ? [-0.14, 0, 0.14] : [0];
    const perpX = -Math.sin(baseAngle);
    const perpY = Math.cos(baseAngle);

    streamOffsets.forEach((streamAngle) => {
      for (let p = 0; p < wp.pellets; p++) {
        let angle = baseAngle + streamAngle;
        if (wp.spread > 0) {
          angle += (Math.random() - 0.5) * wp.spread;
        }

        let spawnX = muzzleX;
        let spawnY = muzzleY;
        if (wp.pellets === 2) {
          const sign = p === 0 ? 1 : -1;
          spawnX += perpX * 9 * sign;
          spawnY += perpY * 9 * sign;
        }

        const isExplosiveRound = isGrenade && p === 0;
        const bulletDmg = isExplosiveRound ? wp.damage * 2.2 : (isRapid ? wp.damage * 1.2 : wp.damage);
        const bulletColor = isClone ? '#c084fc' : (isExplosiveRound ? '#ea580c' : (isRapid ? '#ff3b30' : wp.bulletColor));
        const bulletSize = isExplosiveRound ? 13 : (isRapid ? wp.bulletSize + 2 : wp.bulletSize);
        const bulletSprite = isExplosiveRound ? 'bullet_rocket' : (wp.bulletSprite || 'bullet_orb_red');

        bullets.push({
          x: spawnX,
          y: spawnY,
          vx: Math.cos(angle) * (isExplosiveRound ? wp.speed * 0.85 : wp.speed),
          vy: Math.sin(angle) * (isExplosiveRound ? wp.speed * 0.85 : wp.speed),
          damage: bulletDmg,
          color: bulletColor,
          size: bulletSize,
          sprite: bulletSprite,
          knockback: isExplosiveRound ? 18 : wp.knockback,
          life: 90,
          pierce: isExplosiveRound ? 0 : (wp.pierce || 0),
          isExplosive: isExplosiveRound,
          isPlasma: wp.key === 'weapon_plasma',
          isSniper: wp.key === 'weapon_sniper',
          blastRadius: 150,
          hitEnemies: new Set(),
        });
      }
    });

    return { muzzleX, muzzleY };
  }

  // --- WEAPON SHOOTING (SIMULTANEOUS SQUAD FIRE) ---
  function shootWeapon() {
    const now = Date.now();
    const wp = WEAPONS[currentWeaponId];
    if (!wp) return;
    const isRapid = activePowerups.RAPID > 0;
    const cooldown = isRapid ? wp.cooldown * 0.55 : wp.cooldown;

    if (now - player.lastShotTime < cooldown) return;
    player.lastShotTime = now;
    wp.sound();

    // Aim position in World Coordinates
    const worldAimX = mouse.x + camera.x;
    const worldAimY = mouse.y + camera.y;

    const dx = worldAimX - player.x;
    const dy = worldAimY - player.y;
    const baseAngle = Math.atan2(dy, dx);

    player.shotCount = (player.shotCount || 0) + 1;

    // Main Player Fires
    const pMuzzle = spawnBulletStream(player.x, player.y, baseAngle, false);
    player.muzzleFlash = {
      x: pMuzzle.muzzleX,
      y: pMuzzle.muzzleY,
      angle: baseAngle,
      timer: 4,
    };

    if (wp.screenShake) {
      screenShake = Math.max(screenShake, wp.screenShake);
    } else if (wp.pellets > 1) {
      screenShake = Math.max(screenShake, 6);
    }

    // ALL ACTIVE CLONES FIRE SIMULTANEOUSLY
    if (cloneSquad.count > 1 && cloneSquad.clones.length > 0) {
      cloneSquad.clones.forEach((clone) => {
        const cdx = worldAimX - clone.x;
        const cdy = worldAimY - clone.y;
        const cAngle = Math.atan2(cdy, cdx);
        const cMuzzle = spawnBulletStream(clone.x, clone.y, cAngle, true);
        clone.muzzleFlash = {
          x: cMuzzle.muzzleX,
          y: cMuzzle.muzzleY,
          angle: cAngle,
          timer: 4,
        };
      });
    }

    const isGrenade = wp.hasGrenades && (player.shotCount % 3 === 0);
    if (isGrenade) {
      addFloatText(pMuzzle.muzzleX, pMuzzle.muzzleY - 24, '🚀 GRENADE!', '#fb923c', 20);
    }
  }

  // Helper to choose appropriate enemy type based on current wave progression (1..15)
  function pickEnemyTypeForWave(w) {
    const r = Math.random();
    if (w >= 15) {
      // Wave 15+: Boss spawn chance + high tier mixed army
      if (r < 0.12) return 15; // Mech Titan Boss
      if (r < 0.26) return 11; // Heavy Dreadnought
      if (r < 0.38) return 5;  // Heavy Juggernaut
      if (r < 0.50) return 9;  // Elite Vanguard
      if (r < 0.62) return 12; // Mutant Berserker
      if (r < 0.74) return 3;  // Spec-Ops Gunner
      if (r < 0.86) return 14; // Stealth Infiltrator
      return Math.floor(Math.random() * 14) + 1; // Any of the other 14 types
    }
    if (w >= 11) {
      // Waves 11-14: Dreadnoughts, Toxic Raiders, Infiltrators, Juggernauts, Berserkers
      if (r < 0.20) return 11; // Heavy Dreadnought
      if (r < 0.38) return 13; // Toxic Raider
      if (r < 0.54) return 14; // Stealth Infiltrator
      if (r < 0.70) return 5;  // Heavy Juggernaut
      if (r < 0.85) return 12; // Mutant Berserker
      return [3, 7, 8, 9][Math.floor(Math.random() * 4)];
    }
    if (w >= 8) {
      // Waves 8-10: Juggernauts, Vanguards, Berserkers, Enforcers, Gunners
      if (r < 0.22) return 5;  // Heavy Juggernaut
      if (r < 0.42) return 9;  // Elite Vanguard
      if (r < 0.60) return 12; // Mutant Berserker
      if (r < 0.78) return 7;  // Armored Enforcer
      if (r < 0.90) return 3;  // Spec-Ops Gunner
      return [2, 4, 8, 10][Math.floor(Math.random() * 4)];
    }
    if (w >= 5) {
      // Waves 5-7: Spec-Ops Gunners, Cyber Mercs, Armored Enforcers, Stalkers
      if (r < 0.25) return 3;  // Spec-Ops Gunner
      if (r < 0.48) return 7;  // Armored Enforcer
      if (r < 0.70) return 8;  // Cyber Mercenary
      if (r < 0.85) return 4;  // Shadow Stalker
      return [1, 2, 6, 10][Math.floor(Math.random() * 4)];
    }
    if (w >= 3) {
      // Waves 3-4: Assault Commandos, Shadow Stalkers, Desert Marauders
      if (r < 0.30) return 2;  // Assault Commando
      if (r < 0.55) return 4;  // Shadow Stalker
      if (r < 0.78) return 10; // Desert Marauder
      return [1, 6][Math.floor(Math.random() * 2)];
    }
    if (w >= 2) {
      // Wave 2: Scouts, Infantry, Assault Commandos
      if (r < 0.45) return 1;  // Scout Trooper
      if (r < 0.80) return 6;  // Tactical Infantry
      return 2;                // Assault Commando
    }
    // Wave 1: Scouts & Tactical Infantry
    return r < 0.55 ? 1 : 6;
  }

  // --- ENEMY SPAWNING AROUND CAMERA ---
  function spawnEnemy() {
    const margin = 120;
    const camLeft = camera.x - margin;
    const camRight = camera.x + V_WIDTH + margin;
    const camTop = camera.y - margin;
    const camBottom = camera.y + V_HEIGHT + margin;

    let sx = 0;
    let sy = 0;
    const edge = Math.floor(Math.random() * 4);
    if (edge === 0) {
      sx = camLeft + Math.random() * (camRight - camLeft);
      sy = camTop;
    } else if (edge === 1) {
      sx = camRight;
      sy = camTop + Math.random() * (camBottom - camTop);
    } else if (edge === 2) {
      sx = camLeft + Math.random() * (camRight - camLeft);
      sy = camBottom;
    } else {
      sx = camLeft;
      sy = camTop + Math.random() * (camBottom - camTop);
    }

    const typeId = pickEnemyTypeForWave(wave);
    const proto = ENEMY_TYPES[typeId] || ENEMY_TYPES[1];
    const hpBonus = (wave - 1) * 3.5;
    const speedBonus = Math.min((wave - 1) * 0.03, 0.7);

    enemies.push({
      typeId,
      x: sx,
      y: sy,
      hp: proto.hp + hpBonus,
      maxHp: proto.hp + hpBonus,
      speed: proto.speed + speedBonus,
      radius: proto.radius,
      score: proto.score,
      scale: proto.scale,
      color: proto.color,
      animState: 'move',
      animFrame: Math.floor(Math.random() * 8),
      animTick: Math.floor(Math.random() * 5),
      hitTimer: 0,
      facingLeft: false,
      canShoot: !!proto.canShoot,
      shootRange: proto.shootRange || 540,
      shootCooldown: proto.shootCooldown || 200,
      shootTimer: Math.floor(Math.random() * 100) + 60,
      hasFired: false,
      isDying: false,
      readyToRemove: false,
    });
  }

  // --- WAVE BOSS SPAWNING & PROGRESSION ---
  function spawnWaveBoss(currentWave) {
    const margin = 160;
    const camLeft = camera.x - margin;
    const camRight = camera.x + V_WIDTH + margin;
    const camTop = camera.y - margin;

    // Enter dramatically from top
    const sx = camLeft + Math.random() * (camRight - camLeft);
    const sy = camTop - 40;

    let typeId = 1;
    let bossName = 'ELITE COMMANDER';
    if (currentWave === 1) {
      typeId = 1;
      bossName = 'ELITE SCOUT COMMANDER';
    } else if (currentWave === 2) {
      typeId = 2;
      bossName = 'ASSAULT OVERLORD';
    } else if (currentWave === 3) {
      typeId = 5;
      bossName = 'HEAVY JUGGERNAUT';
    } else if (currentWave === 4) {
      typeId = 3;
      bossName = 'SPEC-OPS CYBORG';
    } else if (currentWave === 5) {
      typeId = 4;
      bossName = 'SHADOW WARLORD';
    } else {
      const bossTypes = [5, 8, 11, 13, 14, 15];
      typeId = bossTypes[(currentWave - 6) % bossTypes.length] || 15;
      const proto = ENEMY_TYPES[typeId] || ENEMY_TYPES[15];
      bossName = `TITAN ${proto.name || 'WARLORD'}`;
    }

    const proto = ENEMY_TYPES[typeId] || ENEMY_TYPES[1];

    // Dynamic Boss HP scaling: gets progressively tougher every wave
    const baseHp = 260 + (currentWave - 1) * 240 + Math.pow(currentWave, 1.45) * 50;
    const bossHp = Math.round(baseHp);

    const scale = Math.min(1.48, Math.max(0.92, proto.scale * 1.35 + (currentWave - 1) * 0.025));
    const radius = Math.round(proto.radius * (scale / proto.scale));
    const speed = Math.min(2.5, Math.max(1.4, proto.speed * 0.85 + currentWave * 0.035));

    const bossObj = {
      isWaveBoss: true,
      bossName,
      typeId,
      x: sx,
      y: sy,
      hp: bossHp,
      maxHp: bossHp,
      speed,
      radius,
      score: 500 + currentWave * 250,
      scale,
      color: '#ef4444',
      animState: 'move',
      animFrame: 0,
      animTick: 0,
      hitTimer: 0,
      facingLeft: false,
      canShoot: true,
      shootRange: 950,
      shootCooldown: Math.max(65, 145 - currentWave * 4),
      shootTimer: 60,
      hasFired: false,
      isDying: false,
      readyToRemove: false,
      shockwaveTimer: 320, // special seismic attack
    };

    enemies.push(bossObj);
    waveBoss = bossObj;

    SOUNDS.playNuke();
    screenShake = 26;
    createShockwave(sx, sy, '#ef4444', 360);
    createSparks(sx, sy, 50, '#ef4444');
    addFloatText(player.x, player.y - 140, `💀 ${bossName} HAS ARRIVED!`, '#ef4444', 36);

    return bossObj;
  }

  // --- PLAYER HURT & 3 LIVES ---
  function hurtPlayer() {
    if (player.invincibleTimer > 0 || player.dead || activePowerups.VANISH > 0 ||
        waveState === 'BOSS_REWARD' || waveState === 'WAVE_ARRIVAL') return;

    // Shield Absorb
    if (activePowerups.SHIELD) {
      activePowerups.SHIELD = false;
      SOUNDS.playShieldBreak();
      screenShake = 10;
      createShockwave(player.x, player.y, '#818cf8', 140);
      addFloatText(player.x, player.y - 70, 'SHIELD BROKEN! 🛡️', '#818cf8', 28);
      player.invincibleTimer = 45;
      updatePowerupTray();

      // Repel enemies
      enemies.forEach((e) => {
        const dx = e.x - player.x;
        const dy = e.y - player.y;
        const dist = Math.hypot(dx, dy) || 1;
        if (dist < 220) {
          e.x += (dx / dist) * 120;
          e.y += (dy / dist) * 120;
        }
      });
      return;
    }

    player.lives--;
    player.invincibleTimer = 90; // ~1.5s invulnerable
    player.animState = 'hit';
    player.animFrame = 0;
    screenShake = 16;
    SOUNDS.playPlayerHurt();
    updateHUD();

    // Shockwave knockback
    enemies.forEach((e) => {
      const dx = e.x - player.x;
      const dy = e.y - player.y;
      const dist = Math.hypot(dx, dy) || 1;
      if (dist < 240) {
        e.x += (dx / dist) * 110;
        e.y += (dy / dist) * 110;
      }
    });

    createSparks(player.x, player.y, 30, '#ef4444');

    if (player.lives <= 0) {
      player.dead = true;
      player.animState = 'death';
      player.animFrame = 0;
      SOUNDS.playGameOver();
      setTimeout(() => {
        gameOver();
      }, 1500);
    }
  }

  function gameOver() {
    gameState = 'GAMEOVER';
    if (score > highScore) {
      highScore = score;
      localStorage.setItem('circle_def_high', highScore);
    }

    const min = Math.floor(survivalTime / 60);
    const sec = Math.floor(survivalTime % 60);
    const timeStr = `${min}:${sec < 10 ? '0' : ''}${sec}`;

    document.getElementById('finalScore').innerText = score.toLocaleString();
    document.getElementById('finalHighScore').innerText = highScore.toLocaleString();
    document.getElementById('finalKills').innerText = kills;
    document.getElementById('finalWave').innerText = wave;
    document.getElementById('finalTime').innerText = timeStr;
    document.getElementById('gameOverOverlay').classList.remove('hidden');
  }

  // --- UPDATE LOOP ---
  function update(dt) {
    if (gameState !== 'PLAYING') {
      if (gameState === 'GAMEOVER' && player.dead) {
        player.animTick++;
        if (player.animTick % 6 === 0 && player.animFrame < 9) {
          player.animFrame++;
        }
      }
      return;
    }

    survivalTime += dt;

    // Wave Progression & End-of-Wave Boss Battle State Machine
    if (waveState === 'REGULAR') {
      waveTimer += dt;
      const targetKills = 8 + wave * 2;
      if (waveTimer >= 22 || waveRegularKills >= targetKills) {
        waveState = 'BOSS_INCOMING';
        waveBossCountdown = 2.0;
        waveBanner = { text: `⚠️ WAVE ${wave} BOSS APPROACHING! 💀`, timer: 140 };
        SOUNDS.playNuke();
        screenShake = 20;

        // Clear out remaining weak minions so the duel with the boss is focused
        for (let i = enemies.length - 1; i >= 0; i--) {
          const e = enemies[i];
          if (!e.isWaveBoss) {
            e.isDying = true;
            e.animState = 'death';
            e.animFrame = 0;
            createEnemyDeathFX(e.x, e.y, ENEMY_TYPES[e.typeId] || ENEMY_TYPES[1]);
          }
        }
      }
    } else if (waveState === 'BOSS_INCOMING') {
      waveBossCountdown -= dt;
      if (waveBossCountdown <= 0) {
        waveState = 'BOSS_FIGHT';
        waveBoss = spawnWaveBoss(wave);
        waveBanner = { text: `⚔️ BOSS DUEL: ${waveBoss.bossName}!`, timer: 180 };
      }
    } else if (waveState === 'BOSS_FIGHT') {
      // Check if boss has been eliminated
      if (!waveBoss || waveBoss.hp <= 0 || waveBoss.isDying) {
        waveState = 'BOSS_REWARD';
        waveCinematicTimer = 3.5; // 3.5s reward collection window

        const rewardX = waveBoss ? waveBoss.x : player.x;
        const rewardY = waveBoss ? waveBoss.y : player.y;

        score += 1000 * wave;
        SOUNDS.playNuke();
        screenShake = 28;
        waveBanner = { text: `🎁 BOSS DEFEATED! CLAIM YOUR REWARD! 🏆`, timer: 200 };
        addFloatText(rewardX, rewardY - 120, `+${1000 * wave} BOSS BOUNTY! 🏆`, '#facc15', 38);

        // Clear all enemy projectiles and eliminate weak minions
        enemyBullets.length = 0;
        enemies.forEach((e) => {
          if (!e.isDying && !e.isWaveBoss) {
            e.isDying = true;
            e.animState = 'death';
            e.animFrame = 0;
            createEnemyDeathFX(e.x, e.y, ENEMY_TYPES[e.typeId] || ENEMY_TYPES[1]);
          }
        });

        // --- RANDOM BOSS REWARD SELECTION ---
        const maxTier = wave >= 14 ? 8 : (wave >= 12 ? 7 : (wave >= 10 ? 6 : (wave >= 8 ? 5 : (wave >= 6 ? 4 : (wave >= 4 ? 3 : (wave >= 2 ? 2 : 1))))));
        const availableLocked = [];
        for (let id = 2; id <= maxTier; id++) {
          if (!unlockedWeapons.includes(id)) availableLocked.push(id);
        }

        // Build possible reward pool
        const rewardPool = [];
        if (availableLocked.length > 0) rewardPool.push('WEAPON');
        rewardPool.push('POWER', 'LIFE', 'CLONE');

        const chosenReward = rewardPool[Math.floor(Math.random() * rewardPool.length)];

        if (chosenReward === 'WEAPON') {
          // Drop next locked weapon
          spawnFieldWeaponDrop(availableLocked[0], true);
          addFloatText(rewardX, rewardY - 60, '🔫 NEW WEAPON!', '#facc15', 30);
        } else if (chosenReward === 'LIFE') {
          // Drop extra life
          const pInfo = POWERUP_TYPES['LIFE'];
          drops.push({
            x: rewardX + (Math.random() - 0.5) * 80,
            y: rewardY + (Math.random() - 0.5) * 80,
            type: 'LIFE',
            info: pInfo,
            bounceTick: 0,
            life: 2400,
            isBossReward: true,
          });
          addFloatText(rewardX, rewardY - 60, '❤️ EXTRA LIFE!', '#ff2a4b', 30);
        } else if (chosenReward === 'CLONE') {
          // Drop clone powerup (will be 30s when collected as boss reward)
          const pInfo = POWERUP_TYPES['CLONE'];
          drops.push({
            x: rewardX + (Math.random() - 0.5) * 80,
            y: rewardY + (Math.random() - 0.5) * 80,
            type: 'CLONE',
            info: pInfo,
            bounceTick: 0,
            life: 2400,
            isBossReward: true,
          });
          addFloatText(rewardX, rewardY - 60, '👥 SHADOW CLONE (30s)!', '#c084fc', 30);
        } else {
          // Drop random power boost
          const powerOptions = ['RAPID', 'SPEED', 'SHIELD', 'NUKE'];
          const powerKey = powerOptions[Math.floor(Math.random() * powerOptions.length)];
          const pInfo = POWERUP_TYPES[powerKey];
          drops.push({
            x: rewardX + (Math.random() - 0.5) * 80,
            y: rewardY + (Math.random() - 0.5) * 80,
            type: powerKey,
            info: pInfo,
            bounceTick: 0,
            life: 2400,
            isBossReward: true,
          });
          addFloatText(rewardX, rewardY - 60, `⚡ ${pInfo.name}!`, pInfo.color, 30);
        }

        // Golden reward glow shockwave at boss death location
        createShockwave(rewardX, rewardY, '#facc15', 350);
        createShockwave(rewardX, rewardY, '#fbbf24', 200);
        createSparks(rewardX, rewardY, 50, '#facc15');
        createSparks(rewardX, rewardY, 30, '#ffffff');

        updateHUD();
      }
    } else if (waveState === 'BOSS_REWARD') {
      // Reward collection window — auto-advance after timer or when no boss reward drops remain
      waveCinematicTimer -= dt;

      // Check if all boss reward drops have been collected
      const bossRewardDropsLeft = drops.filter(d => d.isBossReward).length;
      const shouldAdvance = waveCinematicTimer <= 0 || bossRewardDropsLeft === 0;

      if (shouldAdvance) {
        // Advance to next wave
        wave++;
        waveState = 'WAVE_ARRIVAL';
        waveCinematicTimer = 0.85;

        // Reposition player smoothly (no teleportation)
        player.vx = 0;
        player.vy = 0;

        if (wave === 15) {
          waveBanner = { text: 'WAVE 15 - SHADOW CLONE ABILITY UNLOCKED! 👥', timer: 200 };
        } else if (wave === 18) {
          waveBanner = { text: 'WAVE 18 - GHOST CLOAK ABILITY UNLOCKED! 👻', timer: 200 };
        } else {
          waveBanner = { text: `⚔️ WAVE ${wave} INCOMING! GET READY!`, timer: 180 };
        }

        SOUNDS.playMeteorLanding();
        createShockwave(player.x, player.y, '#38bdf8', 440);
        createSparks(player.x, player.y, 60, '#38bdf8');
        screenShake = 30;
        updateHUD();
      }
    } else if (waveState === 'WAVE_ARRIVAL') {
      waveCinematicTimer -= dt;
      player.vx = 0;
      player.vy = 0;
      if (waveCinematicTimer <= 0) {
        waveState = 'REGULAR';
        waveTimer = 0;
        waveRegularKills = 0;
        waveBoss = null;
        portal.active = false;
        portal.particles = [];
        spawnInterval = Math.max(500, 1400 - (wave - 1) * 60);
      }
    }
    if (waveBanner.timer > 0) waveBanner.timer--;

    // Update portal suction particles
    if (portal.active && portal.particles.length > 0) {
      for (let pi = portal.particles.length - 1; pi >= 0; pi--) {
        const p = portal.particles[pi];
        p.ang += dt * 4.5;
        p.dist -= p.speed * 60 * dt;
        p.x = portal.x + Math.cos(p.ang) * p.dist;
        p.y = portal.y + Math.sin(p.ang) * p.dist;
        if (p.dist <= 10) {
          portal.particles.splice(pi, 1);
        }
      }
    }

    // Update active power-ups
    let trayNeedsUpdate = false;
    if (activePowerups.VANISH > 0) {
      activePowerups.VANISH -= dt;
      if (activePowerups.VANISH <= 0) {
        activePowerups.VANISH = 0;
        addFloatText(player.x, player.y - 70, '👻 CLOAK EXPIRED', '#94a3b8', 24);
        trayNeedsUpdate = true;
      }
    }
    if (activePowerups.RAPID > 0) {
      activePowerups.RAPID -= dt;
      if (activePowerups.RAPID <= 0) {
        activePowerups.RAPID = 0;
        trayNeedsUpdate = true;
      }
    }
    if (activePowerups.SPEED > 0) {
      activePowerups.SPEED -= dt;
      if (activePowerups.SPEED <= 0) {
        activePowerups.SPEED = 0;
        trayNeedsUpdate = true;
      }
    }
    // Update Shadow Clone Squad
    if (cloneSquad.count > 1) {
      cloneSquad.timer -= dt;
      if (cloneSquad.timer <= 0) {
        dissolveClones();
        trayNeedsUpdate = true;
      } else {
        trayNeedsUpdate = true;
        // Smoothly lerp clones toward their tactical formation positions
        cloneSquad.clones.forEach((clone) => {
          const actualDx = player.facingLeft ? -clone.targetDx : clone.targetDx;
          const targetX = player.x + actualDx;
          const targetY = player.y + clone.targetDy;

          clone.x += (targetX - clone.x) * 0.24;
          clone.y += (targetY - clone.y) * 0.24;
          clone.facingLeft = player.facingLeft;
          clone.animState = player.animState;
          clone.animFrame = player.animFrame;

          if (clone.muzzleFlash) {
            clone.muzzleFlash.timer--;
            if (clone.muzzleFlash.timer <= 0) clone.muzzleFlash = null;
          }
        });
      }
    }

    if (trayNeedsUpdate || activePowerups.RAPID > 0 || activePowerups.SPEED > 0 || activePowerups.VANISH > 0 || cloneSquad.count > 1) {
      updatePowerupTray();
    }

    // Screen Shake decay
    if (screenShake > 0) {
      screenShake *= 0.88;
      if (screenShake < 0.2) screenShake = 0;
    }

    // Cinematic Transition Check: suppress user control & shooting
    const isCinematicTransition = (waveState === 'BOSS_REWARD' || waveState === 'WAVE_ARRIVAL');

    // Update Smart Nearest Enemy
    lockedEnemy = isCinematicTransition ? null : getNearestEnemy();
    lockReticleTick += dt * 4;

    // Movement Inputs (WASD + Virtual Joystick)
    let mx = 0;
    let my = 0;
    if (!isCinematicTransition) {
      if (keys['KeyW'] || keys['ArrowUp']) my -= 1;
      if (keys['KeyS'] || keys['ArrowDown']) my += 1;
      if (keys['KeyA'] || keys['ArrowLeft']) mx -= 1;
      if (keys['KeyD'] || keys['ArrowRight']) mx += 1;

      if (joystick.active && joystick.distance > joystick.deadZone) {
        mx += joystick.dx;
        my += joystick.dy;
      }
    }

    const moveDist = Math.hypot(mx, my);
    const speedMultiplier = activePowerups.SPEED > 0 ? 1.6 : 1.0;

    if (moveDist > 0 && !player.dead && !isCinematicTransition) {
      const norm = Math.min(1.0, moveDist);
      player.vx += (mx / moveDist) * norm * (player.baseSpeed * speedMultiplier) * 0.28;
      player.vy += (my / moveDist) * norm * (player.baseSpeed * speedMultiplier) * 0.28;
      if (player.animState !== 'hit' && player.animState !== 'death') {
        player.animState = 'walk';
      }

      // Ghost trail for Speed Boost
      if (activePowerups.SPEED > 0) {
        player.trailTimer++;
        if (player.trailTimer % 3 === 0) {
          playerGhostTrails.push({
            x: player.x,
            y: player.y,
            frame: player.animFrame,
            facingLeft: player.facingLeft,
            alpha: 0.7,
          });
        }
      }
    } else {
      if (player.animState !== 'hit' && player.animState !== 'death') {
        player.animState = 'idle';
      }
    }

    // Player Friction & Physics (NO BOUNDARY - INFINITE MOVEMENT)
    if (!isCinematicTransition) {
      player.vx *= 0.82;
      player.vy *= 0.82;
      player.x += player.vx;
      player.y += player.vy;
    }

    // Soft collision against Environment Rock/Barricade Obstacles
    const pChunkX = Math.floor(player.x / PROP_CHUNK_SIZE);
    const pChunkY = Math.floor(player.y / PROP_CHUNK_SIZE);
    for (let cx = pChunkX - 1; cx <= pChunkX + 1; cx++) {
      for (let cy = pChunkY - 1; cy <= pChunkY + 1; cy++) {
        const cProps = getPropsForChunk(cx, cy);
        for (let i = 0; i < cProps.length; i++) {
          const pr = cProps[i];
          if (!pr.isObstacle) continue;
          const dx = player.x - pr.x;
          const dy = player.y - (pr.y + (pr.shadowY || 0) * 0.4);
          const dist = Math.hypot(dx, dy);
          const minDist = pr.obstacleRadius + player.radius * 0.6;
          if (dist < minDist && dist > 0.001) {
            const push = (minDist - dist) * 0.4;
            player.x += (dx / dist) * push;
            player.y += (dy / dist) * push;
          }
        }
      }
    }

    // Follow Camera (smooth lerp toward player)
    const targetCamX = player.x - V_WIDTH / 2;
    const targetCamY = player.y - V_HEIGHT / 2;
    camera.x += (targetCamX - camera.x) * 0.12;
    camera.y += (targetCamY - camera.y) * 0.12;

    // --- AIMING & SHOOTING LOGIC ---
    let shouldShoot = false;
    const screenPx = player.x - camera.x;
    const screenPy = player.y - camera.y;

    if (!isCinematicTransition) {
      if (aimControl.isDragging) {
        // Manual 360 Aim Joystick Mode
        mouse.x = screenPx + Math.cos(aimControl.angle) * 550;
        mouse.y = screenPy + Math.sin(aimControl.angle) * 550;
        shouldShoot = true;
      } else if (aimControl.active) {
        // Fire Button tapped/held without drag -> Auto-Aim at nearest enemy
        if (lockedEnemy) {
          const aimAngle = Math.atan2(lockedEnemy.y - player.y, lockedEnemy.x - player.x);
          mouse.x = screenPx + Math.cos(aimAngle) * 550;
          mouse.y = screenPy + Math.sin(aimAngle) * 550;
        } else {
          const fallbackAngle = player.facingLeft ? Math.PI : 0;
          mouse.x = screenPx + Math.cos(fallbackAngle) * 550;
          mouse.y = screenPy + Math.sin(fallbackAngle) * 550;
        }
        shouldShoot = true;
      } else if (mouse.isDesktopDown) {
        // Desktop mouse click/drag
        shouldShoot = true;
      } else if (autoFireEnabled && lockedEnemy && !player.dead) {
        // Automatic Fire Mode toward nearest enemy
        const aimAngle = Math.atan2(lockedEnemy.y - player.y, lockedEnemy.x - player.x);
        mouse.x = screenPx + Math.cos(aimAngle) * 550;
        mouse.y = screenPy + Math.sin(aimAngle) * 550;
        shouldShoot = true;
      }
    }

    // Facing Direction
    const worldAimX = mouse.x + camera.x;
    if (worldAimX < player.x) {
      player.facingLeft = true;
    } else {
      player.facingLeft = false;
    }

    // Invincibility Timer
    if (player.invincibleTimer > 0) {
      player.invincibleTimer--;
      if (player.invincibleTimer === 0 && player.animState === 'hit') {
        player.animState = 'idle';
      }
    }

    // Player Animation
    player.animTick++;
    if (player.animTick % 5 === 0) {
      const count =
        player.animState === 'idle'
          ? 6
          : player.animState === 'walk'
          ? 8
          : player.animState === 'hit'
          ? 3
          : 10;
      player.animFrame = (player.animFrame + 1) % count;
    }

    // Active Shooting
    if (shouldShoot && !player.dead) {
      shootWeapon();
    }

    if (player.muzzleFlash) {
      player.muzzleFlash.timer--;
      if (player.muzzleFlash.timer <= 0) player.muzzleFlash = null;
    }

    // Update Ghost Trails
    for (let i = playerGhostTrails.length - 1; i >= 0; i--) {
      const tr = playerGhostTrails[i];
      tr.alpha -= 0.05;
      if (tr.alpha <= 0) playerGhostTrails.splice(i, 1);
    }

    // Update Bullets
    for (let i = bullets.length - 1; i >= 0; i--) {
      const b = bullets[i];
      b.x += b.vx;
      b.y += b.vy;
      b.life--;

      // Visual tracers for sniper, plasma, and explosive rounds
      if (b.isSniper && Math.random() < 0.4) {
        particles.push({
          x: b.x,
          y: b.y,
          vx: 0,
          vy: 0,
          color: '#f43f5e',
          size: 3.5,
          alpha: 0.8,
          decay: 0.08,
        });
      } else if (b.isPlasma && Math.random() < 0.45) {
        particles.push({
          x: b.x + (Math.random() - 0.5) * 6,
          y: b.y + (Math.random() - 0.5) * 6,
          vx: (Math.random() - 0.5) * 1.5,
          vy: (Math.random() - 0.5) * 1.5,
          color: '#60a5fa',
          size: 6,
          alpha: 0.85,
          decay: 0.07,
        });
      } else if (b.isExplosive && Math.random() < 0.5) {
        particles.push({
          x: b.x,
          y: b.y,
          vx: (Math.random() - 0.5) * 1.2,
          vy: (Math.random() - 0.5) * 1.2,
          color: '#fb923c',
          size: 5,
          alpha: 0.75,
          decay: 0.06,
        });
      }

      let bulletDead = false;

      for (let j = enemies.length - 1; j >= 0; j--) {
        const e = enemies[j];
        if (e.isDying || e.hp <= 0) continue;
        if (b.hitEnemies && b.hitEnemies.has(e)) continue;

        const dist = Math.hypot(b.x - e.x, b.y - e.y);
        if (dist < e.radius + b.size) {
          if (!b.hitEnemies) b.hitEnemies = new Set();
          b.hitEnemies.add(e);

          if (b.isExplosive) {
            // Detonate explosive rocket grenade
            createShockwave(b.x, b.y, '#f97316', b.blastRadius || 150);
            createSparks(b.x, b.y, 25, '#fb923c');
            createSparks(b.x, b.y, 15, '#ffffff');
            SOUNDS.playExplosion(false);
            screenShake = Math.max(screenShake, 8);

            enemies.forEach((splashE) => {
              if (splashE.isDying || splashE.hp <= 0) return;
              const sDist = Math.hypot(splashE.x - b.x, splashE.y - b.y);
              const maxR = b.blastRadius || 150;
              if (sDist < maxR) {
                const splashDmg = b.damage * (1 - sDist / (maxR * 1.15));
                splashE.hp -= splashDmg;
                splashE.hitTimer = 6;
                addFloatText(splashE.x + (Math.random() - 0.5) * 15, splashE.y - 20, `${Math.round(splashDmg)}`, '#fb923c', 22);
              }
            });

            bulletDead = true;
            break;
          }

          // Direct Hit
          e.hp -= b.damage;
          e.hitTimer = 6;
          SOUNDS.playHit();

          const bAngle = Math.atan2(b.vy, b.vx);
          e.x += Math.cos(bAngle) * b.knockback;
          e.y += Math.sin(bAngle) * b.knockback;

          createSparks(b.x, b.y, 5, e.color);
          addFloatText(e.x + (Math.random() - 0.5) * 20, e.y - 18, `${Math.round(b.damage)}`, '#fef08a', 20);

          if (b.pierce && b.pierce > 0) {
            b.pierce--;
            // Piercing round penetrates through
          } else {
            bulletDead = true;
            break;
          }
        }
      }

      // Check for destroyed enemies (triggers death animation)
      for (let j = 0; j < enemies.length; j++) {
        const e = enemies[j];
        if (e.hp <= 0 && !e.isDying) {
          e.isDying = true;
          e.animState = 'death';
          e.animFrame = 0;
          e.animTick = 0;

          const proto = ENEMY_TYPES[e.typeId] || ENEMY_TYPES[1];
          SOUNDS.playExplosion(proto.radius > 40);
          kills++;

          const earned = proto.score;
          score += earned;
          addFloatText(e.x, e.y - 35, `+${earned}`, proto.color, 32);

          if (score > highScore) {
            highScore = score;
            localStorage.setItem('circle_def_high', highScore);
          }
          updateHUD();
        }
      }

      if (bulletDead || b.life <= 0) {
        bullets.splice(i, 1);
      }
    }

    // Spawning Enemies outside viewport with balanced flow
    const now = Date.now();
    let currentSpawnInterval = spawnInterval;
    let spawnBatch = 1;

    // Moderate enjoyable surge during clone uptime so player has fun mowing down targets without getting overwhelmed
    if (cloneSquad.count > 1) {
      currentSpawnInterval = Math.max(480, spawnInterval * 0.8);
      if (Math.random() < 0.25) spawnBatch = 2;
    }

    if (now - lastSpawnTime > currentSpawnInterval) {
      lastSpawnTime = now;
      if (waveState === 'REGULAR') {
        for (let s = 0; s < spawnBatch; s++) {
          spawnEnemy();
        }
      }
    }

    // Update Enemies (with physical death, shooter AI, and walking cycles)
    const isPlayerVanished = activePowerups.VANISH > 0;

    for (let i = enemies.length - 1; i >= 0; i--) {
      const e = enemies[i];

      // Physical Death Animation Progress
      if (e.isDying) {
        e.animTick++;
        if (e.animTick % 4 === 0) {
          e.animFrame++;
          const deathFrames = (ENEMY_ANIMATIONS[e.typeId]?.death?.length) || 14;
          if (e.animFrame >= deathFrames) {
            const proto = ENEMY_TYPES[e.typeId] || ENEMY_TYPES[1];
            createEnemyDeathFX(e.x, e.y, proto);
            checkEnemyDrop(e.x, e.y, e);
            if (!e.isWaveBoss) {
              waveRegularKills++;
            } else {
              waveBoss = null;
            }
            enemies.splice(i, 1);
            continue;
          }
        }
        continue;
      }

      const edx = player.x - e.x;
      const edy = player.y - e.y;
      const pDist = Math.hypot(edx, edy) || 1;
      e.facingLeft = edx < 0;

      if (e.hitTimer > 0) e.hitTimer--;

      if (player.dead) {
        e.animState = 'idle';
        e.animTick++;
        if (e.animTick % 6 === 0) {
          const idleTotal = (ENEMY_ANIMATIONS[e.typeId]?.idle?.length) || (ENEMY_ANIMATIONS[e.typeId]?.move?.length) || 14;
          e.animFrame = (e.animFrame + 1) % idleTotal;
        }
        continue;
      }

      // Shooter behavior (disabled if player is vanished)
      if (e.canShoot && !isPlayerVanished) {
        if (e.shootTimer > 0) e.shootTimer--;
        if (pDist < e.shootRange && e.shootTimer <= 0 && e.animState !== 'shoot') {
          e.animState = 'shoot';
          e.animFrame = 0;
          e.animTick = 0;
          e.hasFired = false;
        }
      }

      if (e.animState === 'shoot') {
        e.animTick++;
        if (e.animTick % 4 === 0) {
          e.animFrame++;
          if (e.animFrame === 7 && !e.hasFired) {
            e.hasFired = true;
            spawnEnemyBullet(e);
          }
          const shootTotal = (ENEMY_ANIMATIONS[e.typeId]?.shoot?.length) || 14;
          if (e.animFrame >= shootTotal) {
            e.animState = 'move';
            e.animFrame = 0;
            e.shootTimer = e.shootCooldown + Math.floor(Math.random() * 60);
          }
        }
      } else {
        // Move / Walk animation
        e.animState = 'move';
        e.animTick++;
        if (e.animTick % 5 === 0) {
          const moveTotal = (ENEMY_ANIMATIONS[e.typeId]?.move?.length) || 14;
          e.animFrame = (e.animFrame + 1) % moveTotal;
        }

        if (isPlayerVanished) {
          // Player is invisible! Enemies wander around confused
          if (!e.wanderTimer || e.wanderTimer <= 0) {
            e.wanderAngle = (e.wanderAngle !== undefined ? e.wanderAngle : Math.random() * Math.PI * 2) + (Math.random() - 0.5) * 1.6;
            e.wanderTimer = 35 + Math.floor(Math.random() * 45);
          } else {
            e.wanderTimer--;
          }
          e.x += Math.cos(e.wanderAngle) * (e.speed * 0.65);
          e.y += Math.sin(e.wanderAngle) * (e.speed * 0.65);
          e.facingLeft = Math.cos(e.wanderAngle) < 0;
        } else {
          const moveAngle = Math.atan2(edy, edx);
          e.x += Math.cos(moveAngle) * e.speed;
          e.y += Math.sin(moveAngle) * e.speed;
        }
      }

      // Boss Special Attacks (Seismic shockwaves)
      if (e.isWaveBoss && !e.isDying) {
        if (e.shockwaveTimer > 0) e.shockwaveTimer--;
        if (e.shockwaveTimer <= 0) {
          e.shockwaveTimer = 340;
          screenShake = 18;
          createShockwave(e.x, e.y, '#ef4444', 320);
          createSparks(e.x, e.y, 45, '#ef4444');
          addFloatText(e.x, e.y - 45, '⚡ SEISMIC ROAR! ⚡', '#ef4444', 30);
          if (pDist < 320 && !isPlayerVanished) {
            player.vx = (edx / pDist) * 16;
            player.vy = (edy / pDist) * 16;
            hurtPlayer();
          }
        }
      }

      // Enemy Player Collision (immune if player is vanished)
      if (!player.dead && !isPlayerVanished) {
        if (pDist < e.radius + player.radius) {
          hurtPlayer();
        }
      }
    }

    // Update Enemy Projectiles
    for (let i = enemyBullets.length - 1; i >= 0; i--) {
      const eb = enemyBullets[i];
      eb.x += eb.vx;
      eb.y += eb.vy;
      eb.life--;

      if (!player.dead && !isPlayerVanished) {
        const pDist = Math.hypot(eb.x - player.x, eb.y - player.y);
        if (pDist < eb.radius + player.radius) {
          hurtPlayer();
          createSparks(eb.x, eb.y, 12, '#ef4444');
          enemyBullets.splice(i, 1);
          continue;
        }
      }

      if (eb.life <= 0) {
        enemyBullets.splice(i, 1);
      }
    }

    // Update Collectible Drops
    for (let i = drops.length - 1; i >= 0; i--) {
      const d = drops[i];
      d.bounceTick += 0.08;
      d.life--;

      // Magnetic attraction to player when close
      const pDist = Math.hypot(d.x - player.x, d.y - player.y);
      if (pDist < 160) {
        d.x += ((player.x - d.x) / pDist) * 7;
        d.y += ((player.y - d.y) / pDist) * 7;
      }

      if (pDist < player.radius + 28) {
        collectPowerup(d);
        drops.splice(i, 1);
        continue;
      }

      if (d.life <= 0) {
        drops.splice(i, 1);
      }
    }

    // Update Shockwaves
    for (let i = shockwaves.length - 1; i >= 0; i--) {
      const sw = shockwaves[i];
      sw.radius += (sw.maxRadius - sw.radius) * 0.18 + 4;
      sw.alpha -= 0.035;
      if (sw.radius >= sw.maxRadius || sw.alpha <= 0) {
        shockwaves.splice(i, 1);
      }
    }

    // Update Particles
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.alpha -= p.decay;
      if (p.isSmoke) {
        p.size += 1.2;
        p.rotation += 0.02;
      }
      if (p.alpha <= 0) {
        particles.splice(i, 1);
      }
    }

    // Update Floating Text
    for (let i = floatTexts.length - 1; i >= 0; i--) {
      const ft = floatTexts[i];
      ft.y += ft.vy;
      ft.scale = Math.max(1.0, ft.scale - 0.02);
      ft.life--;
      ft.alpha = ft.life / 55;
      if (ft.life <= 0) {
        floatTexts.splice(i, 1);
      }
    }

    // Update Ground Decals
    for (let i = groundDecals.length - 1; i >= 0; i--) {
      const gd = groundDecals[i];
      gd.life--;
      if (gd.life < 60) {
        gd.alpha = (gd.life / 60) * 0.55;
      }
      if (gd.life <= 0) {
        groundDecals.splice(i, 1);
      }
    }
  }

  // --- OFF-SCREEN ENEMY THREAT INDICATOR ---
  function drawOffscreenIndicators() {
    if (gameState !== 'PLAYING' || player.dead) return;

    // Viewport border bounds for edge clamping
    const boxMinX = 50;
    const boxMaxX = V_WIDTH - 50;
    const boxMinY = 175;
    const boxMaxY = V_HEIGHT - 175;

    // Origin for raycasting in screen space (relative to player)
    const screenPx = player.x - camera.x;
    const screenPy = player.y - camera.y;
    const px = Math.max(boxMinX + 15, Math.min(boxMaxX - 15, screenPx));
    const py = Math.max(boxMinY + 15, Math.min(boxMaxY - 15, screenPy));

    const offscreenEnemies = [];

    for (let i = 0; i < enemies.length; i++) {
      const e = enemies[i];
      if (e.hp <= 0 || e.isDying) continue;
      // Skip if enemy is on screen
      if (isEnemyOnScreen(e, 0)) continue;

      const vx = e.x - player.x;
      const vy = e.y - player.y;
      const dist = Math.hypot(vx, vy);
      if (dist > 3200 || dist < 1) continue;

      let tMin = Infinity;
      if (vx > 0) {
        const t = (boxMaxX - px) / vx;
        if (t > 0 && t < tMin) tMin = t;
      } else if (vx < 0) {
        const t = (boxMinX - px) / vx;
        if (t > 0 && t < tMin) tMin = t;
      }

      if (vy > 0) {
        const t = (boxMaxY - py) / vy;
        if (t > 0 && t < tMin) tMin = t;
      } else if (vy < 0) {
        const t = (boxMinY - py) / vy;
        if (t > 0 && t < tMin) tMin = t;
      }

      if (!isFinite(tMin) || tMin <= 0) continue;

      const edgeX = Math.max(boxMinX, Math.min(boxMaxX, px + vx * tMin));
      const edgeY = Math.max(boxMinY, Math.min(boxMaxY, py + vy * tMin));
      const angle = Math.atan2(vy, vx);

      const proto = ENEMY_TYPES[e.typeId] || ENEMY_TYPES[1];
      const isBoss = (proto.hp >= 200 || e.typeId === 15 || proto.radius >= 44);

      offscreenEnemies.push({
        edgeX,
        edgeY,
        angle,
        dist,
        isBoss,
        canShoot: !!e.canShoot,
        color: proto.color || '#ef4444'
      });
    }

    if (offscreenEnemies.length === 0) return;

    // Cluster nearby indicators along the edge
    const clusters = [];
    for (let i = 0; i < offscreenEnemies.length; i++) {
      const item = offscreenEnemies[i];
      let matched = null;
      for (let c of clusters) {
        if (Math.hypot(c.x - item.edgeX, c.y - item.edgeY) < 52) {
          matched = c;
          break;
        }
      }
      if (matched) {
        matched.count++;
        if (item.dist < matched.dist) {
          matched.dist = item.dist;
          matched.x = item.edgeX;
          matched.y = item.edgeY;
          matched.angle = item.angle;
        }
        if (item.isBoss) matched.isBoss = true;
        if (item.canShoot) matched.hasShooter = true;
      } else {
        clusters.push({
          x: item.edgeX,
          y: item.edgeY,
          angle: item.angle,
          dist: item.dist,
          count: 1,
          isBoss: item.isBoss,
          hasShooter: item.canShoot,
          color: item.color
        });
      }
    }

    const now = Date.now();

    clusters.forEach((c) => {
      CTX.save();

      // Urgency & pulse based on distance and elapsed time
      const urgency = Math.max(0.45, Math.min(1.0, 1.2 - (c.dist - 300) / 1800));
      const pulseSpeed = c.isBoss ? 0.014 : (c.hasShooter ? 0.011 : 0.008);
      const pulse = 1 + Math.sin(now * pulseSpeed + c.angle * 2) * 0.16;

      const baseColor = c.isBoss ? '#ef4444' : (c.hasShooter ? '#f97316' : '#f43f5e');
      const glowColor = c.isBoss ? 'rgba(239, 68, 68, 0.9)' : (c.hasShooter ? 'rgba(249, 115, 22, 0.85)' : 'rgba(244, 63, 94, 0.85)');

      CTX.globalAlpha = urgency;

      // Close threat ping ripple effect
      if (c.dist < 800) {
        const pingT = (now % 1200) / 1200;
        const pingR = 10 + pingT * 26;
        const pingAlpha = (1 - pingT) * 0.65;
        CTX.strokeStyle = baseColor;
        CTX.lineWidth = 2;
        CTX.globalAlpha = urgency * pingAlpha;
        CTX.beginPath();
        CTX.arc(c.x, c.y, pingR, 0, Math.PI * 2);
        CTX.stroke();
        CTX.globalAlpha = urgency;
      }

      // 1. Draw Directional Tactical Chevron Arrow
      CTX.save();
      CTX.translate(c.x, c.y);
      CTX.rotate(c.angle);
      CTX.scale(pulse, pulse);

      // Glowing shadow
      CTX.shadowColor = glowColor;
      CTX.shadowBlur = c.isBoss ? 20 : 12;

      // Outer Chevron
      CTX.fillStyle = baseColor;
      CTX.beginPath();
      const arrowLen = c.isBoss ? 24 : 18;
      const arrowWidth = c.isBoss ? 16 : 12;
      const innerNotch = c.isBoss ? 8 : 6;

      CTX.moveTo(arrowLen, 0);
      CTX.lineTo(-arrowLen * 0.6, -arrowWidth);
      CTX.lineTo(-arrowLen * 0.6 + innerNotch, 0);
      CTX.lineTo(-arrowLen * 0.6, arrowWidth);
      CTX.closePath();
      CTX.fill();

      // Inner bright accent stripe
      CTX.strokeStyle = '#ffffff';
      CTX.lineWidth = 2.5;
      CTX.lineCap = 'round';
      CTX.beginPath();
      CTX.moveTo(arrowLen * 0.6, 0);
      CTX.lineTo(-arrowLen * 0.35, -arrowWidth * 0.55);
      CTX.moveTo(arrowLen * 0.6, 0);
      CTX.lineTo(-arrowLen * 0.35, arrowWidth * 0.55);
      CTX.stroke();

      CTX.restore();

      // 2. Upright Threat Badge (Multiplier count, Shooter, Boss, or Distance)
      const inwardDist = c.isBoss ? 42 : 36;
      const bx = c.x - Math.cos(c.angle) * inwardDist;
      const by = c.y - Math.sin(c.angle) * inwardDist;

      CTX.save();
      CTX.translate(bx, by);

      let badgeText = '';
      if (c.isBoss) {
        badgeText = '💀 BOSS';
      } else if (c.count > 1) {
        badgeText = `×${c.count}`;
      } else if (c.hasShooter) {
        badgeText = '🎯 SHOOTER';
      } else {
        const approxMeters = Math.round(c.dist / 10);
        badgeText = `${approxMeters}m`;
      }

      CTX.font = `800 ${c.isBoss ? 17 : 14}px Rajdhani, sans-serif`;
      const textMetrics = CTX.measureText(badgeText);
      const pillW = textMetrics.width + 14;
      const pillH = c.isBoss ? 24 : 19;

      // Pill capsule background
      CTX.fillStyle = 'rgba(15, 23, 42, 0.92)';
      CTX.strokeStyle = baseColor;
      CTX.lineWidth = 1.5;
      CTX.shadowColor = glowColor;
      CTX.shadowBlur = 8;

      CTX.beginPath();
      if (CTX.roundRect) {
        CTX.roundRect(-pillW / 2, -pillH / 2, pillW, pillH, 6);
      } else {
        CTX.rect(-pillW / 2, -pillH / 2, pillW, pillH);
      }
      CTX.fill();
      CTX.stroke();

      // Badge text
      CTX.fillStyle = c.isBoss ? '#fecaca' : '#ffffff';
      CTX.textAlign = 'center';
      CTX.textBaseline = 'middle';
      CTX.shadowBlur = 0;
      CTX.fillText(badgeText, 0, 1);

      CTX.restore();

      CTX.restore();
    });
  }

  // --- OFF-SCREEN DROPS (GUNS & ABILITIES) THREAT & LOOT INDICATOR ---
  function drawOffscreenDropIndicators() {
    if (gameState !== 'PLAYING' || player.dead || drops.length === 0) return;

    const boxMinX = 50;
    const boxMaxX = V_WIDTH - 50;
    const boxMinY = 175;
    const boxMaxY = V_HEIGHT - 175;

    const screenPx = player.x - camera.x;
    const screenPy = player.y - camera.y;
    const px = Math.max(boxMinX + 15, Math.min(boxMaxX - 15, screenPx));
    const py = Math.max(boxMinY + 15, Math.min(boxMaxY - 15, screenPy));

    const now = Date.now();

    for (let i = 0; i < drops.length; i++) {
      const d = drops[i];
      if (d.life <= 0) continue;

      // Check if drop is inside screen viewport
      const onScreen = (
        d.x >= camera.x + 20 &&
        d.x <= camera.x + V_WIDTH - 20 &&
        d.y >= camera.y + 20 &&
        d.y <= camera.y + V_HEIGHT - 20
      );
      if (onScreen) continue;

      const vx = d.x - player.x;
      const vy = d.y - player.y;
      const dist = Math.hypot(vx, vy);
      if (dist > 4500 || dist < 1) continue;

      let tMin = Infinity;
      if (vx > 0) {
        const t = (boxMaxX - px) / vx;
        if (t > 0 && t < tMin) tMin = t;
      } else if (vx < 0) {
        const t = (boxMinX - px) / vx;
        if (t > 0 && t < tMin) tMin = t;
      }

      if (vy > 0) {
        const t = (boxMaxY - py) / vy;
        if (t > 0 && t < tMin) tMin = t;
      } else if (vy < 0) {
        const t = (boxMinY - py) / vy;
        if (t > 0 && t < tMin) tMin = t;
      }

      if (!isFinite(tMin) || tMin <= 0) continue;

      const edgeX = Math.max(boxMinX, Math.min(boxMaxX, px + vx * tMin));
      const edgeY = Math.max(boxMinY, Math.min(boxMaxY, py + vy * tMin));
      const angle = Math.atan2(vy, vx);

      let icon = '⭐';
      let title = 'LOOT';
      let color = '#facc15';

      if (d.type === 'WEAPON') {
        icon = '🔫';
        title = WEAPONS[d.weaponId]?.name || 'NEW GUN';
        color = '#facc15';
      } else {
        const pInfo = POWERUP_TYPES[d.type] || d.info || {};
        icon = pInfo.icon || '⭐';
        title = pInfo.name || d.type;
        color = pInfo.color || '#38bdf8';
      }

      const approxMeters = Math.round(dist / 10);
      const badgeText = `${icon} ${title} [${approxMeters}m]`;

      CTX.save();

      const pulse = 1 + Math.sin(now * 0.009 + angle * 2) * 0.15;

      // When newly spawned (e.g. within first 3 seconds), draw beacon ring
      const maxL = d.type === 'WEAPON' ? 2400 : 900;
      if (d.life > maxL - 180) {
        const pingT = (now % 1000) / 1000;
        const pingR = 12 + pingT * 28;
        const pingAlpha = (1 - pingT) * 0.85;
        CTX.strokeStyle = color;
        CTX.lineWidth = 2.5;
        CTX.globalAlpha = pingAlpha;
        CTX.beginPath();
        CTX.arc(edgeX, edgeY, pingR, 0, Math.PI * 2);
        CTX.stroke();
        CTX.globalAlpha = 1.0;
      }

      // Pointer Chevron / Diamond
      CTX.save();
      CTX.translate(edgeX, edgeY);
      CTX.rotate(angle);
      CTX.scale(pulse, pulse);

      CTX.shadowColor = color;
      CTX.shadowBlur = 16;
      CTX.fillStyle = color;

      CTX.beginPath();
      CTX.moveTo(18, 0);
      CTX.lineTo(-8, -11);
      CTX.lineTo(-3, 0);
      CTX.lineTo(-8, 11);
      CTX.closePath();
      CTX.fill();

      CTX.strokeStyle = '#ffffff';
      CTX.lineWidth = 2;
      CTX.stroke();

      CTX.restore();

      // Upright Badge
      const inwardDist = 38;
      const bx = edgeX - Math.cos(angle) * inwardDist;
      const by = edgeY - Math.sin(angle) * inwardDist;

      CTX.save();
      CTX.translate(bx, by);

      CTX.font = '800 13px Rajdhani, sans-serif';
      const textMetrics = CTX.measureText(badgeText);
      const pillW = textMetrics.width + 14;
      const pillH = 20;

      CTX.fillStyle = 'rgba(15, 23, 42, 0.94)';
      CTX.strokeStyle = color;
      CTX.lineWidth = 1.5;
      CTX.shadowColor = color;
      CTX.shadowBlur = 10;

      CTX.beginPath();
      if (CTX.roundRect) {
        CTX.roundRect(-pillW / 2, -pillH / 2, pillW, pillH, 6);
      } else {
        CTX.rect(-pillW / 2, -pillH / 2, pillW, pillH);
      }
      CTX.fill();
      CTX.stroke();

      CTX.fillStyle = '#ffffff';
      CTX.textAlign = 'center';
      CTX.textBaseline = 'middle';
      CTX.shadowBlur = 0;
      CTX.fillText(badgeText, 0, 1);

      CTX.restore();

      CTX.restore();
    }
  }

  // --- QUANTUM GROUND PORTAL & TIME WARP RENDERING ---
  function drawQuantumPortal() {
    return; // No funnel/portal rendered
  }

  function drawTimeWarpTunnel() {
    return; // No time tunnel rendered
  }

  // --- RENDER PIPELINE ---
  function render() {
    CTX.save();

    // Screen Shake
    if (screenShake > 0) {
      const shakeX = (Math.random() - 0.5) * screenShake * 4;
      const shakeY = (Math.random() - 0.5) * screenShake * 4;
      CTX.translate(shakeX, shakeY);
    }

    // Atmospheric Battlefield Ground (Warm apocalyptic rose/crimson radial gradient matching demo_ui.png)
    const bgGrad = CTX.createRadialGradient(
      V_WIDTH / 2,
      V_HEIGHT / 2,
      100,
      V_WIDTH / 2,
      V_HEIGHT / 2,
      V_HEIGHT * 0.72
    );
    bgGrad.addColorStop(0, '#865b6c');
    bgGrad.addColorStop(0.55, '#684555');
    bgGrad.addColorStop(1, '#472d3b');
    CTX.fillStyle = bgGrad;
    CTX.fillRect(0, 0, V_WIDTH, V_HEIGHT);

    // WORLD SPACE RENDERING (Translated by Camera)
    CTX.save();
    CTX.translate(-camera.x, -camera.y);

    // Ancient Defense Runes scattered across the infinite world
    const runeSpacing = 1600;
    const minRuneX = Math.floor((camera.x - 200) / runeSpacing) * runeSpacing;
    const maxRuneX = Math.ceil((camera.x + V_WIDTH + 200) / runeSpacing) * runeSpacing;
    const minRuneY = Math.floor((camera.y - 200) / runeSpacing) * runeSpacing;
    const maxRuneY = Math.ceil((camera.y + V_HEIGHT + 200) / runeSpacing) * runeSpacing;

    if (IMAGES['defense_ring']) {
      for (let rx = minRuneX; rx <= maxRuneX; rx += runeSpacing) {
        for (let ry = minRuneY; ry <= maxRuneY; ry += runeSpacing) {
          CTX.save();
          CTX.globalAlpha = 0.22 + Math.sin(Date.now() * 0.002 + rx) * 0.06;
          const rSize = 560;
          CTX.drawImage(IMAGES['defense_ring'], rx - rSize / 2, ry - rSize / 2, rSize, rSize);
          CTX.restore();
        }
      }
    }

    // Visible Chunks Bounds for Props
    const minPropChunkX = Math.floor((camera.x - 180) / PROP_CHUNK_SIZE);
    const maxPropChunkX = Math.floor((camera.x + V_WIDTH + 180) / PROP_CHUNK_SIZE);
    const minPropChunkY = Math.floor((camera.y - 180) / PROP_CHUNK_SIZE);
    const maxPropChunkY = Math.floor((camera.y + V_HEIGHT + 180) / PROP_CHUNK_SIZE);

    // Render Ground Water Puddles (drawn on ground)
    for (let cx = minPropChunkX; cx <= maxPropChunkX; cx++) {
      for (let cy = minPropChunkY; cy <= maxPropChunkY; cy++) {
        const cProps = getPropsForChunk(cx, cy);
        for (let i = 0; i < cProps.length; i++) {
          const pr = cProps[i];
          if (!pr.isPuddle) continue;
          const img = IMAGES[pr.key];
          if (!img) continue;
          CTX.save();
          CTX.translate(pr.x, pr.y);
          if (pr.flipH) CTX.scale(-1, 1);
          CTX.rotate(pr.rot);
          CTX.globalAlpha = 0.75;
          const pw = img.width * pr.scale;
          const ph = img.height * pr.scale;
          CTX.drawImage(img, -pw / 2, -ph / 2, pw, ph);
          CTX.restore();
        }
      }
    }

    // Ground Decals / Splatter
    groundDecals.forEach((gd) => {
      CTX.save();
      CTX.globalAlpha = gd.alpha;
      CTX.fillStyle = gd.color;
      CTX.beginPath();
      CTX.arc(gd.x, gd.y, gd.radius, 0, Math.PI * 2);
      CTX.fill();
      CTX.restore();
    });

    // Quantum Ground Subterranean Portal / Time Rift
    drawQuantumPortal();

    // Environment Prop Shadows (Rocks, Barricades, Clusters)
    for (let cx = minPropChunkX; cx <= maxPropChunkX; cx++) {
      for (let cy = minPropChunkY; cy <= maxPropChunkY; cy++) {
        const cProps = getPropsForChunk(cx, cy);
        for (let i = 0; i < cProps.length; i++) {
          const pr = cProps[i];
          if (pr.isPuddle || pr.shadowRadius <= 0) continue;
          drawShadow(pr.x, pr.y + pr.shadowY, pr.shadowRadius);
        }
      }
    }

    // Shadows
    enemies.forEach((e) => {
      drawShadow(e.x, e.y + e.radius * 0.85, e.radius * 1.3);
    });
    if (waveState !== 'TIME_WARP') {
      drawShadow(player.x, player.y + 26, 42);
    }

    // Environment Props (Rocks, Metal Barricades, Clusters)
    for (let cx = minPropChunkX; cx <= maxPropChunkX; cx++) {
      for (let cy = minPropChunkY; cy <= maxPropChunkY; cy++) {
        const cProps = getPropsForChunk(cx, cy);
        for (let i = 0; i < cProps.length; i++) {
          const pr = cProps[i];
          if (pr.isPuddle) continue;
          const img = IMAGES[pr.key];
          if (!img) continue;
          CTX.save();
          CTX.translate(pr.x, pr.y);
          if (pr.flipH) CTX.scale(-1, 1);
          CTX.rotate(pr.rot);
          const pw = img.width * pr.scale;
          const ph = img.height * pr.scale;
          CTX.drawImage(img, -pw / 2, -ph / 2, pw, ph);
          CTX.restore();
        }
      }
    }

    // Speed Ghost Trails
    playerGhostTrails.forEach((tr) => {
      CTX.save();
      CTX.globalAlpha = tr.alpha * 0.4;
      CTX.filter = 'brightness(2.0) drop-shadow(0 0 10px #38bdf8)';
      drawSpriteFrame('player_walk', tr.frame, tr.x, tr.y, tr.facingLeft, 0.65);
      CTX.restore();
    });

    // Collectible Drops
    drops.forEach((d) => {
      const bob = Math.sin(d.bounceTick * 2.2) * 8;
      CTX.save();

      if (d.type === 'WEAPON') {
        const wp = WEAPONS[d.weaponId];
        const img = IMAGES[wp ? wp.key : ''];

        // Drop Shadow
        drawShadow(d.x, d.y + 22, 34);

        // Golden beacon aura
        const auraRadius = 38 + Math.sin(d.bounceTick * 3) * 5;
        const grad = CTX.createRadialGradient(d.x, d.y + bob, 4, d.x, d.y + bob, auraRadius);
        grad.addColorStop(0, 'rgba(250, 204, 21, 0.85)');
        grad.addColorStop(0.5, 'rgba(251, 146, 60, 0.4)');
        grad.addColorStop(1, 'rgba(250, 204, 21, 0)');
        CTX.fillStyle = grad;
        CTX.beginPath();
        CTX.arc(d.x, d.y + bob, auraRadius, 0, Math.PI * 2);
        CTX.fill();

        // Outer rotating halo ring
        CTX.strokeStyle = '#facc15';
        CTX.lineWidth = 2.5;
        CTX.shadowColor = '#facc15';
        CTX.shadowBlur = 14;
        CTX.beginPath();
        CTX.ellipse(d.x, d.y + bob, 34, 16, d.bounceTick * 1.5, 0, Math.PI * 2);
        CTX.stroke();

        // 3D Spinning Weapon Sprite
        if (img) {
          CTX.save();
          CTX.translate(d.x, d.y + bob);
          const spinScaleX = Math.cos(d.bounceTick * 2.2) * 0.75;
          CTX.scale(spinScaleX, 0.75);
          CTX.shadowColor = '#facc15';
          CTX.shadowBlur = 16;
          CTX.drawImage(img, -img.width / 2, -img.height / 2);
          CTX.restore();
        }

        // Floating name tag badge
        if (wp) {
          CTX.font = '800 18px Rajdhani, sans-serif';
          CTX.textAlign = 'center';
          CTX.fillStyle = '#fef08a';
          CTX.shadowColor = '#000000';
          CTX.shadowBlur = 8;
          CTX.fillText(`⭐ ${wp.name} ⭐`, d.x, d.y + bob - 36);
        }

        // Sparkles rising
        if (Math.random() < 0.15) {
          particles.push({
            x: d.x + (Math.random() - 0.5) * 36,
            y: d.y + bob + (Math.random() - 0.5) * 12,
            vx: (Math.random() - 0.5) * 1,
            vy: -1.2 - Math.random() * 1.5,
            color: '#facc15',
            size: Math.random() * 4 + 2,
            alpha: 1.0,
            decay: 0.04,
          });
        }
      } else {
        // Drop Shadow
        drawShadow(d.x, d.y + 18, 22);

        // Glowing aura
        const pColor = (d.info && d.info.color) || (POWERUP_TYPES[d.type] && POWERUP_TYPES[d.type].color) || '#38bdf8';
        const pIcon = (d.info && d.info.icon) || (POWERUP_TYPES[d.type] && POWERUP_TYPES[d.type].icon) || '⭐';
        CTX.fillStyle = pColor;
        CTX.shadowColor = pColor;
        CTX.shadowBlur = 18;
        CTX.beginPath();
        CTX.arc(d.x, d.y + bob, 26, 0, Math.PI * 2);
        CTX.fill();

        // Border ring
        CTX.strokeStyle = '#ffffff';
        CTX.lineWidth = 3;
        CTX.stroke();

        // Icon
        CTX.font = '24px Rajdhani, sans-serif';
        CTX.textAlign = 'center';
        CTX.textBaseline = 'middle';
        CTX.fillText(pIcon, d.x, d.y + bob);
      }

      CTX.restore();
    });

    // Enemies Rendering
    enemies.forEach((e) => {
      drawShadow(e.x, e.y + e.radius * 0.7, e.radius * 1.05);
      drawEnemySprite(e);

      // Boss Overhead Crown & Title
      if (e.isWaveBoss && !e.isDying) {
        CTX.save();
        CTX.font = '800 20px Rajdhani, sans-serif';
        CTX.textAlign = 'center';
        CTX.fillStyle = '#ef4444';
        CTX.shadowColor = '#000000';
        CTX.shadowBlur = 8;
        CTX.fillText(`👑 ${e.bossName || 'BOSS'}`, e.x, e.y - e.radius - 28);
        CTX.restore();
      }

      // Health Bar if damaged and still alive
      if (!e.isDying && e.hp < e.maxHp) {
        const barW = Math.max(40, e.radius * 1.3);
        const barH = 6;
        const hpPct = Math.max(0, e.hp / e.maxHp);
        CTX.fillStyle = 'rgba(0,0,0,0.65)';
        CTX.fillRect(e.x - barW / 2, e.y - e.radius - 18, barW, barH);
        CTX.fillStyle = e.color;
        CTX.fillRect(e.x - barW / 2, e.y - e.radius - 18, barW * hpPct, barH);
      }
    });

    // Calculate player & clone cinematic scale & rotation for portal entry
    let pVisualScale = 0.65;
    let pVisualAlpha = 1.0;
    let pVisualRot = 0;
    let skipPlayerDraw = false;

    if (waveState === 'PORTAL_PULL' && portal.active) {
      const pDist = Math.hypot(portal.x - player.x, portal.y - player.y);
      if (pDist < portal.radius) {
        const ratio = Math.max(0.12, pDist / portal.radius);
        pVisualScale = 0.65 * ratio;
        pVisualAlpha = Math.max(0.2, ratio);
        pVisualRot = (1 - ratio) * Math.PI * 3.5;
      }
    } else if (waveState === 'TIME_WARP') {
      skipPlayerDraw = true;
    } else if (waveState === 'WAVE_ARRIVAL') {
      const arrivalProgress = Math.min(1, Math.max(0, 1 - (waveCinematicTimer / 0.85)));
      pVisualScale = 0.65 * (1 + (1 - arrivalProgress) * 0.5);
    }

    // Shadow Clones Rendering
    if (cloneSquad.count > 1 && !player.dead && !skipPlayerDraw) {
      cloneSquad.clones.forEach((c) => {
        let cVisualScale = 0.65;
        let cVisualAlpha = 1.0;
        let cVisualRot = 0;
        if (waveState === 'PORTAL_PULL' && portal.active) {
          const cDist = Math.hypot(portal.x - c.x, portal.y - c.y);
          if (cDist < portal.radius) {
            const ratio = Math.max(0.12, cDist / portal.radius);
            cVisualScale = 0.65 * ratio;
            cVisualAlpha = Math.max(0.2, ratio);
            cVisualRot = (1 - ratio) * Math.PI * 3.5;
          }
        }
        drawShadow(c.x, c.y + 26, 42 * (cVisualScale / 0.65));

        CTX.save();
        CTX.translate(c.x, c.y);
        if (cVisualRot !== 0) CTX.rotate(cVisualRot);
        if (activePowerups.VANISH > 0) {
          CTX.globalAlpha = (0.35 + Math.sin(Date.now() * 0.012) * 0.12) * cVisualAlpha;
          CTX.shadowColor = '#a78bfa';
          CTX.shadowBlur = 18;
        } else {
          CTX.globalAlpha = cVisualAlpha;
          CTX.shadowColor = '#c084fc';
          CTX.shadowBlur = 14;
        }
        drawSpriteFrame(`player_${c.animState}`, c.animFrame, 0, 0, c.facingLeft, cVisualScale);
        CTX.restore();

        if (cVisualScale > 0.3) {
          drawCloneWeapon(c, cVisualScale);
        }
      });
    }

    // Player Rendering
    if ((!player.dead || player.animState === 'death') && !skipPlayerDraw) {
      CTX.save();
      CTX.translate(player.x, player.y);
      if (pVisualRot !== 0) CTX.rotate(pVisualRot);
      if (activePowerups.VANISH > 0) {
        CTX.globalAlpha = (0.35 + Math.sin(Date.now() * 0.012) * 0.12) * pVisualAlpha;
        CTX.shadowColor = '#a78bfa';
        CTX.shadowBlur = 20;
      } else if (player.invincibleTimer > 0 && Math.floor(player.invincibleTimer / 4) % 2 === 0) {
        CTX.globalAlpha = 0.4 * pVisualAlpha;
      } else {
        CTX.globalAlpha = pVisualAlpha;
      }
      drawSpriteFrame(`player_${player.animState}`, player.animFrame, 0, 0, player.facingLeft, pVisualScale);
      CTX.restore();

      // Weapon
      if (!player.dead && pVisualScale > 0.3) {
        drawWeapon(pVisualScale);
      }

      // Energy Shield Bubble
      if (activePowerups.SHIELD && !player.dead && pVisualScale > 0.3) {
        CTX.save();
        CTX.strokeStyle = '#818cf8';
        CTX.shadowColor = '#818cf8';
        CTX.shadowBlur = 20;
        CTX.lineWidth = 4;
        CTX.beginPath();
        CTX.arc(player.x, player.y, (player.radius + 18) * (pVisualScale / 0.65), 0, Math.PI * 2);
        CTX.stroke();

        CTX.fillStyle = 'rgba(129, 140, 248, 0.16)';
        CTX.fill();
        CTX.restore();
      }
    }

    // Bullets (Sprite-based rendering with glow)
    bullets.forEach((b) => {
      CTX.save();
      CTX.translate(b.x, b.y);
      const bAngle = Math.atan2(b.vy, b.vx);
      CTX.rotate(bAngle);

      const spriteImg = IMAGES[b.sprite];
      if (spriteImg) {
        CTX.shadowColor = b.color;
        CTX.shadowBlur = 14;

        let bw = b.size * 3.4;
        let bh = b.size * 2.2;
        if (b.isSniper || b.sprite === 'bullet_laser') {
          bw = 64;
          bh = 18;
        } else if (b.isPlasma || b.sprite === 'bullet_plasma') {
          bw = 38;
          bh = 30;
        } else if (b.isExplosive || b.sprite === 'bullet_rocket') {
          bw = 46;
          bh = 22;
        } else if (b.sprite === 'bullet_dart_gold' || b.sprite === 'bullet_heavy_dart') {
          bw = 36;
          bh = 16;
        } else if (b.sprite === 'bullet_orb_red' || b.sprite === 'bullet_pellet_gold') {
          bw = b.size * 2.5;
          bh = b.size * 2.5;
        }
        CTX.drawImage(spriteImg, -bw / 2, -bh / 2, bw, bh);
      } else {
        CTX.fillStyle = b.color;
        CTX.shadowColor = b.color;
        CTX.shadowBlur = 12;
        CTX.beginPath();
        CTX.arc(0, 0, b.size, 0, Math.PI * 2);
        CTX.fill();
      }
      CTX.restore();
    });

    // Enemy Projectiles Rendering
    enemyBullets.forEach((eb) => {
      CTX.save();
      CTX.shadowColor = '#ef4444';
      CTX.shadowBlur = 12;
      CTX.fillStyle = '#ef4444';
      CTX.beginPath();
      CTX.arc(eb.x, eb.y, eb.radius, 0, Math.PI * 2);
      CTX.fill();

      // Hot bright core
      CTX.fillStyle = '#fef08a';
      CTX.beginPath();
      CTX.arc(eb.x, eb.y, eb.radius * 0.45, 0, Math.PI * 2);
      CTX.fill();
      CTX.restore();
    });

    // Shockwaves (Expanding rings)
    shockwaves.forEach((sw) => {
      CTX.save();
      CTX.globalAlpha = Math.max(0, sw.alpha);
      CTX.strokeStyle = sw.color;
      CTX.shadowColor = sw.color;
      CTX.shadowBlur = 16;
      CTX.lineWidth = sw.lineWidth;
      CTX.beginPath();
      CTX.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
      CTX.stroke();
      CTX.restore();
    });

    // Particles & Smoke
    particles.forEach((p) => {
      CTX.save();
      CTX.globalAlpha = Math.max(0, p.alpha);
      if (p.isSmoke && IMAGES['smoke']) {
        CTX.translate(p.x, p.y);
        CTX.rotate(p.rotation);
        CTX.drawImage(IMAGES['smoke'], -p.size / 2, -p.size / 2, p.size, p.size);
      } else {
        CTX.fillStyle = p.color;
        CTX.shadowColor = p.color;
        CTX.shadowBlur = 6;
        CTX.beginPath();
        CTX.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        CTX.fill();
      }
      CTX.restore();
    });

    // Floating Text (World Space)
    floatTexts.forEach((ft) => {
      CTX.save();
      CTX.font = `800 ${ft.fontSize}px Rajdhani, sans-serif`;
      CTX.fillStyle = ft.color;
      CTX.globalAlpha = Math.max(0, ft.alpha);
      CTX.textAlign = 'center';
      CTX.shadowColor = '#000000';
      CTX.shadowBlur = 8;
      CTX.fillText(ft.text, ft.x, ft.y);
      CTX.restore();
    });

    // Smart Target Lock Reticle on nearest enemy (World Space)
    if (lockedEnemy && lockedEnemy.hp > 0 && !lockedEnemy.isDying && isEnemyOnScreen(lockedEnemy, 0) && (autoFireEnabled || aimControl.active || mouse.down)) {
      CTX.save();
      CTX.translate(lockedEnemy.x, lockedEnemy.y);
      CTX.rotate(lockReticleTick);

      const rSize = lockedEnemy.radius + 18;
      const cornerLen = 14;

      CTX.strokeStyle = '#4ade80';
      CTX.lineWidth = 3;
      CTX.shadowColor = '#4ade80';
      CTX.shadowBlur = 12;

      // 4 Corner Brackets
      CTX.beginPath();
      // Top-Left
      CTX.moveTo(-rSize, -rSize + cornerLen);
      CTX.lineTo(-rSize, -rSize);
      CTX.lineTo(-rSize + cornerLen, -rSize);
      // Top-Right
      CTX.moveTo(rSize - cornerLen, -rSize);
      CTX.lineTo(rSize, -rSize);
      CTX.lineTo(rSize, -rSize + cornerLen);
      // Bottom-Right
      CTX.moveTo(rSize, rSize - cornerLen);
      CTX.lineTo(rSize, rSize);
      CTX.lineTo(rSize - cornerLen, rSize);
      // Bottom-Left
      CTX.moveTo(-rSize + cornerLen, rSize);
      CTX.lineTo(-rSize, rSize);
      CTX.lineTo(-rSize, rSize - cornerLen);
      CTX.stroke();

      // Center lock diamond/dot
      CTX.fillStyle = 'rgba(74, 222, 128, 0.7)';
      CTX.beginPath();
      CTX.arc(0, 0, 4, 0, Math.PI * 2);
      CTX.fill();

      CTX.restore();
    }

    CTX.restore(); // End of World Space

    // SCREEN SPACE RENDERING (Fixed on Screen)

    // Subterranean Hyperspace Time-Warp Tunnel (Wave Transition)
    drawTimeWarpTunnel();

    // Damage Red Screen Vignette
    if (player.invincibleTimer > 0) {
      CTX.save();
      const dmgAlpha = (player.invincibleTimer / 90) * 0.45;
      const grad = CTX.createRadialGradient(
        V_WIDTH / 2,
        V_HEIGHT / 2,
        V_WIDTH * 0.25,
        V_WIDTH / 2,
        V_HEIGHT / 2,
        V_WIDTH * 0.75
      );
      grad.addColorStop(0, 'rgba(239, 68, 68, 0)');
      grad.addColorStop(1, `rgba(239, 68, 68, ${dmgAlpha})`);
      CTX.fillStyle = grad;
      CTX.fillRect(0, 0, V_WIDTH, V_HEIGHT);
      CTX.restore();
    }

    // Dynamic Movement Joystick (Left Thumb)
    if (joystick.active) {
      CTX.save();
      const ox = joystick.originX;
      const oy = joystick.originY;
      const maxR = joystick.maxRadius;
      const kDist = Math.min(joystick.distance, maxR);
      const kx = ox + (joystick.distance > 0 ? Math.cos(joystick.angle) * kDist : 0);
      const ky = oy + (joystick.distance > 0 ? Math.sin(joystick.angle) * kDist : 0);

      // Outer glowing base ring
      CTX.strokeStyle = 'rgba(56, 189, 248, 0.5)';
      CTX.lineWidth = 4;
      CTX.beginPath();
      CTX.arc(ox, oy, maxR, 0, Math.PI * 2);
      CTX.stroke();

      // Inner faint grid / guide circle
      CTX.fillStyle = 'rgba(15, 23, 42, 0.45)';
      CTX.beginPath();
      CTX.arc(ox, oy, maxR, 0, Math.PI * 2);
      CTX.fill();

      // 4 Cardinal Direction notches
      CTX.strokeStyle = 'rgba(56, 189, 248, 0.7)';
      CTX.lineWidth = 3;
      [0, Math.PI / 2, Math.PI, (Math.PI * 3) / 2].forEach((a) => {
        CTX.beginPath();
        CTX.moveTo(ox + Math.cos(a) * (maxR - 10), oy + Math.sin(a) * (maxR - 10));
        CTX.lineTo(ox + Math.cos(a) * (maxR + 4), oy + Math.sin(a) * (maxR + 4));
        CTX.stroke();
      });

      // Direction stick line
      if (kDist > 6) {
        CTX.strokeStyle = 'rgba(56, 189, 248, 0.8)';
        CTX.lineWidth = 6;
        CTX.lineCap = 'round';
        CTX.beginPath();
        CTX.moveTo(ox, oy);
        CTX.lineTo(kx, ky);
        CTX.stroke();
      }

      // Moving thumb knob
      CTX.fillStyle = 'rgba(56, 189, 248, 0.88)';
      CTX.shadowColor = '#38bdf8';
      CTX.shadowBlur = 18;
      CTX.beginPath();
      CTX.arc(kx, ky, 34, 0, Math.PI * 2);
      CTX.fill();

      // Inner knob core
      CTX.fillStyle = '#ffffff';
      CTX.beginPath();
      CTX.arc(kx, ky, 12, 0, Math.PI * 2);
      CTX.fill();

      CTX.restore();
    } else if (gameState === 'PLAYING') {
      // Idle joystick hint watermark in bottom-left
      CTX.save();
      const hintX = 220;
      const hintY = V_HEIGHT - 360;
      CTX.globalAlpha = 0.2;
      CTX.strokeStyle = '#38bdf8';
      CTX.lineWidth = 3;
      CTX.beginPath();
      CTX.arc(hintX, hintY, 70, 0, Math.PI * 2);
      CTX.stroke();

      CTX.fillStyle = '#38bdf8';
      CTX.beginPath();
      CTX.arc(hintX, hintY, 24, 0, Math.PI * 2);
      CTX.fill();

      CTX.font = '700 22px Rajdhani, sans-serif';
      CTX.textAlign = 'center';
      CTX.fillText('MOVE', hintX, hintY + 110);
      CTX.restore();
    }

    // Manual Aim Laser Beam (when dragging right stick)
    if (aimControl.isDragging) {
      CTX.save();
      const screenPx = player.x - camera.x;
      const screenPy = player.y - camera.y;
      const laserLen = 800;
      const lx = screenPx + Math.cos(aimControl.angle) * laserLen;
      const ly = screenPy + Math.sin(aimControl.angle) * laserLen;

      CTX.strokeStyle = 'rgba(239, 68, 68, 0.75)';
      CTX.lineWidth = 3;
      CTX.setLineDash([14, 8]);
      CTX.shadowColor = '#ef4444';
      CTX.shadowBlur = 12;
      CTX.beginPath();
      CTX.moveTo(screenPx, screenPy);
      CTX.lineTo(lx, ly);
      CTX.stroke();

      CTX.restore();
    }

    // Tactical Crosshair (follows aim / mouse)
    if (IMAGES['crosshair'] && (mouse.down || aimControl.isDragging || mouse.isDesktopDown)) {
      CTX.save();
      CTX.drawImage(IMAGES['crosshair'], mouse.x - 28, mouse.y - 28, 56, 56);
      CTX.restore();
    }

    // Wave Banner Notification
    if (waveBanner.timer > 0 && waveState !== 'TIME_WARP') {
      CTX.save();
      const alpha = Math.min(1, waveBanner.timer / 30);
      CTX.globalAlpha = alpha;
      CTX.font = '800 48px Rajdhani, sans-serif';
      CTX.fillStyle = '#ffedd5';
      CTX.shadowColor = '#f59e0b';
      CTX.shadowBlur = 22;
      CTX.textAlign = 'center';
      CTX.fillText(waveBanner.text, V_WIDTH / 2, V_HEIGHT * 0.26);
      CTX.restore();
    }

    // Cinematic Wave Boss Health Bar (Screen Space)
    if (waveState === 'BOSS_FIGHT' && waveBoss && waveBoss.hp > 0 && !waveBoss.isDying) {
      CTX.save();
      const barW = 560;
      const barH = 22;
      const bx = (V_WIDTH - barW) / 2;
      const by = 138;
      const hpPct = Math.max(0, Math.min(1, waveBoss.hp / waveBoss.maxHp));

      // Outer Container Box
      CTX.fillStyle = 'rgba(15, 23, 42, 0.90)';
      CTX.strokeStyle = '#ef4444';
      CTX.lineWidth = 2;
      CTX.shadowColor = '#ef4444';
      CTX.shadowBlur = 16;

      if (CTX.roundRect) {
        CTX.beginPath();
        CTX.roundRect(bx - 14, by - 26, barW + 28, barH + 34, 10);
        CTX.fill();
        CTX.stroke();
      } else {
        CTX.fillRect(bx - 14, by - 26, barW + 28, barH + 34);
        CTX.strokeRect(bx - 14, by - 26, barW + 28, barH + 34);
      }

      // Boss Title
      CTX.shadowBlur = 0;
      CTX.font = '800 16px Rajdhani, sans-serif';
      CTX.fillStyle = '#fca5a5';
      CTX.textAlign = 'left';
      CTX.fillText(`💀 ${waveBoss.bossName} (WAVE ${wave})`, bx, by - 8);

      // HP Percentage
      CTX.font = '800 16px Rajdhani, monospace, sans-serif';
      CTX.fillStyle = '#ffffff';
      CTX.textAlign = 'right';
      CTX.fillText(`${Math.round(hpPct * 100)}%`, bx + barW, by - 8);

      // Background Track
      CTX.fillStyle = 'rgba(255, 255, 255, 0.12)';
      CTX.fillRect(bx, by, barW, barH);

      // Health Gradient Fill
      const grad = CTX.createLinearGradient(bx, by, bx + barW, by);
      grad.addColorStop(0, '#dc2626');
      grad.addColorStop(0.5, '#ef4444');
      grad.addColorStop(1, '#f97316');
      CTX.fillStyle = grad;
      CTX.fillRect(bx, by, barW * hpPct, barH);

      CTX.restore();
    }

    // Off-Screen Incoming Threat Indicators (Enemies)
    drawOffscreenIndicators();

    // Off-Screen Loot Indicators (Weapons & Abilities)
    drawOffscreenDropIndicators();

    CTX.restore();
  }

  // --- SPRITE HELPERS ---
  function drawShadow(x, y, radius) {
    if (IMAGES['shadow']) {
      CTX.save();
      CTX.globalAlpha = 0.45;
      CTX.drawImage(IMAGES['shadow'], x - radius, y - radius * 0.4, radius * 2, radius * 0.8);
      CTX.restore();
    }
  }

  function drawSpriteFrame(sheetKey, frameIdx, x, y, flipH = false, scale = 0.65) {
    const img = IMAGES[sheetKey];
    if (!img) return;

    const frameSize = MANIFEST.frameSizes[sheetKey] || { width: 128, height: 145 };
    const fw = frameSize.width;
    const fh = frameSize.height;
    const sx = frameIdx * fw;
    const dw = fw * scale;
    const dh = fh * scale;

    CTX.save();
    CTX.translate(x, y);
    if (flipH) CTX.scale(-1, 1);
    CTX.drawImage(img, sx, 0, fw, fh, -dw / 2, -dh / 2, dw, dh);
    CTX.restore();
  }

  function drawEnemySprite(e) {
    const anims = ENEMY_ANIMATIONS[e.typeId];
    if (!anims) return;

    let state = e.animState || 'move';
    let frameList = anims[state];
    if (!frameList || frameList.length === 0) {
      frameList = anims.move || anims.idle;
    }
    if (!frameList || frameList.length === 0) return;

    const frameIdx = Math.min(e.animFrame, frameList.length - 1);
    const img = frameList[frameIdx];
    if (!img || !img.complete) return;

    const baseSize = 500;
    const dw = baseSize * e.scale;
    const dh = baseSize * e.scale;

    CTX.save();
    CTX.translate(e.x, e.y);

    if (e.facingLeft) {
      CTX.scale(-1, 1);
    }

    if (e.hitTimer > 0 && e.animState !== 'death') {
      CTX.filter = 'brightness(2.2)';
    }

    if (e.animState === 'death') {
      const fadeStart = Math.floor(frameList.length * 0.65);
      if (frameIdx >= fadeStart) {
        const fadeProg = (frameIdx - fadeStart) / (frameList.length - fadeStart);
        CTX.globalAlpha = Math.max(0.1, 1 - fadeProg);
      }
    }

    CTX.drawImage(img, -dw / 2, -dh / 2, dw, dh);
    CTX.restore();
  }

  function spawnEnemyBullet(e) {
    const dx = player.x - e.x;
    const dy = player.y - e.y;
    const dist = Math.hypot(dx, dy) || 1;
    const baseAngle = Math.atan2(dy, dx);
    const speed = e.isWaveBoss ? 8.5 : 7.5;

    const angles = [];
    if (e.isWaveBoss) {
      if (wave >= 3) {
        angles.push(baseAngle - 0.36, baseAngle - 0.18, baseAngle, baseAngle + 0.18, baseAngle + 0.36);
      } else {
        angles.push(baseAngle - 0.22, baseAngle, baseAngle + 0.22);
      }
    } else {
      angles.push(baseAngle);
    }

    angles.forEach((ang) => {
      const vx = Math.cos(ang) * speed;
      const vy = Math.sin(ang) * speed;
      enemyBullets.push({
        x: e.x + Math.cos(ang) * (e.radius + 14),
        y: e.y + Math.sin(ang) * (e.radius + 14),
        vx,
        vy,
        color: e.isWaveBoss ? '#ef4444' : (e.color || '#ef4444'),
        radius: e.isWaveBoss ? 11 : 8,
        damage: 1,
        life: 200,
      });
    });

    createSparks(e.x + Math.cos(baseAngle) * e.radius, e.y + Math.sin(baseAngle) * e.radius, e.isWaveBoss ? 12 : 6, '#ef4444');
    SOUNDS.playPistol();
  }

  function drawWeapon(scale = 0.6) {
    const wp = WEAPONS[currentWeaponId];
    if (!wp) return;
    const img = IMAGES[wp.key];
    if (!img) return;

    const worldAimX = mouse.x + camera.x;
    const worldAimY = mouse.y + camera.y;
    const dx = worldAimX - player.x;
    const dy = worldAimY - player.y;
    const angle = Math.atan2(dy, dx);
    const flipV = dx < 0;

    CTX.save();
    CTX.translate(player.x, player.y + 6 * (scale / 0.6));
    CTX.rotate(angle);
    if (flipV) CTX.scale(1, -1);
    if (activePowerups.VANISH > 0) {
      CTX.globalAlpha = 0.45;
      CTX.shadowColor = '#a78bfa';
      CTX.shadowBlur = 14;
    }

    const dw = img.width * scale;
    const dh = img.height * scale;

    CTX.drawImage(img, 12 * (scale / 0.6), -dh / 2, dw, dh);

    if (player.muzzleFlash && IMAGES['muzzle_flash']) {
      CTX.save();
      CTX.drawImage(IMAGES['muzzle_flash'], (12 + dw - 10) * (scale / 0.6), (-dh / 2 - 10) * (scale / 0.6), 44 * (scale / 0.6), 32 * (scale / 0.6));
      CTX.restore();
    }

    CTX.restore();
  }

  function drawCloneWeapon(clone, scale = 0.6) {
    const wp = WEAPONS[currentWeaponId];
    if (!wp) return;
    const img = IMAGES[wp.key];
    if (!img) return;

    const worldAimX = mouse.x + camera.x;
    const worldAimY = mouse.y + camera.y;
    const dx = worldAimX - clone.x;
    const dy = worldAimY - clone.y;
    const angle = Math.atan2(dy, dx);
    const flipV = dx < 0;

    CTX.save();
    CTX.translate(clone.x, clone.y + 6 * (scale / 0.6));
    CTX.rotate(angle);
    if (flipV) CTX.scale(1, -1);

    const dw = img.width * scale;
    const dh = img.height * scale;

    CTX.shadowColor = '#c084fc';
    CTX.shadowBlur = 12;
    CTX.drawImage(img, 12 * (scale / 0.6), -dh / 2, dw, dh);

    if (clone.muzzleFlash && IMAGES['muzzle_flash']) {
      CTX.save();
      CTX.drawImage(IMAGES['muzzle_flash'], (12 + dw - 10) * (scale / 0.6), (-dh / 2 - 10) * (scale / 0.6), 44 * (scale / 0.6), 32 * (scale / 0.6));
      CTX.restore();
    }

    CTX.restore();
  }

  // --- UI UPDATES ---
  function updateHUD() {
    const scoreEl = document.getElementById('scoreDisplay');
    if (scoreEl) scoreEl.innerText = score.toLocaleString();

    const waveEl = document.getElementById('waveDisplay');
    if (waveEl) waveEl.innerText = `W${wave}`;

    // Centered Lives Love Indicator (Unlimited Love Hearts)
    const livesContainer = document.querySelector('.lives-indicator-center');
    if (livesContainer) {
      if (player.lives <= 0) {
        livesContainer.innerHTML = `<span class="heart-icon-unit" style="filter: grayscale(1);">💔</span><span class="lives-num" style="color:#ef4444;">0</span>`;
      } else if (player.lives <= 6) {
        let heartsHtml = '';
        for (let i = 0; i < player.lives; i++) {
          heartsHtml += `<span class="heart-icon-unit" style="animation-delay:${i * 0.15}s;" title="Life ${i + 1}">❤️</span>`;
        }
        livesContainer.innerHTML = heartsHtml;
      } else {
        livesContainer.innerHTML = `
          <span class="heart-icon-large">❤️</span>
          <span class="lives-num">×${player.lives}</span>
        `;
      }
    }
  }

  function renderWeaponsDock() {
    const container = document.querySelector('.weapons-container');
    if (!container) return;
    container.innerHTML = '';

    unlockedWeapons.forEach((id) => {
      const wp = WEAPONS[id];
      if (!wp) return;
      const btn = document.createElement('div');
      btn.id = `wpBtn${id}`;
      btn.className = `weapon-btn${id === currentWeaponId ? ' active' : ''}`;
      btn.title = `${wp.name} [${id}]`;
      btn.innerHTML = `
        <span class="weapon-key">[${id}]</span>
        <img src="assets/${wp.key}.png" alt="${wp.shortName || wp.name}">
        <span class="weapon-name">${wp.shortName || wp.name}</span>
      `;
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        selectWeapon(id);
      });
      btn.addEventListener('touchstart', (e) => {
        e.stopPropagation();
        selectWeapon(id);
      }, { passive: true });
      btn.addEventListener('touchend', (e) => {
        e.stopPropagation();
      }, { passive: true });
      container.appendChild(btn);
    });

    // Slider arrows visibility (>3 weapons)
    const slideLeftBtn = document.getElementById('wpSlideLeft');
    const slideRightBtn = document.getElementById('wpSlideRight');
    if (slideLeftBtn && slideRightBtn) {
      if (unlockedWeapons.length > 3) {
        slideLeftBtn.classList.remove('hidden');
        slideRightBtn.classList.remove('hidden');
      } else {
        slideLeftBtn.classList.add('hidden');
        slideRightBtn.classList.add('hidden');
      }
    }

    const selectedName = document.getElementById('selectedGunName');
    if (selectedName && WEAPONS[currentWeaponId]) {
      selectedName.innerText = WEAPONS[currentWeaponId].shortName || WEAPONS[currentWeaponId].name;
    }
  }

  function updateWeaponUI() {
    unlockedWeapons.forEach((id) => {
      const btn = document.getElementById(`wpBtn${id}`);
      if (btn) {
        if (id === currentWeaponId) {
          btn.classList.add('active');
          btn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        } else {
          btn.classList.remove('active');
        }
      }
    });

    const selectedName = document.getElementById('selectedGunName');
    if (selectedName && WEAPONS[currentWeaponId]) {
      selectedName.innerText = WEAPONS[currentWeaponId].shortName || WEAPONS[currentWeaponId].name;
    }
  }

  // --- MAIN GAME LOOP ---
  let lastTime = performance.now();
  function mainLoop(now) {
    const dt = Math.min((now - lastTime) / 1000, 0.1);
    lastTime = now;

    update(dt);
    render();

    requestAnimationFrame(mainLoop);
  }

  // --- EXPOSURES & INITIALIZATION ---
  window.selectWeapon = selectWeapon;
  window.cycleWeapon = cycleWeapon;
  window.toggleAutoFire = toggleAutoFire;
  window.togglePause = togglePause;

  // Helper for 100% reliable cross-device touch & click events
  function addTapListener(el, handler) {
    if (!el) return;
    let touchHandled = false;
    el.addEventListener('click', (e) => {
      if (touchHandled) {
        touchHandled = false;
        return;
      }
      e.stopPropagation();
      handler(e);
    });
    el.addEventListener('touchend', (e) => {
      touchHandled = true;
      e.preventDefault();
      e.stopPropagation();
      handler(e);
      setTimeout(() => { touchHandled = false; }, 350);
    }, { passive: false });
  }

  addTapListener(document.getElementById('startBtn'), () => {
    SOUNDS.init();
    document.getElementById('startOverlay').classList.add('hidden');
    resetGame();
  });

  addTapListener(document.getElementById('restartBtn'), () => {
    document.getElementById('gameOverOverlay').classList.add('hidden');
    resetGame();
  });

  addTapListener(document.getElementById('resumeBtn'), () => {
    togglePause();
  });

  addTapListener(document.getElementById('pauseRestartBtn'), () => {
    document.getElementById('pauseOverlay').classList.add('hidden');
    resetGame();
  });

  // Quit buttons
  let stateBeforeQuit = 'PLAYING';
  const closeBtn = document.getElementById('closeBtn');
  if (closeBtn) {
    addTapListener(closeBtn, () => {
      stateBeforeQuit = gameState;
      if (gameState === 'PLAYING') {
        gameState = 'PAUSED';
      }
      document.getElementById('quitOverlay').classList.remove('hidden');
    });
  }

  const cancelQuitBtn = document.getElementById('cancelQuitBtn');
  if (cancelQuitBtn) {
    addTapListener(cancelQuitBtn, () => {
      document.getElementById('quitOverlay').classList.add('hidden');
      if (stateBeforeQuit === 'PLAYING') {
        gameState = 'PLAYING';
      }
    });
  }

  const confirmQuitBtn = document.getElementById('confirmQuitBtn');
  if (confirmQuitBtn) {
    addTapListener(confirmQuitBtn, () => {
      document.getElementById('quitOverlay').classList.add('hidden');
      gameState = 'START';
      document.getElementById('startOverlay').classList.remove('hidden');
    });
  }

  const pauseQuitBtn = document.getElementById('pauseQuitBtn');
  if (pauseQuitBtn) {
    addTapListener(pauseQuitBtn, () => {
      document.getElementById('pauseOverlay').classList.add('hidden');
      gameState = 'START';
      document.getElementById('startOverlay').classList.remove('hidden');
    });
  }

  // Pause Button (Top-Left Bar)
  const pauseBtn = document.getElementById('pauseBtn');
  if (pauseBtn) {
    addTapListener(pauseBtn, () => {
      togglePause();
    });
  }

  // Settings Overlay Logic
  const settingsBtn = document.getElementById('settingsBtn');
  const settingsOverlay = document.getElementById('settingsOverlay');
  const settingsCloseBtn = document.getElementById('settingsCloseBtn');
  const settingsResumeBtn = document.getElementById('settingsResumeBtn');
  const settingSoundToggle = document.getElementById('settingSoundToggle');
  const settingAutoFireToggle = document.getElementById('settingAutoFireToggle');
  let stateBeforeSettings = 'PLAYING';

  function openSettings() {
    if (gameState === 'PLAYING') {
      stateBeforeSettings = 'PLAYING';
      gameState = 'PAUSED';
    } else {
      stateBeforeSettings = gameState;
    }
    updateSoundUI();
    updateAutoFireUI();
    if (settingsOverlay) settingsOverlay.classList.remove('hidden');
  }

  function closeSettings() {
    if (settingsOverlay) settingsOverlay.classList.add('hidden');
    if (stateBeforeSettings === 'PLAYING' && gameState === 'PAUSED') {
      gameState = 'PLAYING';
    }
  }

  if (settingsBtn) {
    addTapListener(settingsBtn, () => {
      openSettings();
    });
  }

  if (settingsCloseBtn) {
    addTapListener(settingsCloseBtn, () => {
      closeSettings();
    });
  }

  if (settingsResumeBtn) {
    addTapListener(settingsResumeBtn, () => {
      closeSettings();
    });
  }

  if (settingSoundToggle) {
    addTapListener(settingSoundToggle, () => {
      SOUNDS.muted = !SOUNDS.muted;
      SOUNDS.init();
      updateSoundUI();
    });
  }

  if (settingAutoFireToggle) {
    addTapListener(settingAutoFireToggle, () => {
      toggleAutoFire();
    });
  }

  // Top Bar Mute Button
  const muteBtn = document.getElementById('muteBtn');
  if (muteBtn) {
    addTapListener(muteBtn, () => {
      SOUNDS.muted = !SOUNDS.muted;
      SOUNDS.init();
      updateSoundUI();
    });
  }

  // Top Bar Fullscreen Button
  const fullscreenBtn = document.getElementById('fullscreenBtn');

  function isFullscreen() {
    return !!(
      document.fullscreenElement ||
      document.webkitFullscreenElement ||
      document.mozFullScreenElement ||
      document.msFullscreenElement
    );
  }

  function toggleFullscreen() {
    const docEl = document.documentElement;
    if (!isFullscreen()) {
      if (docEl.requestFullscreen) {
        docEl.requestFullscreen().catch(() => {});
      } else if (docEl.webkitRequestFullscreen) {
        docEl.webkitRequestFullscreen();
      } else if (docEl.mozRequestFullScreen) {
        docEl.mozRequestFullScreen();
      } else if (docEl.msRequestFullscreen) {
        docEl.msRequestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      } else if (document.mozCancelFullScreen) {
        document.mozCancelFullScreen();
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
      }
    }
  }

  function updateFullscreenUI() {
    if (fullscreenBtn) {
      fullscreenBtn.innerText = isFullscreen() ? '🗗' : '⛶';
      fullscreenBtn.title = isFullscreen() ? 'Exit Fullscreen' : 'Toggle Fullscreen';
    }
  }

  if (fullscreenBtn) {
    addTapListener(fullscreenBtn, () => {
      toggleFullscreen();
    });
  }

  ['fullscreenchange', 'webkitfullscreenchange', 'mozfullscreenchange', 'MSFullscreenChange'].forEach((evt) => {
    document.addEventListener(evt, updateFullscreenUI);
  });

  // Selected Weapon Badge - Tap to cycle weapon
  const selectedGunBadge = document.getElementById('selectedGunBadge');
  if (selectedGunBadge) {
    addTapListener(selectedGunBadge, () => {
      cycleWeapon();
    });
  }

  // Weapon Collection Slider Navigation Arrows
  const slideLeftBtn = document.getElementById('wpSlideLeft');
  const slideRightBtn = document.getElementById('wpSlideRight');
  const weaponsContainer = document.getElementById('weaponsContainer');
  if (slideLeftBtn && weaponsContainer) {
    addTapListener(slideLeftBtn, () => {
      weaponsContainer.scrollBy({ left: -140, behavior: 'smooth' });
    });
  }
  if (slideRightBtn && weaponsContainer) {
    addTapListener(slideRightBtn, () => {
      weaponsContainer.scrollBy({ left: 140, behavior: 'smooth' });
    });
  }

  // Stop touch propagation on HUD interactive elements to keep canvas joystick untouched
  document.querySelectorAll('.hud-btn, .weapon-btn, .action-btn, .toggle-pill, .selected-gun-badge, .slider-arrow').forEach((el) => {
    el.addEventListener('touchstart', (e) => e.stopPropagation(), { passive: true });
  });

  // Start engine main loop and UI immediately
  updateHUD();
  renderWeaponsDock();
  updateWeaponUI();
  updateAutoFireUI();
  updateSoundUI();
  updateFullscreenUI();
  requestAnimationFrame(mainLoop);

  // Background asset preloader
  loadAssets().then(() => {
    updateHUD();
    renderWeaponsDock();
    updateWeaponUI();
  });
})();
