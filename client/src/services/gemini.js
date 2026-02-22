const GEMINI_API_KEY = process.env.REACT_APP_GEMINI_API_KEY || 'REDACTED_GEMINI_KEY';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

export const geminiAPI = {
  // Analyze trip and suggest safe route
  analyzeTrip: async (startLocation, endLocation, userContext = {}) => {
    try {
      const prompt = `
You are an expert travel route advisor for people with anxiety and sensory sensitivities. 
Analyze the following trip and suggest the best and safest route.

START LOCATION: ${startLocation.name} (${startLocation.lat}, ${startLocation.lng})
END LOCATION: ${endLocation.name} (${endLocation.lat}, ${endLocation.lng})

User Context: ${userContext.condition || 'General anxiety'} 

Please provide:
1. RECOMMENDED ROUTE: Step-by-step directions with street names
2. SAFE HAVENS: List toilets, cafes, parks, and quiet spaces along the route (with rough distances)
3. ROUTE FEATURES: Road type (highway, local roads, scenic route, etc.)
4. SAFETY TIPS: Specific tips for this route
5. ESTIMATED TIME: Estimated travel time
6. WHY THIS ROUTE: Detailed explanation of why this specific route is recommended for someone with sensory sensitivities

Format as JSON with keys: route, safeHavens, features, safetyTips, estimatedTime, reasoning
      `;

      const response = await fetch(
        `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: prompt,
                  },
                ],
              },
            ],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 2048,
            },
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.candidates || !data.candidates[0]) {
        throw new Error('No response from Gemini API');
      }

      const responseText = data.candidates[0].content.parts[0].text;
      
      // Try to parse JSON from response
      try {
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
      }

      // Return raw text if JSON parsing fails
      return {
        route: responseText,
        safeHavens: [],
        features: 'See detailed route above',
        safetyTips: 'Follow the recommendations above',
        estimatedTime: 'Unknown',
        reasoning: responseText,
      };
    } catch (error) {
      console.error('Error analyzing trip with Gemini:', error);
      throw error;
    }
  },

  // Suggest nearby safe spaces
  suggestSafeSpaces: async (location) => {
    try {
      const prompt = `
Based on the location coordinates (${location.lat}, ${location.lng}), 
suggest safe and calm places nearby that would be suitable for someone experiencing anxiety:
- Quiet parks or green spaces
- Peaceful cafes
- Botanical gardens
- Temples or spiritual places
- Libraries
- Meditation centers

For each place, provide:
- Name (estimated/general type)
- Type
- Why it's good for anxiety relief
- Approximate distance from location

Format as JSON array with objects: {name, type, reason, distance}
      `;

      const response = await fetch(
        `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: prompt,
                  },
                ],
              },
            ],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 1024,
            },
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.statusText}`);
      }

      const data = await response.json();
      const responseText = data.candidates[0].content.parts[0].text;

      try {
        const jsonMatch = responseText.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
      }

      return [];
    } catch (error) {
      console.error('Error suggesting safe spaces:', error);
      throw error;
    }
  },

  // Generic chat / free-form prompt
  chat: async (prompt) => {
    const response = await fetch(
      `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 2048 },
        }),
      }
    );
    if (!response.ok) {
      const errBody = await response.json().catch(() => ({}));
      throw new Error(`Gemini API error ${response.status}: ${errBody?.error?.message || response.statusText}`);
    }
    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error('Empty response from Gemini API');
    return text;
  },

  // Get route explanation
  explainRoute: async (route, startPoint, endPoint) => {
    try {
      const prompt = `
Explain why this route is the best choice for someone with anxiety and sensory sensitivities.

Route: ${route}
From: ${startPoint}
To: ${endPoint}

Provide a detailed explanation covering:
1. Traffic and congestion levels
2. Noise levels expected
3. Nearby amenities and safe spaces
4. Lighting and visual comfort
5. Overall suitability for someone with anxiety

Keep the explanation clear and compassionate.
      `;

      const response = await fetch(
        `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: prompt,
                  },
                ],
              },
            ],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 1024,
            },
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.candidates[0].content.parts[0].text;
    } catch (error) {
      console.error('Error explaining route:', error);
      throw error;
    }
  },
};

export default geminiAPI;
