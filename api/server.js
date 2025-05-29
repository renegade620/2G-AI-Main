const axios = require('axios');

module.exports = async (req, res) => {
  if (req.method === 'OPTIONS') {
    // Handle CORS preflight
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST, OPTIONS');
    return res.status(405).send('Method Not Allowed');
  }

  let body = '';
  for await (const chunk of req) {
    body += chunk.toString();
  }

  const params = new URLSearchParams(body);
  const userMessage = params.get('message') || '';
  const apiKey = process.env.GEMINI_API_KEY

  try {
    const aiRes = await axios.post(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-latest:generateContent?key=${apiKey}',
      {
        contents: [{
          parts: [{
            text: `Please provide a helpful and friendly response to: "${userMessage}"`
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 500
        }
      },
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    const aiReply = aiResponse.data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || 'No response from AI.';

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*'); // Allow CORS for frontend fetch
    res.status(200).json({ reply: aiReply });
  } catch (err) {
    console.error('AI Error:', err.message);
    res.status(500).json({ error: 'Something went wrong.' });
  }
};
