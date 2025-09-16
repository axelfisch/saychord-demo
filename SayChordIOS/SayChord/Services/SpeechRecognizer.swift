import Speech
import Combine
import AVFoundation

enum SpeechRecognitionState {
    case idle
    case listening
    case processing
    case error(String)
}

class SpeechRecognizer: NSObject {
    private let speechRecognizer = SFSpeechRecognizer(locale: Locale(identifier: "fr-FR"))
    private var recognitionRequest: SFSpeechAudioBufferRecognitionRequest?
    private var recognitionTask: SFSpeechRecognitionTask?
    private let audioEngine = AVAudioEngine()
    
    private let recognizedTextSubject = PassthroughSubject<String, Never>()
    private let stateSubject = CurrentValueSubject<SpeechRecognitionState, Never>(.idle)
    
    var recognizedTextPublisher: AnyPublisher<String, Never> {
        recognizedTextSubject.eraseToAnyPublisher()
    }
    
    var statePublisher: AnyPublisher<SpeechRecognitionState, Never> {
        stateSubject.eraseToAnyPublisher()
    }
    
    override init() {
        super.init()
        speechRecognizer?.delegate = self
    }
    
    func requestPermissions() async -> Bool {
        let speechStatus = await withCheckedContinuation { continuation in
            SFSpeechRecognizer.requestAuthorization { status in
                continuation.resume(returning: status == .authorized)
            }
        }
        
        let audioStatus = await withCheckedContinuation { continuation in
            AVAudioSession.sharedInstance().requestRecordPermission { granted in
                continuation.resume(returning: granted)
            }
        }
        
        return speechStatus && audioStatus
    }
    
    func startListening() async throws {
        // Cancel any existing task
        if recognitionTask != nil {
            recognitionTask?.cancel()
            recognitionTask = nil
        }
        
        // Configure audio session
        let audioSession = AVAudioSession.sharedInstance()
        try audioSession.setCategory(.record, mode: .measurement, options: .duckOthers)
        try audioSession.setActive(true, options: .notifyOthersOnDeactivation)
        
        recognitionRequest = SFSpeechAudioBufferRecognitionRequest()
        
        let inputNode = audioEngine.inputNode
        
        guard let recognitionRequest = recognitionRequest else {
            throw SpeechError.requestCreationFailed
        }
        
        guard let speechRecognizer = speechRecognizer, speechRecognizer.isAvailable else {
            throw SpeechError.recognizerNotAvailable
        }
        
        recognitionRequest.shouldReportPartialResults = false
        recognitionRequest.requiresOnDeviceRecognition = false
        
        stateSubject.send(.listening)
        
        recognitionTask = speechRecognizer.recognitionTask(with: recognitionRequest) { [weak self] result, error in
            var isFinal = false
            
            if let result = result {
                let transcript = result.bestTranscription.formattedString
                isFinal = result.isFinal
                
                if isFinal {
                    self?.stateSubject.send(.processing)
                    self?.recognizedTextSubject.send(transcript)
                }
            }
            
            if error != nil || isFinal {
                self?.audioEngine.stop()
                inputNode.removeTap(onBus: 0)
                
                self?.recognitionRequest = nil
                self?.recognitionTask = nil
                
                if let error = error {
                    self?.stateSubject.send(.error(error.localizedDescription))
                } else {
                    self?.stateSubject.send(.idle)
                }
            }
        }
        
        let recordingFormat = inputNode.outputFormat(forBus: 0)
        inputNode.installTap(onBus: 0, bufferSize: 1024, format: recordingFormat) { buffer, _ in
            self.recognitionRequest?.append(buffer)
        }
        
        audioEngine.prepare()
        try audioEngine.start()
    }
    
    func stopListening() {
        audioEngine.stop()
        recognitionRequest?.endAudio()
        recognitionTask?.cancel()
        recognitionTask = nil
        stateSubject.send(.idle)
    }
}

extension SpeechRecognizer: SFSpeechRecognizerDelegate {
    func speechRecognizer(_ speechRecognizer: SFSpeechRecognizer, availabilityDidChange available: Bool) {
        if !available {
            stateSubject.send(.error("La reconnaissance vocale n'est pas disponible"))
        }
    }
}

enum SpeechError: LocalizedError {
    case requestCreationFailed
    case recognizerNotAvailable
    
    var errorDescription: String? {
        switch self {
        case .requestCreationFailed:
            return "Impossible de créer la demande de reconnaissance"
        case .recognizerNotAvailable:
            return "La reconnaissance vocale n'est pas disponible"
        }
    }
}