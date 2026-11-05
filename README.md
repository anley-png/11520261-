# Arabic Letter Island 🏝️🐱

A chart-topping educational game crafted for the Google Play Store and Web that teaches non-Arabic speakers (children and adults) how to recognize, pronounce, trace, write, and build Arabic letters and vocabulary words alongside Mishmish the Cat!

## Play Store #1 Features

### 1. ✍️ Finger & Stylus Tracing Studio (`✍️ Trace`)
- Canvas drawing engine with real-time stroke coverage calculation.
- Guideline paths for all 28 Arabic letters in Isolated, Initial, Medial, and Final forms.
- Glowing brush particle trails, baseline reference lines, stroke accuracy meter (0-100%), and victory celebrations when completing letters.

### 2. 🎈 Balloon Pop Arcade (`🎈 Balloons`)
- Fast-paced reflexive arcade game where colorful balloons float upward carrying Arabic letters.
- Mishmish announces the target letter in authentic Arabic with voice playback.
- Pop matching balloons for points, multiplier combos (🔥 2x, 3x), 30-second ticking clock, and personal high score tracking.

### 3. 🐱 Interactive Mascot: Mishmish the Cat
- Expressive SVG animated mascot with eye blinks, ear wiggles, mouth speech sync, and happy cheers.
- Tap Mishmish anytime to hear friendly Arabic greetings ("مرحباً!", "أهلاً وسهلاً!", "أنت بطل!").

### 4. 🎙️ AI Voice & Microphone Practice
- Pre-recorded clips (`public/audio/<id>.mp3`) are generated with **SILMA TTS V1** (open Arabic/English voice-cloning model by SILMA AI) — see *Regenerating audio* below.
- Live fallback for any clip that is missing: Gemini TTS (`gemini-3.8-flash-lite-tts`) with instant audio caching.
- Fallback cascade to browser speech synthesis and offline phonetics.
- Microphone practice button ("🎙️ Speak") allowing learners to speak Arabic sounds and words with real-time feedback and star rewards.

### 5. 🏝️ Customizable Island Worlds & Builder
- Earn stars across games to unlock 4 distinct island biomes:
  - 🏝️ **Tropical Palm Oasis**
  - 🏜️ **Golden Desert Dunes**
  - 🌌 **Starlight Night Island**
  - 🏰 **Sultan's Oasis Palace**
- Words built in the word games sprout into living items across the player's island.

### 6. 🔥 Daily Learning Streak & 🏆 Trophy Shelf
- Automatic daily learning streak counter (🔥 1 Day, 2 Days, etc.).
- 8 collectible achievement badges (Alif Explorer, Calligrapher, Island Settler, Balloon Ace, Word Wizard, Daily Champion, Constellation Master, Mishmish Best Friend).

### 7. 📖 Complete Core Learning Rooms (Preserved & Enhanced)
- **🔤 Letters Room**: 28 letters with handwriting animation, pronunciation guide, and sound replay.
- **🧩 Forms Room**: 4 positional shapes with locked shy non-connectors, "Shape-shift all", and 7 vowel variants.
- **📖 Words Room**: 115 vocabulary words with 3 interactive modes:
  - **▶ Watch**: Animated sequential spelling with color highlighting and shy-letter hints.
  - **🧱 Build it**: RTL tile assembly with distractor challenges.
  - **🔧 Fix it**: Detective puzzle identifying corrupted letters.
- **🎯 Toss Mini-Game**: Football position matching with mistake-weighted practice.
- **Wellness**: 10-minute stretch break notification for young learners.

## Development

```bash
# Run full-stack dev server (port 3000)
npm run dev

# Build production bundle
npm run build

# Start production server
npm run start
```

## Regenerating audio with SILMA TTS V1

All 542 letter/sound/word clips come from `src/data/manifestWords.ts`. `tools/generate_audio.py` rebuilds them with [SILMA TTS V1](https://huggingface.co/silma-ai/silma-tts):

```bash
sudo apt install ffmpeg
pip install silma-tts

# bundled SILMA reference voice
python tools/generate_audio.py --out public/audio --force

# or clone your own voice (recording + exact transcript)
python tools/generate_audio.py --ref ref/voice.wav --ref-text "exact words spoken" --out public/audio --force

# only some clips
python tools/generate_audio.py --ids w001 s02_01 --out public/audio --force
```

Notes: a GPU is strongly recommended (CPU works but is slow). Bare letters are spoken as their names (ب → باء); vowelled syllables and words use the diacritics in the manifest. Use `--speed` (default 0.85) to slow or speed the voice. A native Arabic speaker should review the output (see `TEST_CHECKLIST.md`).

The **Generate audio (SILMA TTS V1)** GitHub Action runs the same script and uploads the clips as an artifact, or commits them to `public/audio` if you tick *commit*.
