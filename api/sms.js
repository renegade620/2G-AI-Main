const axios = require('axios');
const africastalking = require('africastalking')({
  apiKey: process.env.AFRICASTALKING_API_KEY,
  username: process.env.AFRICASTALKING_USERNAME
});
const sms = africastalking.SMS;

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).send('Only POST allowed');

  let body = '';
  req.on('data', chunk => { body += chunk.toString(); });
  req.on('end', async () => {
    const params = new URLSearchParams(body);
    const message = params.get('text') || '';
    const from = params.get('from');

    try {
      const aiRes = await axios.post(
        'https://api.cohere.ai/v1/chat',
        {
          model: 'command-r-plus',
          message: `Reply to this message in helpful and respectful tone: "${message}"`,
          temperature: 0.7
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.COHERE_API_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const aiReply = aiRes.data.text.trim();

      await sms.send({
        to: [from],
        message: aiReply
      });

      res.status(200).send('OK');
    } catch (err) {
      console.error('SMS AI error:', err.message);
      res.status(500).send('Server error');
    }
  });
};
