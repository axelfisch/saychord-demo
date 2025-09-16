import SwiftUI

struct ContentView: View {
    @StateObject private var viewModel = ChordViewModel()
    @State private var chordInput = ""
    @State private var showingExportOptions = false
    
    var body: some View {
        NavigationView {
            VStack(spacing: 20) {
                // Header
                VStack(spacing: 10) {
                    Text("SayChord")
                        .font(.largeTitle)
                        .fontWeight(.bold)
                    
                    Text("Dictée vocale d'accords musicaux")
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                }
                .padding(.top)
                
                // Input Section
                VStack(spacing: 15) {
                    HStack {
                        TextField("Entrez un accord (ex: Do majeur)", text: $chordInput)
                            .textFieldStyle(RoundedBorderTextFieldStyle())
                            .onSubmit {
                                viewModel.processChordText(chordInput)
                                chordInput = ""
                            }
                        
                        Button(action: {
                            viewModel.processChordText(chordInput)
                            chordInput = ""
                        }) {
                            Image(systemName: "play.circle.fill")
                                .font(.title)
                                .foregroundColor(.blue)
                        }
                        .disabled(chordInput.isEmpty)
                    }
                    
                    // Voice Recognition Button
                    Button(action: {
                        if viewModel.isListening {
                            viewModel.stopListening()
                        } else {
                            viewModel.startListening()
                        }
                    }) {
                        HStack {
                            Image(systemName: viewModel.isListening ? "mic.fill" : "mic")
                            Text(viewModel.isListening ? "Arrêter" : "Dicter (FR)")
                        }
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(viewModel.isListening ? Color.red : Color.blue)
                        .foregroundColor(.white)
                        .cornerRadius(10)
                    }
                    
                    // Status Text
                    if let status = viewModel.statusText {
                        Text(status)
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                }
                .padding(.horizontal)
                
                // Chord Display
                if let currentChord = viewModel.currentChord {
                    VStack(spacing: 10) {
                        Text("Accord reconnu:")
                            .font(.headline)
                        Text(currentChord)
                            .font(.title2)
                            .fontWeight(.semibold)
                            .foregroundColor(.blue)
                    }
                    .padding()
                    .background(Color.gray.opacity(0.1))
                    .cornerRadius(10)
                }
                
                // Sequence Section
                if !viewModel.chordSequence.isEmpty {
                    VStack(alignment: .leading, spacing: 10) {
                        Text("Séquence:")
                            .font(.headline)
                        
                        ScrollView(.horizontal, showsIndicators: false) {
                            HStack(spacing: 10) {
                                ForEach(Array(viewModel.chordSequence.enumerated()), id: \.offset) { index, chord in
                                    Text(chord)
                                        .padding(.horizontal, 12)
                                        .padding(.vertical, 8)
                                        .background(index == viewModel.currentSequenceIndex ? Color.blue : Color.gray.opacity(0.2))
                                        .foregroundColor(index == viewModel.currentSequenceIndex ? .white : .primary)
                                        .cornerRadius(8)
                                }
                            }
                        }
                        
                        HStack(spacing: 15) {
                            Button("Effacer") {
                                viewModel.clearSequence()
                            }
                            .foregroundColor(.red)
                            
                            Spacer()
                            
                            Button(action: viewModel.togglePlayback) {
                                Image(systemName: viewModel.isPlaying ? "pause.circle.fill" : "play.circle.fill")
                                    .font(.title2)
                            }
                            
                            Button(action: { viewModel.isLooping.toggle() }) {
                                Image(systemName: "repeat")
                                    .font(.title2)
                                    .foregroundColor(viewModel.isLooping ? .blue : .gray)
                            }
                        }
                    }
                    .padding()
                    .background(Color.gray.opacity(0.1))
                    .cornerRadius(10)
                }
                
                Spacer()
                
                // Bottom Controls
                VStack(spacing: 15) {
                    // Tempo Control
                    HStack {
                        Text("Tempo: \(Int(viewModel.tempo)) BPM")
                        Slider(value: $viewModel.tempo, in: 60...200, step: 5)
                    }
                    
                    // Export Buttons
                    HStack(spacing: 20) {
                        Button(action: {
                            viewModel.exportMIDI()
                        }) {
                            Label("Export MIDI", systemImage: "doc.text")
                        }
                        .disabled(viewModel.chordSequence.isEmpty)
                        
                        Button(action: {
                            if viewModel.isRecording {
                                viewModel.stopRecording()
                            } else {
                                viewModel.startRecording()
                            }
                        }) {
                            Label(viewModel.isRecording ? "Stop Recording" : "Record WAV", systemImage: viewModel.isRecording ? "stop.circle" : "record.circle")
                                .foregroundColor(viewModel.isRecording ? .red : .blue)
                        }
                    }
                }
                .padding()
            }
            .navigationBarHidden(true)
            .alert("Permissions requises", isPresented: $viewModel.showPermissionAlert) {
                Button("OK") { }
            } message: {
                Text("SayChord a besoin d'accéder au microphone et à la reconnaissance vocale pour fonctionner.")
            }
        }
    }
}