const axios = require('axios');

const geminiClient = axios.create({
  baseURL: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent',
  params: {
    key: process.env.GEMINI_API_KEY,
  },
});

const analyzeSensoryEnvironment = async (environmentData) => {
  try {
    const prompt = `
      Analyze the following environmental data for a person with autism and provide a calm score (0-100) and recommendations:
      
      Environmental Data:
      - Noise Level (dB): ${environmentData.noiseLevel || 'unknown'}
      - Light Intensity (%): ${environmentData.lightIntensity || 'unknown'}
      - Crowding Level (1-10): ${environmentData.crowdingLevel || 'unknown'}
      - Temperature (°C): ${environmentData.temperature || 'unknown'}
      - Odor Level (1-10): ${environmentData.odorLevel || 'unknown'}
      - User Sensory Triggers: ${environmentData.userTriggers || 'none specified'}
      
      Please provide:
      1. A calm score from 0-100 (100 = perfect calm environment, 0 = highly stressful)
      2. Key stressors identified
      3. Specific recommendations for calming the environment
      
      Format your response as JSON with keys: calmScore, stressors (array), recommendations (array)
    `;

    const response = await geminiClient.post('', {
      contents: [
        {
          parts: [{ text: prompt }],
        },
      ],
    });

    const content = response.data.candidates[0].content.parts[0].text;
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }

    return {
      calmScore: 50,
      stressors: [],
      recommendations: ['Unable to fully analyze environment'],
    };
  } catch (error) {
    console.error('Gemini API error:', error.message);
    return {
      calmScore: 50,
      stressors: [],
      recommendations: ['API temporarily unavailable'],
    };
  }
};

module.exports = { analyzeSensoryEnvironment };
