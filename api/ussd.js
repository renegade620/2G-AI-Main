const axios = require('axios');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).send('Only POST allowed');

  let body = '';
  req.on('data', chunk => { body += chunk.toString(); });
  req.on('end', async () => {
    const params = new URLSearchParams(body);
    const text = params.get('text') || '';
    const inputs = text.split('*');
    let response = '';

    if (text === '') {
      response = `CON Welcome to Career Buddy!
Find a career that suits you.
1. Start`;
    } else if (inputs.length === 1) {
      response = `CON What do you enjoy?
1. Maths
2. Science
3. Languages
4. Technical work
5. Helping people`;
    } else if (inputs.length === 2) {
      response = `CON What are your best subjects?
1. Maths
2. Science
3. English
4. Kiswahili
5. Computer`;
    } else if (inputs.length === 3) {
      const interest = inputs[1];
      const subject = inputs[2];

      const interestMap = {
        '1': 'Maths',
        '2': 'Science',
        '3': 'Languages',
        '4': 'Technical work',
        '5': 'Helping people'
      };

      const subjectMap = {
        '1': 'Maths',
        '2': 'Science',
        '3': 'English',
        '4': 'Kiswahili',
        '5': 'Computer Studies'
      };

      const interestText = interestMap[interest] || 'General';
      const subjectText = subjectMap[subject] || 'General';

      try {
        const aiRes = await axios.post(
          'https://api.cohere.ai/v1/chat',
          {
            model: 'command-r-plus',
            message: `Give only 2 short career suggestions (max 20 words total) for a Kenyan student who enjoys ${interestText} and is good at ${subjectText}.`,
            chat_history: []
          },
          {
            headers: {
              Authorization: `Bearer ${process.env.COHERE_API_KEY}`,
              'Content-Type': 'application/json'
            }
          }
        );

        let aiReply = aiRes.data.text.trim();
        // Limit to 160 chars just to be safe
        if (aiReply.length > 160) {
          aiReply = aiReply.slice(0, 157) + '...';
        }

        response = `END ${aiReply}`;
      } catch (err) {
        response = 'END AI failed. Try again later.';
      }
    } else {
      response = 'END Thanks for using Career Buddy.';
    }

    res.setHeader('Content-Type', 'text/plain');
    res.end(response);
  });
};
