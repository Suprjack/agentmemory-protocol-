# 📤 Export Instructions - Pitch Deck

**Source:** `demo/pitch-slides.md` (Marp Markdown)  
**Target:** PDF + MP4 video

---

## OPTION 1: Marp CLI (Recommended for PDF)

### Install Marp
```bash
npm install -g @marp-team/marp-cli
```

### Export PDF
```bash
cd agentmemory-protocol/demo
marp pitch-slides.md --pdf --allow-local-files
# Output: pitch-slides.pdf
```

### Export HTML
```bash
marp pitch-slides.md --html --allow-local-files
# Output: pitch-slides.html
```

### Export PPTX (PowerPoint)
```bash
marp pitch-slides.md --pptx --allow-local-files
# Output: pitch-slides.pptx
```

---

## OPTION 2: Marp Web (No Install)

1. Go to: https://web.marp.app
2. Copy/paste content of `pitch-slides.md`
3. Click "Export" button
4. Choose format: PDF, PPTX, or HTML
5. Download

---

## OPTION 3: Google Slides (Manual, Most Control)

### Step 1: Create Presentation
1. Go to: https://slides.google.com
2. New Presentation
3. Choose "Pitch" template

### Step 2: Build Slides
Use `SLIDE-BUILDER-INSTRUCTIONS.md` as guide:
- 25 slides total
- Copy text from `pitch-slides.md`
- Insert images from `screenshots/`
- Insert logo from `../assets/logo.png`

### Step 3: Export
- File → Download → PDF
- File → Download → PPTX (if need PowerPoint)

---

## VOICEOVER GENERATION

### Option A: ElevenLabs (High Quality)

1. Go to: https://elevenlabs.io
2. Sign up (free tier: 10K chars)
3. Choose voice: "Adam" or "Antoni"
4. Copy script from `DEMO-PITCH-DECK.md` (voiceover sections)
5. Generate → Download MP3
6. Save as: `demo/voiceover.mp3`

**Script Length:** ~4,000 characters (fits free tier)

### Option B: Google TTS (Free, Lower Quality)

```bash
# Install gTTS
pip install gtts

# Generate voiceover
cd agentmemory-protocol/demo
python3 << 'EOF'
from gtts import gTTS

script = """
AgentMemory Protocol. Trust infrastructure for AI agents on Solana...
[full script here]
"""

tts = gTTS(text=script, lang='en', slow=False)
tts.save('voiceover.mp3')
EOF
```

### Option C: macOS say (Built-in)

```bash
cd agentmemory-protocol/demo
say -v Alex -f voiceover-script.txt -o voiceover.aiff
# Convert to MP3
ffmpeg -i voiceover.aiff voiceover.mp3
```

---

## VIDEO CREATION (Slides + Voice)

### Option A: Kapwing (Easiest, Web-based)

1. Go to: https://kapwing.com
2. Create → Video
3. Upload slides:
   - Export slides as images (1920x1080 PNG)
   - Or upload PDF (Kapwing converts automatically)
4. Upload `voiceover.mp3`
5. Sync slides with voice (drag timeline)
6. Export as MP4 (1080p)

**Time:** ~30 minutes  
**Free Tier:** Up to 7 min video

### Option B: Google Slides Native

1. Open Google Slides presentation
2. Present → Record
3. Upload `voiceover.mp3` OR record live
4. Sync with slides (auto-advance timing)
5. File → Download → MP4

**Limitation:** Audio quality may be compressed

### Option C: ffmpeg (Command Line, Full Control)

```bash
cd agentmemory-protocol/demo

# Export slides as images first (from Google Slides)
# Name them: slide-001.png, slide-002.png, etc.

# Create video from images + audio
ffmpeg -framerate 1/10 -i slide-%03d.png -i voiceover.mp3 \
  -c:v libx264 -c:a aac -pix_fmt yuv420p \
  -shortest agentmemory-demo.mp4
```

**Note:** `-framerate 1/10` = 10 seconds per slide (adjust as needed)

---

## FINAL DELIVERABLES

### Required for Submission:
- [ ] `agentmemory-demo.mp4` (4-5 min video)
- [ ] `pitch-deck.pdf` (slides as PDF backup)
- [ ] `voiceover.mp3` (separate audio file)

### Optional:
- [ ] `pitch-slides.pptx` (editable PowerPoint)
- [ ] `pitch-slides.html` (web version)
- [ ] Individual PNG slides (for documents)

---

## QUALITY CHECKLIST

### Video Quality:
- [ ] Resolution: 1080p (1920x1080)
- [ ] Frame rate: 30fps or 60fps
- [ ] Audio: Clear, no background noise
- [ ] Duration: 4-5 minutes
- [ ] File size: < 500MB (for easy upload)

### Content Quality:
- [ ] All screenshots visible
- [ ] Logo on title slide
- [ ] Text readable (24pt minimum)
- [ ] Colors consistent (Solana purple/teal)
- [ ] No typos
- [ ] URLs accurate

### Voiceover Quality:
- [ ] Clear pronunciation
- [ ] Normal pace (not rushed)
- [ ] Emphasis on key stats (Program ID, metrics)
- [ ] Total duration: 4-5 minutes

---

## UPLOAD CHECKLIST

### YouTube (for Submission Link):
1. Create YouTube account (if needed)
2. Upload `agentmemory-demo.mp4`
3. Title: "AgentMemory Protocol - Colosseum Hackathon Demo"
4. Description: (copy from HACKATHON-FINAL-SUBMISSION.md)
5. Tags: Solana, AI, Agents, Hackathon, Blockchain
6. Visibility: **Unlisted** (not public, but shareable)
7. Copy link for submission form

### Alternative Hosts:
- **Vimeo:** Better quality, professional
- **Google Drive:** Simple, reliable
- **Loom:** Quick, easy embed

---

## TIMELINE ESTIMATE

**Total Time:** 4-6 hours

| Task | Time | Priority |
|------|------|----------|
| Build slides (Google Slides) | 2-3h | HIGH |
| Generate voiceover (ElevenLabs) | 1h | HIGH |
| Combine into video (Kapwing) | 30min | HIGH |
| Export PDF backup | 15min | MEDIUM |
| Upload to YouTube | 30min | HIGH |
| Test all links | 30min | HIGH |

**Recommended:** Day 8 (tomorrow), full sprint

---

## TROUBLESHOOTING

### Issue: Images not showing in Marp
**Solution:** Use `--allow-local-files` flag

### Issue: Voiceover doesn't sync with slides
**Solution:** Use Kapwing timeline editor (drag to adjust)

### Issue: Video too large (>500MB)
**Solution:** Re-export with lower bitrate or resolution (720p)

### Issue: YouTube processing forever
**Solution:** Wait 10-30 min, or try re-upload

### Issue: Audio quality poor
**Solution:** Use ElevenLabs instead of gTTS

---

## FINAL CHECK BEFORE SUBMISSION

- [ ] Video plays correctly (no glitches)
- [ ] Audio syncs with slides
- [ ] All screenshots visible
- [ ] Program ID readable
- [ ] URLs correct
- [ ] YouTube link works (test in incognito)
- [ ] PDF backup ready
- [ ] File names clear (no spaces, underscores OK)

---

**Ready to export!** Follow Option 1 (Marp CLI) or Option 3 (Google Slides) 🎬
