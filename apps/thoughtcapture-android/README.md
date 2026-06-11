# ThoughtCapture (Android)

Voice-first thought assistant for Samsung Galaxy devices and Galaxy Buds. Phase 1 MVP focuses on frictionless capture while driving: earbud gesture → record → transcribe → AI structure → local storage.

## Phase 1 MVP (current)

| Feature | Status |
|---------|--------|
| Foreground recording service | ✅ |
| Galaxy Buds / headset media-button gestures | ✅ (double-tap Play/Pause) |
| Google Speech-to-Text (offline preferred) | ✅ |
| AI structuring (Groq + local fallback) | ✅ |
| Room local database | ✅ |
| Compose home screen (grouped by category) | ✅ |

## Requirements

- Android Studio Ladybug or newer
- JDK 17+
- Samsung Galaxy S25 FE (or any Android 9+ device for basic testing)
- Galaxy Buds with **double-tap set to Play/Pause** in Galaxy Wearable

## Setup

1. Open `apps/thoughtcapture-android` in Android Studio.
2. Add your Groq API key to `gradle.properties` (see `gradle.properties.example`). Without a key, the app uses a simple local keyword fallback.
3. Build and run on a physical device (speech + earbuds require real hardware).

```bash
cd apps/thoughtcapture-android
./gradlew assembleDebug
```

## How capture works

1. **Start**: Double-tap Galaxy Buds (Play/Pause) or tap the mic FAB in the app.
2. **Speak** naturally — partial transcripts stream via Google Speech Services.
3. **Stop**: Double-tap again, tap Stop in the notification, or tap the red FAB.
4. **Process**: Transcript is sent to Groq (or local fallback) for title, summary, category, and suggested actions.
5. **Review**: Home screen lists captures grouped by category (Task, Idea, Reminder, etc.).

## Architecture

```
receiver/MediaButtonReceiver   → double-tap headset events
service/RecordingService     → foreground mic + notification lifecycle
speech/SpeechTranscriber       → session-based SpeechRecognizer
ai/GroqThoughtStructurer       → JSON-structured LLM output
data/local (Room)              → persistent thoughts
ui/home                        → Material 3 Compose home screen
```

## Samsung / Galaxy Buds notes

- There is no public Galaxy Wearable SDK for custom in-app gesture mapping. Configure buds in **Galaxy Wearable → Earbuds → Touch controls → Double tap → Play/Pause**.
- Android routes that as `KEYCODE_MEDIA_PLAY_PAUSE` / `HEADSETHOOK`, which this app listens for.
- Keep the foreground service notification enabled so capture works with the screen off.

## Next phases (not built yet)

- **Phase 2**: Entity extraction, voice review commands, cloud sync, Google Calendar/Tasks
- **Phase 3**: Offline-first, multi-thought parsing, search, Material You polish

## Feedback

This is an iterative build. After testing on your S25 FE + Galaxy Buds, share what works and what to prioritize next.
