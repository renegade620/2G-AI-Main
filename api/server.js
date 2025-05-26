const axios = require('axios');
const bodyParser = require('body-parser');
const express = require('express');

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));

app.post('/api/server', async (req, res) => {
  const userMessage = req.body.message;

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

    res.send(`
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
    res.send('Something went wrong.');
  }
});

module.exports = app;
