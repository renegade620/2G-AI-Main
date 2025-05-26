const express = require('express');
const axios = require('axios');
const path = require('path');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));

// Serve index.html on GET
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Handle AI chat on POST
app.post('/chat', async (req, res) => {
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

    // Respond with inline HTML for ultra-lightweight load
    res.send(`
      <!DOCTYPE html>
      <html><head><meta charset="UTF-8"><title>AI Chat</title>
      <style>body{font-family:sans-serif;margin:20px;max-width:500px}textarea,button{width:100%;padding:10px;font-size:1em}</style>
      </head><body>
      <h2>Chat with AI</h2>
      <form method="POST" action="/chat">
        <textarea name="message" rows="5" required>${userMessage}</textarea>
        <button type="submit">Send</button>
      </form>
      <div style="margin-top:15px;white-space:pre-wrap;"><strong>AI:</strong> ${aiReply}</div>
      </body></html>
    `);
  } catch (error) {
    console.error('AI Error:', error.message);
    res.send('Something went wrong. Please try again.');
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
