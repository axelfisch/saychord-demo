import Foundation
import AVFoundation

struct MIDIExporter {
    static func exportSequence(_ chords: [String], tempo: Int) throws -> URL {
        // Create MIDI sequence
        var musicSequence: MusicSequence?
        NewMusicSequence(&musicSequence)
        
        guard let sequence = musicSequence else {
            throw MIDIError.sequenceCreationFailed
        }
        
        // Create track
        var track: MusicTrack?
        MusicSequenceNewTrack(sequence, &track)
        
        guard let midiTrack = track else {
            DisposeMusicSequence(sequence)
            throw MIDIError.trackCreationFailed
        }
        
        // Set tempo
        MusicSequenceSetTempoTrack(sequence, midiTrack)
        var tempoEvent = ExtendedTempoEvent(bpm: Float64(tempo))
        MusicTrackNewExtendedTempoEvent(midiTrack, 0, &tempoEvent)
        
        // Add chord events
        var currentBeat: MusicTimeStamp = 0
        let beatDuration: MusicTimeStamp = 1.0 // One beat per chord
        
        for chord in chords {
            if let notes = ChordParser.voiceChord(chord) {
                // Add note on events
                for note in notes {
                    if let midiNote = midiNoteNumber(for: note) {
                        var noteMessage = MIDINoteMessage(
                            channel: 0,
                            note: midiNote,
                            velocity: 80,
                            releaseVelocity: 0,
                            duration: Float32(beatDuration * 0.9) // Slight gap between chords
                        )
                        MusicTrackNewMIDINoteEvent(midiTrack, currentBeat, &noteMessage)
                    }
                }
                currentBeat += beatDuration
            }
        }
        
        // Create temporary file URL
        let tempDir = FileManager.default.temporaryDirectory
        let fileName = "SayChord_\(Date().timeIntervalSince1970).mid"
        let fileURL = tempDir.appendingPathComponent(fileName)
        
        // Export to file
        let cfURL = fileURL as CFURL
        MusicSequenceFileCreate(sequence, cfURL, .midiType, .eraseFile, 0)
        
        // Clean up
        DisposeMusicSequence(sequence)
        
        return fileURL
    }
    
    private static func midiNoteNumber(for note: String) -> UInt8? {
        // Parse note name and octave
        let pattern = "^([A-G][#b]?)(\\d)$"
        guard let regex = try? NSRegularExpression(pattern: pattern),
              let match = regex.firstMatch(in: note, range: NSRange(note.startIndex..., in: note)),
              let noteRange = Range(match.range(at: 1), in: note),
              let octaveRange = Range(match.range(at: 2), in: note) else { return nil }
        
        let noteName = String(note[noteRange])
        guard let octave = Int(String(note[octaveRange])) else { return nil }
        
        // MIDI note values relative to C
        let noteValues: [String: Int] = [
            "C": 0, "C#": 1, "Db": 1, "D": 2, "D#": 3, "Eb": 3,
            "E": 4, "F": 5, "F#": 6, "Gb": 6, "G": 7, "G#": 8,
            "Ab": 8, "A": 9, "A#": 10, "Bb": 10, "B": 11
        ]
        
        guard let noteValue = noteValues[noteName] else { return nil }
        
        // Calculate MIDI note number
        let midiNote = (octave + 1) * 12 + noteValue
        
        return UInt8(max(0, min(127, midiNote)))
    }
}

enum MIDIError: LocalizedError {
    case sequenceCreationFailed
    case trackCreationFailed
    
    var errorDescription: String? {
        switch self {
        case .sequenceCreationFailed:
            return "Failed to create MIDI sequence"
        case .trackCreationFailed:
            return "Failed to create MIDI track"
        }
    }
}