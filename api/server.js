const axios = require('axios');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).send('Method Not Allowed');
  }

  let body = '';
  for await (const chunk of req) {
    body += chunk.toString();
  }

  // parse URL-encoded form body
  const params = new URLSearchParams(body);
  const userMessage = params.get('message') || '';

  try {
    const aiRes = await axios.post(
      'https://api.cohere.ai/v1/chat',
      {
        model: 'command-r-plus',
        message: `Reply helpfully to: "${userMessage}"`,
        temperature: 0.7
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.COHERE_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const aiReply = aiRes.data.text?.trim() || 'No response from AI.';

    res.setHeader('Content-Type', 'text/html');
    res.status(200).send(`
      <!DOCTYPE html>
      <html><head><meta charset="UTF-8"><title>AI Chat</title>
      <style>body{font-family:sans-serif;margin:20px;max-width:500px}textarea,button{width:100%;padding:10px;font-size:1em}</style>
      </head><body>
      <h2>Chat with AI</h2>
      <form method="POST" action="/api/server">
        <textarea name="message" rows="5" required>${userMessage}</textarea>
        <button type="submit">Send</button>
      </form>
      <div style="margin-top:15px;white-space:pre-wrap;"><strong>AI:</strong> ${aiReply}</div>
      </body></html>
    `);
  } catch (err) {
    console.error('AI Error:', err.message);
    res.status(500).send('Something went wrong.');
  }
};
