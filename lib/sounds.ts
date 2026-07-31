'use client'

// Retro 8-bit Web Audio Synthesizer for zero-latency arcade sound effects

class RetroAudioEngine {
  private ctx: AudioContext | null = null

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
      if (AudioCtx) {
        this.ctx = new AudioCtx()
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume()
    }
    return this.ctx
  }

  // Retro 8-bit Click / Blip Sound (Market Row Click)
  playClick() {
    try {
      const ctx = this.getContext()
      if (!ctx) return

      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.type = 'square'
      osc.frequency.setValueAtTime(440, ctx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.05)

      gain.gain.setValueAtTime(0.08, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05)

      osc.connect(gain)
      gain.connect(ctx.destination)

      osc.start()
      osc.stop(ctx.currentTime + 0.05)
    } catch {
      // Audio autoplay restrictions safety catch
    }
  }

  // Retro 8-bit Coin / Reward Sound (Wages Redemption)
  playCoin() {
    try {
      const ctx = this.getContext()
      if (!ctx) return

      const now = ctx.currentTime

      // Tone 1: B5 (987.77 Hz)
      const osc1 = ctx.createOscillator()
      const gain1 = ctx.createGain()
      osc1.type = 'square'
      osc1.frequency.setValueAtTime(987.77, now)
      gain1.gain.setValueAtTime(0.1, now)
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.08)

      osc1.connect(gain1)
      gain1.connect(ctx.destination)

      osc1.start(now)
      osc1.stop(now + 0.08)

      // Tone 2: E6 (1318.51 Hz) - Ascending coin chime
      const osc2 = ctx.createOscillator()
      const gain2 = ctx.createGain()
      osc2.type = 'square'
      osc2.frequency.setValueAtTime(1318.51, now + 0.08)
      gain2.gain.setValueAtTime(0.12, now + 0.08)
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.35)

      osc2.connect(gain2)
      gain2.connect(ctx.destination)

      osc2.start(now + 0.08)
      osc2.stop(now + 0.35)
    } catch {
      // Audio autoplay restrictions safety catch
    }
  }
}

export const retroAudio = new RetroAudioEngine()
