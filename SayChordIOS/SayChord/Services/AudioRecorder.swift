import AVFoundation

class AudioRecorder: NSObject {
    private var audioRecorder: AVAudioRecorder?
    private var recordingURL: URL?
    
    func startRecording() async throws {
        // Configure audio session
        let audioSession = AVAudioSession.sharedInstance()
        try audioSession.setCategory(.playAndRecord, mode: .default)
        try audioSession.setActive(true)
        
        // Create recording URL
        let tempDir = FileManager.default.temporaryDirectory
        let fileName = "SayChord_\(Date().timeIntervalSince1970).wav"
        recordingURL = tempDir.appendingPathComponent(fileName)
        
        guard let url = recordingURL else {
            throw RecordingError.invalidURL
        }
        
        // Configure recorder settings
        let settings: [String: Any] = [
            AVFormatIDKey: Int(kAudioFormatLinearPCM),
            AVSampleRateKey: 44100.0,
            AVNumberOfChannelsKey: 2,
            AVEncoderAudioQualityKey: AVAudioQuality.high.rawValue,
            AVLinearPCMBitDepthKey: 16,
            AVLinearPCMIsFloatKey: false,
            AVLinearPCMIsBigEndianKey: false
        ]
        
        // Create and start recorder
        audioRecorder = try AVAudioRecorder(url: url, settings: settings)
        audioRecorder?.delegate = self
        audioRecorder?.prepareToRecord()
        audioRecorder?.record()
    }
    
    func stopRecording() async throws -> URL {
        guard let recorder = audioRecorder, let url = recordingURL else {
            throw RecordingError.notRecording
        }
        
        recorder.stop()
        
        // Reset audio session
        try AVAudioSession.sharedInstance().setActive(false)
        
        audioRecorder = nil
        recordingURL = nil
        
        return url
    }
    
    var isRecording: Bool {
        audioRecorder?.isRecording ?? false
    }
}

extension AudioRecorder: AVAudioRecorderDelegate {
    func audioRecorderDidFinishRecording(_ recorder: AVAudioRecorder, successfully flag: Bool) {
        if !flag {
            print("Recording failed")
        }
    }
    
    func audioRecorderEncodeErrorDidOccur(_ recorder: AVAudioRecorder, error: Error?) {
        if let error = error {
            print("Recording encode error: \(error)")
        }
    }
}

enum RecordingError: LocalizedError {
    case invalidURL
    case notRecording
    
    var errorDescription: String? {
        switch self {
        case .invalidURL:
            return "Invalid recording URL"
        case .notRecording:
            return "No active recording"
        }
    }
}