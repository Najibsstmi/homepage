# STEAM Theatre beta: physical-device acceptance

Automated Chrome tests use a public still-image camera fixture and a synthetic audio signal. They do **not** verify physical cameras, microphones, browser permissions, real motion, iOS behavior, or teacher suitability. Record device, OS, browser/version, date and pass/fail for each item below. Use HTTPS and the school's consent and privacy procedures.

## Devices

- Android phone: Chrome; test portrait, landscape and Android text-size enlargement.
- iPhone, when available: Safari; test portrait, landscape, iOS text-size enlargement and media permissions.
- Windows laptop: Chrome or Edge; test keyboard-only navigation and camera/microphone device switching.
- Tablet: its normal browser; test both orientations and touch targets.

## Core checks on each device

1. Open EduSim; switch Semua, STEM and STEAM. Open an existing science activity and filter the search by Tingkatan. Open all three theatre studios and return via Back and the studio navigation.
2. Check the preview/waveform and Start, Stop and Retry without scrolling through multiple panels. Open every tab and Insight; check readable enlarged text, 44px controls, focus indication, no horizontal overflow, and that content obscured by the keyboard can be reached by scrolling.
3. Deny camera/microphone permission; confirm the error identifies the issue and retry works after changing site permission. Check unavailable or busy devices and a failed model request if feasible. No device should start without a user action.
4. For each camera studio, check one face under adequate light; test dark light, face outside the frame and two faces. Calibrate neutral for two seconds, move eyebrow/eye/mouth/jaw, toggle the overlay and complete a practice. Tracking gaps must yield insufficient-data feedback rather than a confident result.
5. In transitions, try guided, challenge and free modes, edit stage timing, check countdown, pause/resume, stop, automatic completion and retry. Compare cue and stage times to observation; verify missing or poor tracking suppresses metrics.
6. Calibrate the microphone in a quiet space. Try silence, comfortable voiced sounds, speech and pauses; inspect waveform, pitch and signal levels. Test a noisy space and clipping. Confirm silence has no fabricated pitch, dBFS is not labelled SPL, and articulation is reviewed by listening rather than scored.
7. Optionally record, play, delete, and confirm playback is no longer available. Compare two attempts; stop the device, switch studios, use Back and reload. Check OS camera/microphone indicators go out. Check that interrupted recordings are discarded and no raw media survives reload.
8. After first successful online load, test offline access and model loading. Browser cache retention and prior asset downloads determine offline availability; a fresh install needs connectivity.

## Teacher and technical review before release

A theatre teacher must validate each exercise, movement target, reference, threshold, feedback interpretation and safety instruction against the classroom context and KSSM Seni Teater SSeM Tingkatan 1 SP 1.1.1. These are proposed formative activities, not complete curriculum coverage or PBD levels. There are no teacher-approved demonstrations yet. Brightness and positioning are heuristics, not calibrated tracking confidence; results depend on the individual and device. Head orientation, calibrated SPL and automatic pronunciation assessment are not provided.

To add approved local reference media later, populate an exercise's `referenceMedia` array in `src/theatre/exercises.ts` with unique IDs, `kind: 'video'` or `'image'`, a same-origin absolute `src`, a title, and image `alt` or optional video `captionsSrc` (local WebVTT). The studio never auto-plays a reference. Keep consent and access requirements for any future recordings separate from this local placeholder system.
