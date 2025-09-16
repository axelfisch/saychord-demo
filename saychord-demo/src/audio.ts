import * as Tone from 'tone'

export class SayChordSynth {
	private poly: Tone.PolySynth<Tone.FMSynth> | null = null
	private reverb: Tone.Reverb | null = null
	private limiter: Tone.Limiter | null = null
	private recorder: Tone.Recorder | null = null

	public async ensureStarted(): Promise<void> {
		await Tone.start()
		if (this.poly) return
		this.reverb = new Tone.Reverb({ decay: 2.5, wet: 0.25 })
		this.limiter = new Tone.Limiter({ threshold: -1 })
		this.poly = new Tone.PolySynth(Tone.FMSynth, {
			oscillator: { type: 'sine' },
			modulation: { type: 'square' },
			envelope: { attack: 0.01, decay: 0.2, sustain: 0.6, release: 0.8 },
			modulationEnvelope: { attack: 0.02, decay: 0.2, sustain: 0.4, release: 0.6 },
		}).toDestination()
		this.recorder = new Tone.Recorder()
		this.poly.chain(this.reverb!, this.limiter!, this.recorder, Tone.getDestination())
	}

	public triggerChord(notes: string[], duration: string | number = '1n') {
		if (!this.poly) return
		this.poly.triggerAttackRelease(notes, duration)
	}

	public dispose() {
		this.poly?.dispose()
		this.reverb?.dispose()
		this.limiter?.dispose()
		this.recorder?.dispose()
		this.poly = null
		this.reverb = null
		this.limiter = null
		this.recorder = null
	}

	public async startRecording() {
		await this.ensureStarted()
		this.recorder?.start()
	}

	public async stopRecording(): Promise<Blob | null> {
		if (!this.recorder) return null
		const recording = await this.recorder.stop()
		return recording || null
	}
}

export const sayChordSynth = new SayChordSynth()

