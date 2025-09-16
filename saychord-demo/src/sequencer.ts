import * as Tone from 'tone'
import { sayChordSynth } from './audio'

export type Step = {
	chordSymbol: string
	notes: string[]
	active: boolean
}

export class ChordSequencer {
	private part: Tone.Part | null = null
	private steps: Step[] = []
	private subdivision: string = '1m'

	public setSteps(steps: Step[], subdivision: string = '1m') {
		this.steps = steps
		this.subdivision = subdivision
		this.rebuild()
	}

	private rebuild() {
		this.part?.dispose()
		const events = this.steps.map((s, idx) => ({ time: `${idx} * ${this.subdivision}`, step: s }))
		this.part = new Tone.Part((_time, ev: { time: string; step: Step }) => {
			if (!ev.step.active) return
			sayChordSynth.triggerChord(ev.step.notes, this.subdivision)
		}, events)
		this.part.loop = true
		this.part.loopEnd = `${this.steps.length} * ${this.subdivision}`
		this.part.start(0)
	}

	public async play(tempoBpm = 100) {
		await sayChordSynth.ensureStarted()
		Tone.Transport.bpm.value = tempoBpm
		Tone.Transport.start()
	}

	public stop() {
		Tone.Transport.stop()
	}

	public dispose() {
		this.part?.dispose()
		this.part = null
	}
}

export const chordSequencer = new ChordSequencer()

