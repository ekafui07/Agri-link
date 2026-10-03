import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Initialize Gemini API client lazily/safely
  const getAiClient = () => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is missing.');
    }
    return new GoogleGenAI({ apiKey });
  };

  // API Endpoint: AI Agronomy Advisor
  app.post('/api/ai-advisor', async (req, res) => {
    try {
      const { prompt, fieldContext, cropContext, goal } = req.body;

      if (!prompt) {
        return res.status(400).json({ error: 'Prompt is required' });
      }

      const ai = getAiClient();

      const systemInstruction = `You are AgriPulse AI, an expert digital agronomy and farm management advisor.
You provide clear, practical, scientific recommendations for farmers and farm managers.
Your response should be structured, concise, and cover:
1. Direct Recommendation
2. Soil & Nutrient Impact (e.g. Nitrogen, pH, Organic Matter)
3. Crop Rotation & Pest Management Advice
4. Actionable Next Steps (2-3 bullet points)

Format your answer cleanly with markdown headings and bullet points. Keep it encouraging and practical.`;

      const userMessage = `
User Query: "${prompt}"
${goal ? `Primary Farm Goal: ${goal}` : ''}
${fieldContext ? `Field Context: ${JSON.stringify(fieldContext)}` : ''}
${cropContext ? `Crop Context: ${JSON.stringify(cropContext)}` : ''}
`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
          { role: 'user', parts: [{ text: `${systemInstruction}\n\n${userMessage}` }] }
        ]
      });

      const text = response.text || 'No response generated from Agronomy AI.';
      return res.json({ advice: text });
    } catch (error: any) {
      console.error('AI Advisor error:', error);
      return res.status(500).json({
        error: error?.message || 'Failed to generate AI agronomic advice.'
      });
    }
  });

  // Vite Middleware in development mode
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`AgriPulse Farm Manager running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
