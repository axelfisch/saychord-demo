import { useMemo, useState } from 'react'
import './App.css'
import { sayChordSynth } from './audio'
import { parseFrenchChordToSymbol, voiceChord } from './chords'
import { FrenchSpeechRecognizer, type SpeechState } from './speech'
import { chordSequencer, type Step } from './sequencer'
import { stepsToMIDI } from './exporters'
import { saveAs } from 'file-saver'

function App() {
  const [started, setStarted] = useState(false)
  const [lastPlayed, setLastPlayed] = useState<string | null>(null)
  const [input, setInput] = useState('do majeur')
  const [speechState, setSpeechState] = useState<SpeechState>('idle')
  const recognizer = useMemo(() => {
    const r = new FrenchSpeechRecognizer()
    r.setCallbacks((text) => {
      setInput(text)
      handlePlayParsed()
    }, setSpeechState)
    return r
  }, [])

  const [steps, setSteps] = useState<Step[]>([
    { chordSymbol: 'Cmaj7', notes: ['C4','E4','G4','B4'], active: true },
    { chordSymbol: 'Dm7', notes: ['D4','F4','A4','C5'], active: true },
    { chordSymbol: 'G7', notes: ['G3','B3','D4','F4'], active: true },
    { chordSymbol: 'Cmaj7', notes: ['C4','E4','G4','B4'], active: true },
  ])
  const [tempo, setTempo] = useState(96)
  const [subdivision, setSubdivision] = useState('1m')

  const syncSequencer = async () => {
    chordSequencer.setSteps(steps, subdivision)
  }

  const handlePlaySeq = async () => {
    await syncSequencer()
    await chordSequencer.play(tempo)
  }

  const handleStopSeq = () => {
    chordSequencer.stop()
  }

  const handleExportMIDI = () => {
    const blob = stepsToMIDI(steps, tempo, subdivision)
    saveAs(blob, 'saychord-demo.mid')
  }

  const handleRecord = async () => {
    await sayChordSynth.startRecording()
    await handlePlaySeq()
  }

  const handleStopAndSaveWav = async () => {
    chordSequencer.stop()
    const blob = await sayChordSynth.stopRecording()
    if (blob) saveAs(blob, 'saychord-demo.wav')
  }

  const handleStart = async () => {
    await sayChordSynth.ensureStarted()
    setStarted(true)
  }

  const handleTestChord = async () => {
    if (!started) await handleStart()
    const chord = ['C4', 'E4', 'G4']
    setLastPlayed(chord.join(' '))
    sayChordSynth.triggerChord(chord, '2n')
  }

  const handlePlayParsed = async () => {
    if (!started) await handleStart()
    const symbol = parseFrenchChordToSymbol(input)
    if (!symbol) {
      setLastPlayed('Aucun accord reconnu')
      return
    }
    const voiced = voiceChord(symbol, 4)
    if (!voiced) {
      setLastPlayed(`Impossible d'analyser: ${symbol}`)
      return
    }
    setLastPlayed(`${input} → ${symbol} → ${voiced.join(' ')}`)
    sayChordSynth.triggerChord(voiced, '2n')
  }

  return (
    <div className="card" style={{ maxWidth: 600, margin: '2rem auto' }}>
      <h1>SayChord Demo</h1>
      <p>Démo: démarrer l'audio et jouer un accord test.</p>
      <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
        <button onClick={handleStart} disabled={started}>
          {started ? 'Audio prêt' : 'Démarrer l\'audio'}
        </button>
        <button onClick={handleTestChord}>Jouer C majeur</button>
      </div>
      <div style={{ display: 'flex', gap: 12 }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Dictez/entrez un accord (ex: ré mineur 7)"
          style={{ flex: 1, padding: '8px 10px' }}
        />
        <button onClick={handlePlayParsed}>Jouer</button>
      </div>
      <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
        <button onClick={() => recognizer.start()} disabled={speechState === 'listening'}>
          {speechState === 'listening' ? 'Écoute...' : 'Dicter (FR)'}
        </button>
        {speechState === 'unsupported' && <span>Reconnaissance vocale non supportée</span>}
      </div>
      {lastPlayed && (
        <p style={{ marginTop: 12 }}>Dernier accord joué: {lastPlayed}</p>
      )}

      <hr style={{ margin: '24px 0' }} />
      <h2>Séquence</h2>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 8 }}>
        <label>Tempo: </label>
        <input type="number" value={tempo} onChange={(e) => setTempo(parseInt(e.target.value || '0') || 60)} style={{ width: 80 }} />
        <label>Subdivision: </label>
        <select value={subdivision} onChange={(e) => setSubdivision(e.target.value)}>
          <option value="1m">Mesure</option>
          <option value="2n">Blanche</option>
          <option value="4n">Noire</option>
        </select>
        <button onClick={handlePlaySeq}>Lecture</button>
        <button onClick={handleStopSeq}>Stop</button>
        <button onClick={handleExportMIDI}>Exporter MIDI</button>
        <button onClick={handleRecord}>Enregistrer WAV</button>
        <button onClick={handleStopAndSaveWav}>Arrêter & Sauver WAV</button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
        {steps.map((s, i) => (
          <div key={i} style={{ border: '1px solid #ccc', padding: 8, borderRadius: 6 }}>
            <div style={{ marginBottom: 6, fontWeight: 600 }}>{s.chordSymbol}</div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <label>
                <input
                  type="checkbox"
                  checked={s.active}
                  onChange={(e) => {
                    const next = steps.slice()
                    next[i] = { ...s, active: e.target.checked }
                    setSteps(next)
                  }}
                /> actif
              </label>
              <button onClick={async () => {
                const symbol = parseFrenchChordToSymbol(input)
                if (!symbol) return
                const voiced = voiceChord(symbol, 4)
                if (!voiced) return
                const next = steps.slice()
                next[i] = { chordSymbol: symbol, notes: voiced, active: true }
                setSteps(next)
              }}>Remplacer par l'entrée</button>
            </div>
            <div style={{ marginTop: 6, fontSize: 12, color: '#555' }}>{s.notes.join(' ')}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default App
