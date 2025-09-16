import Foundation

struct ChordParser {
    private static let frenchToPitchClass: [String: String] = [
        "do": "C",
        "re": "D",
        "ré": "D",
        "mi": "E",
        "fa": "F",
        "sol": "G",
        "la": "A",
        "si": "B"
    ]
    
    private static let accidentalWords: [String: String] = [
        "dièse": "#",
        "diese": "#",
        "#": "#",
        "bémol": "b",
        "bemol": "b",
        "♭": "b",
        "b": "b"
    ]
    
    enum Quality: String {
        case major = ""
        case minor = "m"
        case seventh = "7"
        case majorSeventh = "maj7"
        case minorSeventh = "m7"
        case diminished = "dim"
        case augmented = "aug"
        case sus2 = "sus2"
        case sus4 = "sus4"
    }
    
    static func parseFrenchChordToSymbol(_ input: String) -> String? {
        let normalized = normalizeText(input)
        let tokens = normalized.split(separator: " ")
            .map { String($0) }
            .filter { !["accord", "de", "du", "la", "le", "un", "une", "joue", "jouer"].contains($0) }
        
        guard !tokens.isEmpty else { return nil }
        
        // Find tonic
        guard let tonicIndex = tokens.firstIndex(where: { frenchToPitchClass[$0] != nil }),
              let tonicWord = tokens[safe: tonicIndex],
              var pitchClass = frenchToPitchClass[tonicWord] else { return nil }
        
        // Check for accidental
        if let accidentalWord = tokens[safe: tonicIndex + 1],
           let accidental = accidentalWords[accidentalWord] {
            pitchClass += accidental
        }
        
        // Parse quality
        let qualityTokens = tokens.enumerated()
            .filter { $0.offset != tonicIndex && $0.offset != tonicIndex + 1 }
            .map { $0.element }
        
        let quality = parseQuality(from: qualityTokens)
        
        // Build chord symbol
        var symbol = pitchClass
        
        switch quality {
        case .major:
            break // No suffix for major
        case .minor:
            symbol += "m"
        case .seventh:
            symbol += "7"
        case .majorSeventh:
            symbol += "maj7"
        case .minorSeventh:
            symbol += "m7"
        case .diminished:
            symbol += "dim"
        case .augmented:
            symbol += "aug"
        case .sus2:
            symbol += "sus2"
        case .sus4:
            symbol += "sus4"
        }
        
        return symbol
    }
    
    private static func normalizeText(_ input: String) -> String {
        return input
            .lowercased()
            .replacingOccurrences(of: "[,;:!?.]", with: " ", options: .regularExpression)
            .trimmingCharacters(in: .whitespacesAndNewlines)
    }
    
    private static func parseQuality(from tokens: [String]) -> Quality {
        let tokenSet = Set(tokens)
        
        if tokenSet.contains("sus2") { return .sus2 }
        if tokenSet.contains("sus4") { return .sus4 }
        if tokenSet.contains(where: { ["dim", "diminué", "diminue", "diminuee", "diminuée", "°"].contains($0) }) {
            return .diminished
        }
        if tokenSet.contains(where: { ["aug", "augmenté", "augmente", "augmentee", "augmentée", "+"].contains($0) }) {
            return .augmented
        }
        
        let hasMinor = tokenSet.contains(where: { ["mineur", "min", "m"].contains($0) })
        let hasMajor = tokenSet.contains(where: { ["majeur", "maj"].contains($0) })
        let has7 = tokenSet.contains(where: { ["7", "sept", "septieme", "septième"].contains($0) })
        
        if hasMinor && has7 { return .minorSeventh }
        if hasMajor && has7 { return .majorSeventh }
        if has7 { return .seventh }
        if hasMinor { return .minor }
        
        return .major
    }
    
    static func voiceChord(_ symbol: String, baseOctave: Int = 4) -> [String]? {
        // Parse the chord symbol
        let pattern = "^([A-G][#b]?)(.*)$"
        guard let regex = try? NSRegularExpression(pattern: pattern),
              let match = regex.firstMatch(in: symbol, range: NSRange(symbol.startIndex..., in: symbol)),
              let rootRange = Range(match.range(at: 1), in: symbol) else { return nil }
        
        let root = String(symbol[rootRange])
        let qualityString = match.range(at: 2).location != NSNotFound ?
            String(symbol[Range(match.range(at: 2), in: symbol)!]) : ""
        
        // Get intervals for chord quality
        let intervals: [Int]
        switch qualityString {
        case "", "maj":
            intervals = [0, 4, 7] // Major triad
        case "m", "min":
            intervals = [0, 3, 7] // Minor triad
        case "7":
            intervals = [0, 4, 7, 10] // Dominant 7th
        case "maj7":
            intervals = [0, 4, 7, 11] // Major 7th
        case "m7":
            intervals = [0, 3, 7, 10] // Minor 7th
        case "dim":
            intervals = [0, 3, 6] // Diminished
        case "aug":
            intervals = [0, 4, 8] // Augmented
        case "sus2":
            intervals = [0, 2, 7] // Sus2
        case "sus4":
            intervals = [0, 5, 7] // Sus4
        default:
            return nil
        }
        
        // Convert to note names
        guard let rootMidi = midiNote(for: root, octave: baseOctave) else { return nil }
        
        var notes: [String] = []
        var currentMidi = rootMidi
        
        for interval in intervals {
            var midi = rootMidi + interval
            // Ensure ascending order
            while midi < currentMidi {
                midi += 12
            }
            currentMidi = midi
            
            if let noteName = noteNameFromMidi(midi) {
                notes.append(noteName)
            }
        }
        
        return notes
    }
    
    private static func midiNote(for pitchClass: String, octave: Int) -> Int? {
        let noteValues: [String: Int] = [
            "C": 0, "C#": 1, "Db": 1, "D": 2, "D#": 3, "Eb": 3,
            "E": 4, "F": 5, "F#": 6, "Gb": 6, "G": 7, "G#": 8,
            "Ab": 8, "A": 9, "A#": 10, "Bb": 10, "B": 11
        ]
        
        guard let noteValue = noteValues[pitchClass] else { return nil }
        return (octave + 1) * 12 + noteValue
    }
    
    private static func noteNameFromMidi(_ midi: Int) -> String? {
        let noteNames = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]
        let octave = (midi / 12) - 1
        let noteIndex = midi % 12
        return "\(noteNames[noteIndex])\(octave)"
    }
}

extension Collection {
    subscript(safe index: Index) -> Element? {
        return indices.contains(index) ? self[index] : nil
    }
}