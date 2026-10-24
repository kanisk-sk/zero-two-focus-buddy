# Zero Two Focus Buddy

A personal anime desktop companion for Apple Silicon macOS and Windows. A first functional prototype, with generated character artwork based on the supplied Zero Two reference.

## Run

Requires Node.js 22 or newer.

```sh
npm ci
npm start
```

Click the character to chat; drag her to reposition. Use the tray/menu bar icon to show, hide, pause, or quit. `Cmd/Ctrl+Shift+Space` opens chat. Transparent areas pass clicks to applications below. The quiet window fits around the character; speech bubbles hide after a few seconds, and chat appears only when opened. Near the top edge, conversation appears below the character. A hover pencil opens compact Quick Chat; the gear reveals settings. Escape closes chat, and switching away closes it when no draft is typed.

## Available now

- Desk mode with a table and chair: `work writing`, `work reading`, or `work laptop`. `focus 25` uses the last selected desk activity; `stop` returns to standing. These scenes have subtle alternate frames, with short laptop blinks.


- Frameless, transparent, always-on-top companion window. Drag limits follow the character itself so she can reach the top and other display edges.
- Twenty expressions, twelve action poses, and eight-frame walk and climb cycles. Leftward movement mirrors the artwork. Walk playback follows actual screen distance; climbing uses reach/grip/pull timing. Stretching now raises, holds, leans, and releases over four seconds.
- The Gallery button and tray menu show the poses and expressions side by side, with play/pause controls.
- Sitting, resting, and sleeping have distinct drawings. Dragging changes the pose; releasing reacts with a smug expression.
- Climbing attaches to the nearest screen edge, moves upward, and finishes hanging. Opening chat brings the whole panel back on screen. It does not read or climb other app windows.
- App launcher: type `apps`, `open Chrome`, `open Calculator`, or `launch VS Code`, or pick an installed app from the chat panel. macOS and Windows use separate fixed app lists; unsupported names and arbitrary commands are rejected.
- Typed commands: `focus 25`, `stop`, `walk`, `climb`, `hang`, `rest`, `jump`, `sit`, `sleep`, `wake`, `stretch`, `wave`, `dance`, `look happy`, `help`, `search for …`.
- Focus countdown, water every 45 minutes, stretch every 60 minutes, quiet mode, pause, adjustable character size.
- Local settings and focus deadline persist. Wellness timers restart when the app restarts. Pause suspends wellness nudges and autonomous movement; an active focus countdown continues.
- Search opens the default browser; it does not generate answers or read browsing history.

## Next milestones

1. Refine sprite frame consistency, add fuller rest/sleep transitions, and expand window-aware interaction.
2. Graceful app closing with confirmation and more configurable app shortcuts.
3. Push-to-talk voice input and optional conversation provider.
4. Email connection with explicit account permissions and notification filters.
5. Distraction detection, configurable intervals, quiet hours, fullscreen behavior, and signed installers.

App opening is supported through a fixed list of installed apps. App closing, microphone, email, general notification access, and unrestricted computer control are not implemented in this version. There is no background AI service or API key requirement.

## Checks and builds

```sh
npm test
npm run check
npm run dist
```

Build macOS installers on macOS (ARM64 for M4); build Windows installers on Windows. Unsigned development builds may trigger OS installation prompts. Windows behavior must be tested on Windows before claiming verified support.

Character rights belong to their respective owners. This is a personal fan project, with no ownership claim over Zero Two or DARLING in the FRANXX.
