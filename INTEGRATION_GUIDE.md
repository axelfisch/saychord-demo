# SayChord Integration Guide

This guide explains how to connect and integrate the SayChord iOS app with the web application.

## Overview

SayChord exists as two separate applications:
- **Web App**: TypeScript/React application running in browsers
- **iOS App**: Native Swift application for iPhone/iPad

Both apps share the same core functionality but run on different platforms.

## Current Integration Options

### 1. File-Based Integration

#### MIDI Export/Import
Both apps can export chord sequences as MIDI files:
- **Web → iOS**: Export MIDI from web app, share via email/cloud, open in iOS app
- **iOS → Web**: Export MIDI from iOS app, upload to web app

#### Audio Files
- Both apps can record audio (WAV format)
- Share recordings between platforms via standard file sharing

### 2. Manual Data Entry
- Chord sequences can be manually entered in either app
- Both use the same French chord notation system

## Future Integration Possibilities

### 1. REST API Integration

Create a shared backend service:

```typescript
// Example API endpoints
POST /api/sequences - Save a chord sequence
GET /api/sequences/:id - Retrieve a sequence
PUT /api/sequences/:id - Update a sequence
DELETE /api/sequences/:id - Delete a sequence
```

### 2. WebSocket Real-Time Sync

Enable real-time collaboration:

```swift
// iOS WebSocket connection
let websocket = URLSessionWebSocketTask(...)
websocket.send(.string(chordSequenceJSON))
```

```typescript
// Web WebSocket connection
const ws = new WebSocket('wss://saychord-api.com/sync')
ws.send(JSON.stringify(chordSequence))
```

### 3. CloudKit/iCloud Integration

For Apple ecosystem integration:
- Store sequences in iCloud
- Automatic sync between iOS devices
- Web app could access via CloudKit JS

### 4. Progressive Web App (PWA)

Convert the web app to a PWA:
- Install on iOS devices from Safari
- Offline functionality
- Push notifications

## Debugging Cross-Platform Issues

### 1. Test Data Format Compatibility

Ensure both apps use the same chord format:

```json
{
  "sequence": ["C", "Am", "F", "G7"],
  "tempo": 120,
  "timeSignature": "4/4"
}
```

### 2. Audio Format Compatibility

- Both apps should use standard formats (WAV, MIDI)
- Test file playback across platforms

### 3. Localization Testing

- Verify French chord names work identically
- Test speech recognition with same phrases

## Development Workflow

### Local Testing Setup

1. Run web app locally:
   ```bash
   cd saychord-demo
   npm run dev
   ```

2. Run iOS app in Xcode

3. Use local network for testing integration:
   - Web app: `http://localhost:5173`
   - iOS app: Configure to connect to local IP

### Debugging Tools

1. **Network Debugging**:
   - Charles Proxy for iOS network traffic
   - Browser DevTools for web app
   
2. **File Inspection**:
   - MIDI file viewers
   - Audio file analyzers

3. **Cross-Platform Testing**:
   - Test on multiple iOS versions
   - Test web app in Safari iOS

## Code Sharing Strategies

### 1. Shared TypeScript/JavaScript Core

Create a shared library for chord parsing:

```bash
# Create shared package
mkdir saychord-core
cd saychord-core
npm init
```

Use in web app directly and compile to Swift-compatible format for iOS.

### 2. Protocol Buffers

Define shared data structures:

```protobuf
message Chord {
  string symbol = 1;
  repeated string notes = 2;
  int32 octave = 3;
}

message Sequence {
  repeated Chord chords = 1;
  int32 tempo = 2;
}
```

### 3. JSON Schema

Define and validate data formats:

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "chord": {
      "type": "string",
      "pattern": "^[A-G][#b]?(m|maj7|m7|7|dim|aug|sus2|sus4)?$"
    }
  }
}
```

## Best Practices

1. **Version Compatibility**:
   - Version your data formats
   - Handle backward compatibility

2. **Error Handling**:
   - Graceful fallbacks for unsupported features
   - Clear error messages for users

3. **Performance**:
   - Optimize file sizes for transfer
   - Cache frequently used data

4. **Security**:
   - Validate all imported data
   - Use HTTPS for any network communication
   - Implement proper authentication for user data

## Next Steps

1. Choose integration approach based on requirements
2. Implement data format validation
3. Add import/export features
4. Test cross-platform workflows
5. Document user-facing integration features