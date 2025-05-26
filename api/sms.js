const axios = require('axios');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).send('Only POST allowed');

  const { text, from } = req.body;
  let reply = '';

  try {
    const aiRes = await axios.post(
      'https://api.cohere.ai/v1/chat',
      {
        model: 'command-r-plus',
        message: `Help this student with an academic question: "${text}"`,
        chat_history: []
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.COHERE_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    reply = aiRes.data.text.trim().slice(0, 160); // keep it SMS-friendly
  } catch (err) {
    reply = 'Sorry, I couldn’t get the answer right now.';
  }

  // Response format for Africa’s Talking
  res.set('Content-Type', 'text/plain');
  res.send(reply);
};
