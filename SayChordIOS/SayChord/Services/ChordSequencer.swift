import Foundation
import Combine

class ChordSequencer {
    @Published private(set) var currentIndex: Int = -1
    @Published private(set) var isPlaying: Bool = false
    
    var currentIndexPublisher: AnyPublisher<Int, Never> {
        $currentIndex.eraseToAnyPublisher()
    }
    
    var isPlayingPublisher: AnyPublisher<Bool, Never> {
        $isPlaying.eraseToAnyPublisher()
    }
    
    var tempo: Int = 120 {
        didSet {
            updateTimerInterval()
        }
    }
    
    var isLooping: Bool = false
    
    private var sequence: [String] = []
    private var timer: Timer?
    private var timerInterval: TimeInterval {
        60.0 / Double(tempo)
    }
    
    func play(sequence: [String]) {
        guard !sequence.isEmpty else { return }
        
        self.sequence = sequence
        currentIndex = -1
        isPlaying = true
        
        // Start immediately with first chord
        playNext()
        
        // Set up timer for subsequent chords
        timer = Timer.scheduledTimer(withTimeInterval: timerInterval, repeats: true) { [weak self] _ in
            self?.playNext()
        }
    }
    
    func stop() {
        timer?.invalidate()
        timer = nil
        isPlaying = false
        currentIndex = -1
    }
    
    private func playNext() {
        guard !sequence.isEmpty else {
            stop()
            return
        }
        
        currentIndex += 1
        
        if currentIndex >= sequence.count {
            if isLooping {
                currentIndex = 0
            } else {
                stop()
                return
            }
        }
        
        // The view model will observe currentIndex changes and play the chord
    }
    
    private func updateTimerInterval() {
        guard isPlaying else { return }
        
        // Restart timer with new interval
        timer?.invalidate()
        timer = Timer.scheduledTimer(withTimeInterval: timerInterval, repeats: true) { [weak self] _ in
            self?.playNext()
        }
    }
}