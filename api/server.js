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
      <html>
      <head>
        <meta charset="UTF-8">
        <title>AI Chat (Lite)</title>
        <style>
          :root {
            --bg: #f4f4f4;
            --text: #222;
            --box: #fff;
            --border: #ccc;
            --btn: #007bff;
            --btn-hover: #0056b3;
          }
          body.dark {
            --bg: #121212;
            --text: #eee;
            --box: #1e1e1e;
            --border: #333;
            --btn: #0d6efd;
            --btn-hover: #0a58ca;
          }
          body {
            font-family: Arial, sans-serif;
            background: var(--bg);
            color: var(--text);
            margin: 0;
            padding: 20px;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            transition: background 0.3s, color 0.3s;
          }
          .container {
            background: var(--box);
            border: 1px solid var(--border);
            border-radius: 10px;
            padding: 20px;
            max-width: 400px;
            width: 100%;
            box-shadow: 0 2px 6px rgba(0,0,0,0.1);
          }
          textarea {
            width: 100%;
            padding: 10px;
            font-size: 1em;
            border: 1px solid var(--border);
            border-radius: 6px;
            resize: vertical;
            min-height: 100px;
            box-sizing: border-box;
            background: transparent;
            color: inherit;
          }
          button {
            width: 100%;
            padding: 12px;
            font-size: 1em;
            margin-top: 10px;
            background: var(--btn);
            color: #fff;
            border: none;
            border-radius: 6px;
            cursor: pointer;
          }
          button:hover {
            background: var(--btn-hover);
          }
          .toggle {
            text-align: center;
            margin-top: 15px;
          }
          .response {
            margin-top: 15px;
            white-space: pre-wrap;
            font-size: 0.95em;
            background: rgba(0,0,0,0.03);
            padding: 10px;
            border-radius: 6px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h2 style="text-align:center;">Chat with AI</h2>
          <form method="POST" action="/api/server">
            <textarea name="message" required>${userMessage}</textarea>
            <button type="submit">Send</button>
          </form>
          <div class="response"><strong>AI:</strong> ${aiReply}</div>
          <div class="toggle">
            <label>
              <input type="checkbox" onchange="document.body.classList.toggle('dark')">
              Toggle Dark Mode
            </label>
          </div>
        </div>
      </body>
      </html>
    `);
  } catch (err) {
    console.error('AI Error:', err.message);
    res.status(500).send('Something went wrong.');
  }
};
