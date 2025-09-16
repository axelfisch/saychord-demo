# SayChord iOS App

SayChord is an iOS application for voice dictation of musical chords in French. It allows musicians to dictate chords, hear them played with a synthesized piano sound, create sequences and loops, and export their creations.

## Features

- **Voice Recognition**: French speech recognition for chord names
- **Chord Parsing**: Converts French chord names (e.g., "Do majeur", "Ré mineur 7") to musical notation
- **Audio Synthesis**: Real-time FM synthesis for playing chords
- **Sequencer**: Create and play chord sequences with adjustable tempo
- **Loop Playback**: Loop sequences for practice
- **MIDI Export**: Export sequences as MIDI files
- **Audio Recording**: Record performances as WAV files

## Requirements

- iOS 17.0+
- Xcode 15.0+
- Swift 5.9+

## Setup and Building

1. Open the project in Xcode:
   ```bash
   cd /workspace/SayChordIOS
   open SayChord.xcodeproj
   ```

2. Select your development team in the project settings

3. Build and run on a physical device (recommended for speech recognition) or simulator

## Debugging

### Debug on Physical Device

1. Connect your iPhone/iPad via USB
2. Select your device in Xcode's device selector
3. Click the Run button or press Cmd+R
4. Grant microphone and speech recognition permissions when prompted

### Debug with Xcode

1. Set breakpoints by clicking on line numbers in the source code
2. Use the Debug navigator to inspect variables and call stack
3. Use the Console to view print statements and debug output

### Common Issues

1. **Speech Recognition Not Working**: 
   - Ensure you've granted microphone and speech recognition permissions
   - Check that your device language includes French
   - Test on a physical device for best results

2. **Audio Not Playing**:
   - Check device volume
   - Ensure audio session is properly configured
   - Check console for audio engine errors

3. **Build Errors**:
   - Clean build folder (Shift+Cmd+K)
   - Delete derived data
   - Ensure you're using Xcode 15+

## Architecture

The app follows MVVM architecture:

- **Models**: `ChordParser` handles French to chord symbol conversion
- **Views**: SwiftUI views for the user interface
- **ViewModels**: `ChordViewModel` manages app state and business logic
- **Services**: 
  - `SpeechRecognizer`: Handles speech recognition
  - `AudioSynthesizer`: FM synthesis for chord playback
  - `ChordSequencer`: Manages sequence playback
  - `MIDIExporter`: Exports sequences as MIDI files
  - `AudioRecorder`: Records audio to WAV files

## Testing

Run the app and test the following:

1. **Text Input**: Type "Do majeur" and tap play
2. **Voice Input**: Tap "Dicter (FR)" and say "Sol septième"
3. **Sequencer**: Build a sequence and test playback/looping
4. **Export**: Test MIDI export and audio recording

## Connecting with Web App

The iOS app mirrors the functionality of the web app. To share data between them:

1. **Via MIDI Files**: Export from one platform and import to the other
2. **Via Cloud Storage**: Save exported files to iCloud/Dropbox
3. **Future Enhancement**: Add network sync capabilities

## License

MIT