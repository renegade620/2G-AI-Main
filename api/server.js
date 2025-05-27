const axios = require('axios');

module.exports = async (req, res) => {
  if (req.method === 'GET') {
    return renderPage(res, '', '');
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST');
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
    renderPage(res, userMessage, aiReply);
  } catch (err) {
    console.error('AI Error:', err.message);
    res.status(500).send('Something went wrong.');
  }
};

function renderPage(res, userMessage, aiReply) {
  res.setHeader('Content-Type', 'text/html');
  res.status(200).send(`<!DOCTYPE html>
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
    }
  </style>
</head>
<body>
  <div class="container">
    <h2 style="text-align:center;">Chat with AI</h2>
    <form id="chat-form">
      <textarea id="message" name="message" required placeholder="Type your message...">${userMessage}</textarea>
      <button type="submit">Send</button>
    </form>
    <div id="chat-history" class="response">
      ${userMessage ? `<div><b>You:</b> ${userMessage}<br><b>AI:</b> ${aiReply}</div>` : ''}
    </div>
    <div class="toggle">
      <label>
        <input type="checkbox" id="theme-toggle"> Toggle Dark Mode
      </label>
    </div>
  </div>

  <script>
    const form = document.getElementById('chat-form');
    const historyDiv = document.getElementById('chat-history');
    const themeToggle = document.getElementById('theme-toggle');

    // Load theme from localStorage
    if(localStorage.getItem('theme') === 'dark') {
      document.body.classList.add('dark');
      themeToggle.checked = true;
    }

    themeToggle.addEventListener('change', () => {
      document.body.classList.toggle('dark');
      localStorage.setItem('theme', document.body.classList.contains('dark') ? 'dark' : 'light');
    });

    // Load chat history from localStorage
    const chatHistory = JSON.parse(localStorage.getItem('chatHistory') || '[]');

    // On first load with new AI reply, add it to history if exists
    const userMessage = ${JSON.stringify(userMessage)};
    const aiReply = ${JSON.stringify(aiReply)};
    if(userMessage.trim() && aiReply.trim()) {
      chatHistory.push({ message: userMessage, reply: aiReply });
      localStorage.setItem('chatHistory', JSON.stringify(chatHistory));
    }

    renderHistory(chatHistory);

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const message = form.message.value.trim();
      if (!message) return;

      const res = await fetch('/api/server', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ message })
      });

      const html = await res.text();
      document.open();
      document.write(html);
      document.close();
    });

    function renderHistory(data) {
      historyDiv.innerHTML = data.map(item => \`
        <div><b>You:</b> \${item.message}<br><b>AI:</b> \${item.reply}</div>
      \`).join('<hr>');
    }
  </script>
</body>
</html>`);
}
