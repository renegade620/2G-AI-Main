const axios = require('axios');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).send('Only POST allowed');
  }

  let body = '';
  req.on('data', chunk => {
    body += chunk.toString();
  });

  req.on('end', async () => {
    const params = new URLSearchParams(body);
    const text = params.get('text') || '';
    const inputs = text.split('*');
    let response = '';

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

    // Step 1
    if (text === '') {
      response = `CON Welcome to Career Buddy!
Find a career that suits you.
1. Start`;
    }
    // Step 2
    else if (inputs.length === 1) {
      response = `CON What do you enjoy most?
1. Maths
2. Science
3. Languages
4. Technical work
5. Helping people`;
    }
    // Step 3
    else if (inputs.length === 2) {
      response = `CON What subject are you best at?
1. Maths
2. Science
3. English
4. Kiswahili
5. Computer`;
    }
    // Step 4 - AI Suggestion
    else if (inputs.length === 3) {
      const interest = interestMap[inputs[1]] || 'General topics';
      const subject = subjectMap[inputs[2]] || 'General subjects';

      try {
        const aiRes = await axios.post(
          'https://api.cohere.ai/v1/chat',
          {
            model: 'command-r-plus',
            message: `Suggest 2 good careers for a student in Kenya who enjoys ${interest} and is good at ${subject}. Keep it brief and practical.`,
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
        response = `END ${aiReply}`;
      } catch (err) {
        console.error(err.message);
        response = 'END Sorry, AI failed. Try again later.';
      }
    }
    // Anything past 3 steps
    else {
      response = 'END Thank you for using Career Buddy.';
    }

    res.setHeader('Content-Type', 'text/plain');
    res.end(response);
  });
};
