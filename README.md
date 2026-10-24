# Zero Two Focus Buddy

A personal anime desktop companion for Apple Silicon macOS and Windows. A first functional prototype, with generated character artwork based on the supplied Zero Two reference.

## Run

Requires Node.js 22 or newer.

```sh
npm ci
npm start
```

Click the character to chat; drag her to reposition. Use the tray/menu bar icon to show, hide, pause, or quit. `Cmd/Ctrl+Shift+Space` opens chat. Transparent areas pass clicks to applications below.

## Available now

- Frameless, transparent, always-on-top companion window.
- Idle, walk, jump, sit, and sleep motion states using a painted character image (not final frame-by-frame sprites).
- Typed commands: `focus 25`, `stop`, `walk`, `jump`, `sit`, `sleep`, `wake`, `help`, `search for …`.
- Focus countdown, water every 45 minutes, stretch every 60 minutes, quiet mode, pause, adjustable character size.
- Local settings and focus deadline persist. Wellness timers restart when the app restarts. Pause suspends wellness nudges and autonomous movement; an active focus countdown continues.
- Search opens the default browser; it does not generate answers or read browsing history.

## Next milestones

1. Polished transparent sprite sheet matching the reference, with distinct frames and expressions.
2. Allowlisted app launching and graceful app close confirmation.
3. Push-to-talk voice input and optional conversation provider.
4. Email connection with explicit account permissions and notification filters.
5. Distraction detection, configurable intervals, quiet hours, fullscreen behavior, and signed installers.

No microphone, email, general notification access, or unrestricted computer control is implemented in this version. There is no background AI service or API key requirement.

## Checks and builds

```sh
npm test
npm run check
npm run dist
```

Build macOS installers on macOS (ARM64 for M4); build Windows installers on Windows. Unsigned development builds may trigger OS installation prompts. Windows behavior must be tested on Windows before claiming verified support.

Character rights belong to their respective owners. This is a personal fan project, with no ownership claim over Zero Two or DARLING in the FRANXX.
