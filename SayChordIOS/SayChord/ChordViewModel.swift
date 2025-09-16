import SwiftUI
import Combine
import AVFoundation

class ChordViewModel: ObservableObject {
    @Published var currentChord: String?
    @Published var chordSequence: [String] = []
    @Published var isListening = false
    @Published var isPlaying = false
    @Published var isLooping = false
    @Published var isRecording = false
    @Published var tempo: Double = 120
    @Published var currentSequenceIndex: Int = -1
    @Published var statusText: String?
    @Published var showPermissionAlert = false
    
    private let speechRecognizer = SpeechRecognizer()
    private let audioSynthesizer = AudioSynthesizer()
    private let chordSequencer = ChordSequencer()
    private let audioRecorder = AudioRecorder()
    private var cancellables = Set<AnyCancellable>()
    
    init() {
        setupBindings()
        requestPermissions()
    }
    
    private func setupBindings() {
        speechRecognizer.recognizedTextPublisher
            .sink { [weak self] text in
                self?.processChordText(text)
            }
            .store(in: &cancellables)
        
        speechRecognizer.statePublisher
            .sink { [weak self] state in
                switch state {
                case .listening:
                    self?.statusText = "Écoutez..."
                case .processing:
                    self?.statusText = "Traitement..."
                case .idle:
                    self?.statusText = nil
                    self?.isListening = false
                case .error(let message):
                    self?.statusText = "Erreur: \(message)"
                    self?.isListening = false
                }
            }
            .store(in: &cancellables)
        
        chordSequencer.currentIndexPublisher
            .sink { [weak self] index in
                self?.currentSequenceIndex = index
                if index >= 0, let chord = self?.chordSequence[safe: index] {
                    self?.playChord(chord)
                }
            }
            .store(in: &cancellables)
        
        chordSequencer.isPlayingPublisher
            .sink { [weak self] isPlaying in
                self?.isPlaying = isPlaying
            }
            .store(in: &cancellables)
        
        $tempo
            .sink { [weak self] tempo in
                self?.chordSequencer.tempo = Int(tempo)
            }
            .store(in: &cancellables)
        
        $isLooping
            .sink { [weak self] isLooping in
                self?.chordSequencer.isLooping = isLooping
            }
            .store(in: &cancellables)
    }
    
    private func requestPermissions() {
        Task {
            let hasPermissions = await speechRecognizer.requestPermissions()
            if !hasPermissions {
                await MainActor.run {
                    self.showPermissionAlert = true
                }
            }
        }
    }
    
    func startListening() {
        Task {
            do {
                try await speechRecognizer.startListening()
                await MainActor.run {
                    self.isListening = true
                }
            } catch {
                await MainActor.run {
                    self.statusText = "Erreur: \(error.localizedDescription)"
                }
            }
        }
    }
    
    func stopListening() {
        speechRecognizer.stopListening()
        isListening = false
    }
    
    func processChordText(_ text: String) {
        guard !text.isEmpty else { return }
        
        if let chordSymbol = ChordParser.parseFrenchChordToSymbol(text) {
            currentChord = chordSymbol
            chordSequence.append(chordSymbol)
            playChord(chordSymbol)
        } else {
            statusText = "Accord non reconnu: \(text)"
        }
    }
    
    private func playChord(_ chordSymbol: String) {
        if let notes = ChordParser.voiceChord(chordSymbol) {
            audioSynthesizer.playChord(notes: notes)
        }
    }
    
    func togglePlayback() {
        if isPlaying {
            chordSequencer.stop()
        } else {
            chordSequencer.play(sequence: chordSequence)
        }
    }
    
    func clearSequence() {
        chordSequence.removeAll()
        currentSequenceIndex = -1
        chordSequencer.stop()
    }
    
    func startRecording() {
        Task {
            do {
                try await audioRecorder.startRecording()
                await MainActor.run {
                    self.isRecording = true
                }
            } catch {
                await MainActor.run {
                    self.statusText = "Erreur d'enregistrement: \(error.localizedDescription)"
                }
            }
        }
    }
    
    func stopRecording() {
        Task {
            do {
                let url = try await audioRecorder.stopRecording()
                await MainActor.run {
                    self.isRecording = false
                    self.statusText = "Enregistrement sauvegardé"
                }
                // Here you could share the file or save it to documents
            } catch {
                await MainActor.run {
                    self.statusText = "Erreur: \(error.localizedDescription)"
                }
            }
        }
    }
    
    func exportMIDI() {
        do {
            let url = try MIDIExporter.exportSequence(chordSequence, tempo: Int(tempo))
            statusText = "MIDI exporté"
            // Here you could share the file
        } catch {
            statusText = "Erreur d'export: \(error.localizedDescription)"
        }
    }
}

extension Collection {
    subscript(safe index: Index) -> Element? {
        return indices.contains(index) ? self[index] : nil
    }
}