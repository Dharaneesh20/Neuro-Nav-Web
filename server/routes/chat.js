const express = require('express');
const axios = require('axios');
const authenticate = require('../middleware/auth');

const router = express.Router();

const GEMINI_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-04-17:generateContent';

// POST /api/chat
router.post('/', authenticate, async (req, res) => {
  const { message, userName } = req.body;

  if (!message || !message.trim()) {
    return res.status(400).json({ error: 'Message is required' });
  }

  if (!process.env.GEMINI_API_KEY) {
    return res.status(503).json({ error: 'AI service not configured' });
  }

  try {
    const prompt = `You are a warm, supportive AI assistant called NeuroNav Assistant, designed for people with autism and sensory sensitivities.
User's name: ${userName || 'Friend'}

User message: "${message}"

Respond in a calm, empathetic, and practical way. Use **Markdown formatting** in your reply:
- Use **bold** for key terms or tips
- Use bullet lists for multiple suggestions
- Use ## or ### headings only when the answer has clear sections
- Keep the response concise (3-6 sentences or equivalent bullets)

Focus on:
- Anxiety management techniques
- Sensory support strategies  
- Actionable, easy-to-follow advice
- Validating the user's feelings first`;

    const response = await axios.post(
      GEMINI_URL,
      {
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 300,
        },
      },
      {
        params: { key: process.env.GEMINI_API_KEY },
        headers: { 'Content-Type': 'application/json' },
        timeout: 15000,
      }
    );

    const text =
      response.data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "I'm here to help! Could you tell me more about what you're experiencing?";

    res.json({ reply: text });
  } catch (err) {
    console.error('Chat route error:', err?.response?.data || err.message);
    const status = err?.response?.status;
    if (status === 400) {
      return res.status(400).json({ error: 'Invalid request to AI service' });
    }
    if (status === 429) {
      return res.status(429).json({ error: 'AI service rate limited — please wait a moment' });
    }
    res.status(502).json({ error: 'AI service temporarily unavailable' });
  }
});

module.exports = router;
