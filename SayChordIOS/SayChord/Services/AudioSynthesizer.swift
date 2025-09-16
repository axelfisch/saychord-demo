import AVFoundation
import AudioToolbox

class AudioSynthesizer {
    private let audioEngine = AVAudioEngine()
    private let mixer = AVAudioMixerNode()
    private var oscillators: [String: OscillatorNode] = [:]
    private let reverb = AVAudioUnitReverb()
    
    init() {
        setupAudioEngine()
    }
    
    private func setupAudioEngine() {
        // Add nodes to engine
        audioEngine.attach(mixer)
        audioEngine.attach(reverb)
        
        // Set up reverb
        reverb.loadFactoryPreset(.mediumHall)
        reverb.wetDryMix = 25
        
        // Connect nodes
        audioEngine.connect(mixer, to: reverb, format: nil)
        audioEngine.connect(reverb, to: audioEngine.mainMixerNode, format: nil)
        
        // Start engine
        do {
            try audioEngine.start()
        } catch {
            print("Failed to start audio engine: \(error)")
        }
    }
    
    func playChord(notes: [String], duration: TimeInterval = 1.0) {
        // Stop any currently playing notes
        stopAllNotes()
        
        // Play each note in the chord
        for note in notes {
            if let frequency = frequencyForNote(note) {
                let oscillator = OscillatorNode(frequency: frequency)
                oscillators[note] = oscillator
                
                audioEngine.attach(oscillator)
                audioEngine.connect(oscillator, to: mixer, format: nil)
                
                oscillator.start()
            }
        }
        
        // Schedule note off
        DispatchQueue.main.asyncAfter(deadline: .now() + duration) { [weak self] in
            self?.stopAllNotes()
        }
    }
    
    private func stopAllNotes() {
        for (_, oscillator) in oscillators {
            oscillator.stop()
            audioEngine.detach(oscillator)
        }
        oscillators.removeAll()
    }
    
    private func frequencyForNote(_ note: String) -> Double? {
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
        
        // Calculate frequency: f = 440 * 2^((n-69)/12)
        return 440.0 * pow(2.0, Double(midiNote - 69) / 12.0)
    }
}

// Custom oscillator node for generating sine waves
class OscillatorNode: AVAudioNode {
    private let sampleRate: Double = 44100.0
    private var phase: Double = 0.0
    private let frequency: Double
    private var isPlaying = false
    
    init(frequency: Double) {
        self.frequency = frequency
        super.init()
        
        // Install audio tap
        let format = AVAudioFormat(standardFormatWithSampleRate: sampleRate, channels: 1)!
        
        AUAudioUnit.registerSubclass(
            OscillatorAudioUnit.self,
            as: ComponentDescription(
                componentType: kAudioUnitType_Generator,
                componentSubType: 0x6F736369, // 'osci'
                componentManufacturer: 0x44656D6F, // 'Demo'
                componentFlags: 0,
                componentFlagsMask: 0
            ),
            name: "OscillatorAudioUnit",
            version: 1
        )
        
        self.auAudioUnit = try? OscillatorAudioUnit(
            componentDescription: ComponentDescription(
                componentType: kAudioUnitType_Generator,
                componentSubType: 0x6F736369,
                componentManufacturer: 0x44656D6F,
                componentFlags: 0,
                componentFlagsMask: 0
            ),
            options: []
        )
        
        (self.auAudioUnit as? OscillatorAudioUnit)?.frequency = frequency
    }
    
    func start() {
        isPlaying = true
        (self.auAudioUnit as? OscillatorAudioUnit)?.isPlaying = true
    }
    
    func stop() {
        isPlaying = false
        (self.auAudioUnit as? OscillatorAudioUnit)?.isPlaying = false
    }
}

// Simple audio unit for generating sine waves
class OscillatorAudioUnit: AUAudioUnit {
    var frequency: Double = 440.0
    var isPlaying = false
    private var phase: Double = 0.0
    
    override func allocateRenderResources() throws {
        try super.allocateRenderResources()
        
        self.outputBusses[0].shouldAllocateBuffer = true
    }
    
    override var internalRenderBlock: AUInternalRenderBlock {
        return { [weak self] (actionFlags, timestamp, frameCount, outputBusNumber, outputData, realtimeEventListHead, pullInputBlock) in
            guard let self = self,
                  self.isPlaying,
                  let outputBuffer = outputData.pointee.mBuffers.baseAddress else {
                return noErr
            }
            
            let sampleRate = self.outputBusses[0].format.sampleRate
            let phaseIncrement = 2.0 * .pi * self.frequency / sampleRate
            
            for frame in 0..<Int(frameCount) {
                let sample = Float(sin(self.phase)) * 0.5 // Reduced amplitude
                
                // Write to all channels
                for channel in 0..<Int(outputBuffer.pointee.mNumberChannels) {
                    let channelData = outputBuffer.pointee.mData?.assumingMemoryBound(to: Float.self)
                    channelData?[frame + channel * Int(frameCount)] = sample
                }
                
                self.phase += phaseIncrement
                if self.phase > 2.0 * .pi {
                    self.phase -= 2.0 * .pi
                }
            }
            
            return noErr
        }
    }
}