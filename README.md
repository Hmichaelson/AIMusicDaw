# AI Music DAW

A web-based Digital Audio Workstation with AI-powered music generation. Think of it as the "Cursor for Music" - a full-featured DAW IDE with deep AI integration.

![AI Music DAW](https://img.shields.io/badge/React-18-blue) ![TypeScript](https://img.shields.io/badge/TypeScript-5-blue) ![Tone.js](https://img.shields.io/badge/Tone.js-15-green)

## Features

### Core DAW Features
- **Multi-track Timeline**: Create and arrange multiple audio tracks
- **Waveform Visualization**: See your audio clips on the timeline
- **Transport Controls**: Play, pause, stop, loop, and seek
- **Mixer Panel**: Volume, pan, mute, and solo for each track
- **BPM Control**: Set the tempo for your project
- **Audio Import**: Drag and drop audio files (WAV, MP3, OGG, etc.)
- **Keyboard Shortcuts**: Professional DAW-style shortcuts

### AI Features
- **AI Music Generation**: Generate full songs from text prompts using Suno or Udio
- **Stem Separation**: Split audio into vocals, drums, bass, and other using Demucs
- **Import to DAW**: Generated audio imports directly as editable clips

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/AIMusicDaw.git
cd AIMusicDaw

# Install dependencies
npm install

# Start the development server
npm run dev
```

Open http://localhost:3000 in your browser.

### Setting Up AI Services (Optional)

To use AI features, you'll need API keys:

1. **Copy the environment template:**
   ```bash
   cp .env.example .env
   ```

2. **Get your API keys:**
   - **Suno API**: Sign up at [sunoapi.org](https://sunoapi.org) or similar provider
   - **Replicate** (for Demucs): Sign up at [replicate.com](https://replicate.com)

3. **Add keys to `.env`:**
   ```env
   VITE_SUNO_API_KEY=your_suno_api_key
   VITE_REPLICATE_API_KEY=your_replicate_api_key
   ```

## Usage

### Basic Workflow

1. **Create a track**: Click "Add Track" or press `Cmd/Ctrl + T`
2. **Import audio**: Drag and drop an audio file onto the timeline
3. **Play**: Press `Space` to play/pause
4. **Arrange**: Drag clips to move them on the timeline
5. **Mix**: Adjust volume and pan in the mixer panel

### AI Generation

1. Open the **AI Generate** panel in the sidebar
2. Enter a descriptive prompt (e.g., "A chill lo-fi hip hop beat with jazzy piano")
3. Click **Generate Music**
4. Once complete, click **Import** to add the generated audio to your project

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Space` | Play / Pause |
| `Enter` | Stop |
| `Home` | Go to start |
| `End` | Go to end |
| `L` | Toggle loop |
| `+` / `-` | Zoom in / out |
| `Cmd/Ctrl + T` | Add new track |
| `M` | Mute selected track |
| `S` | Solo selected track |
| `Delete` | Delete selected clips |
| `Escape` | Deselect all |
| `?` | Show shortcuts help |

## Architecture

```
src/
├── components/       # Reusable UI components
│   ├── common/       # Modal, Button, etc.
│   └── layout/       # Header, Sidebar
├── features/         # Feature modules
│   ├── timeline/     # Timeline, Track, Clip
│   ├── transport/    # Transport controls
│   ├── mixer/        # Mixer panel
│   └── project/      # Export, Settings
├── services/         # External services
│   ├── audio/        # Tone.js wrapper, recorder, exporter
│   └── ai/           # Suno, Replicate API clients
├── store/            # Zustand state management
├── hooks/            # Custom React hooks
├── utils/            # Utility functions
└── types/            # TypeScript definitions
```

### Tech Stack

- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite
- **Audio Engine**: Tone.js
- **State Management**: Zustand
- **Styling**: TailwindCSS
- **AI Services**: Suno API, Replicate (Demucs)

## Development

```bash
# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linter
npm run lint
```

## API Integration Notes

### Suno API
The integration uses third-party Suno API providers since Suno doesn't offer an official API. Generation typically takes 1-3 minutes depending on duration.

### Demucs (Stem Separation)
Uses Replicate's hosted Demucs model. Note that this requires uploading audio to a public URL first (cloud storage integration needed for production).

## Roadmap

- [ ] Waveform display using wavesurfer.js
- [ ] Audio recording from microphone
- [ ] Undo/redo system
- [ ] Project save/load to cloud
- [ ] More AI providers (Stable Audio, etc.)
- [ ] Virtual instruments (MIDI)
- [ ] Audio effects (reverb, delay, EQ)
- [ ] Collaboration features

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

Apache 2.0 - see [LICENSE](LICENSE) for details.

---

Built with AI assistance using Claude Code.
