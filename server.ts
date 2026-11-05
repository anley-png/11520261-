import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const HOST = '0.0.0.0';

app.use(express.json({ limit: '10mb' }));

// Serve static audio files from public/audio
app.use('/audio', express.static(path.resolve(__dirname, 'public/audio')));
app.use(express.static(path.resolve(__dirname, 'public')));

// Audio cache for fast repeated playback
const ttsCache = new Map<string, Buffer>();

// Helper to obtain a GoogleGenAI instance with the latest env key
const getAI = (): GoogleGenAI | null => {
  const key = process.env.GEMINI_API_KEY;
  if (!key || typeof key !== 'string' || key.trim() === '') {
    return null;
  }
  try {
    return new GoogleGenAI({
      apiKey: key.trim(),
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  } catch {
    return null;
  }
};

// Text-to-speech API endpoint
app.post('/api/tts', async (req, res) => {
  try {
    const { text, id, alt } = req.body;
    if (!text && !id) {
      return res.status(400).json({ error: 'Text or ID is required' });
    }

    const cacheKey = id || text;
    if (ttsCache.has(cacheKey)) {
      res.setHeader('Content-Type', 'audio/wav');
      return res.send(ttsCache.get(cacheKey));
    }

    const ai = getAI();
    if (!ai) {
      return res.status(503).json({ error: 'Gemini API not available, use client voice synthesis', fallback: true });
    }

    // Pronunciation prompt for clear Arabic phonetics
    const promptText = `Pronounce this Arabic clearly and naturally: ${text || alt}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash-lite-tts',
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: promptText,
              speechMetadata: {
                style: 'Clear, cheerful Arabic pronunciation for language learners',
              },
            },
          ],
        },
      ],
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) {
      return res.status(503).json({ error: 'No audio returned, falling back', fallback: true });
    }

    const wavBuffer = Buffer.from(base64Audio, 'base64');
    ttsCache.set(cacheKey, wavBuffer);

    res.setHeader('Content-Type', 'audio/wav');
    res.send(wavBuffer);
  } catch (error: any) {
    // Non-fatal fallback warning (clean response, client uses browser speech synthesis)
    const msg = error?.message || 'TTS generation unavailable';
    res.status(503).json({ error: msg, fallback: true });
  }
});

// Check pronunciation / speech recognition verification
app.post('/api/speech/verify', async (req, res) => {
  try {
    const { targetText, spokenText } = req.body;
    if (!targetText || !spokenText) {
      return res.status(400).json({ error: 'Target and spoken text required' });
    }

    // Direct match check first
    const cleanTarget = targetText.replace(/[\u064B-\u0652]/g, '').trim();
    const cleanSpoken = spokenText.replace(/[\u064B-\u0652]/g, '').trim();

    if (cleanTarget === cleanSpoken || cleanSpoken.includes(cleanTarget) || cleanTarget.includes(cleanSpoken)) {
      return res.json({ correct: true, score: 100, feedback: 'ممتاز! Excellent pronunciation!' });
    }

    const ai = getAI();
    if (ai) {
      try {
        const prompt = `A student is learning Arabic.
Target word/letter: "${targetText}".
What they said: "${spokenText}".
Did they pronounce or identify it reasonably well?
Respond in JSON format: {"correct": boolean, "feedback": "short friendly feedback for child"}`;

        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
          },
        });

        const parsed = JSON.parse(response.text?.trim() || '{}');
        return res.json({
          correct: Boolean(parsed.correct),
          feedback: parsed.feedback || (parsed.correct ? 'احسنت! Well done!' : 'حاول مرة أخرى! Try again!'),
        });
      } catch {
        // Fall back to local check if AI model is busy or rate limited
      }
    }

    // Friendly fallback
    res.json({
      correct: cleanTarget.length > 0 && cleanSpoken.length > 0 && (cleanTarget[0] === cleanSpoken[0]),
      feedback: 'حاول مرة أخرى! Try saying it again!',
    });
  } catch (err: any) {
    res.json({ correct: false, feedback: 'حاول مرة أخرى! Try saying it again!' });
  }
});

// Server status
app.get('/api/status', (_req, res) => {
  res.json({
    status: 'ok',
    hasGemini: !!getAI(),
    cachedAudioCount: ttsCache.size,
  });
});

async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, HOST, () => {
    console.log(`Server running on http://${HOST}:${PORT} (Production: ${isProd})`);
  });
}

startServer();
