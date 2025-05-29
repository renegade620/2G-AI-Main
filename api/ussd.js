const axios = require('axios');
const africastalking = require('africastalking')({
  apiKey: process.env.AFRICASTALKING_API_KEY,
  username: process.env.AFRICASTALKING_USERNAME
});
const sms = africastalking.SMS;
const apiKey = process.env.GEMINI_API_KEY;

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).send('Only POST allowed');

  let body = '';
  req.on('data', chunk => { body += chunk.toString(); });

  req.on('end', async () => {
    try {
      const params = new URLSearchParams(body);
      const text = params.get('text') || '';
      const phone = params.get('phoneNumber');
      const inputs = text.split('*');
      let response = '';

      const interestMap = {
        '1': 'Mathematics and Problem Solving',
        '2': 'Science and Research',
        '3': 'Languages and Communication',
        '4': 'Technical and Hands-on Work',
        '5': 'Helping People and Social Work'
      };

      const subjectMap = {
        '1': 'Mathematics',
        '2': 'Sciences',
        '3': 'English',
        '4': 'Kiswahili',
        '5': 'Computer Studies'
      };

      // Step 0 - Welcome
      if (text === '') {
        response = `CON Welcome to Career Buddy AI 🎓
Find your ideal career path and nearby training opportunities in Kenya.

1. Start Career Discovery
99. Exit`;
      }

      // Step 1 - Interest Selection
      else if (inputs.length === 1 && inputs[0] === '1') {
        response = `CON What area interests you most?

1. Maths & Problem Solving
2. Science & Research  
3. Languages & Communication
4. Technical & Hands-on Work
5. Helping People

0. Back
99. Exit`;
      }

      // Step 2 - Subject Selection
      else if (inputs.length === 2 && inputs[0] === '1') {
        if (!interestMap[inputs[1]]) {
          response = `CON Invalid selection. Please choose 1-5.

0. Back
99. Exit`;
        } else {
          response = `CON Which subject are you strongest in?

1. Mathematics
2. Sciences (Physics/Chemistry/Biology)
3. English
4. Kiswahili  
5. Computer Studies

0. Back
99. Exit`;
        }
      }

      // Step 3 - Location Input
      else if (inputs.length === 3 && inputs[0] === '1') {
        if (!subjectMap[inputs[2]]) {
          response = `CON Invalid selection. Please choose 1-5.

0. Back
99. Exit`;
        } else {
          response = `CON Enter your location (County or Town):
Example: Nairobi, Mombasa, Kisumu, Nakuru, etc.

0. Back
99. Exit`;
        }
      }

      // Step 4 - AI Processing & SMS
      else if (inputs.length === 4 && inputs[0] === '1') {
        const interest = interestMap[inputs[1]];
        const subject = subjectMap[inputs[2]];
        const location = inputs[3]?.trim();

        if (!phone || !location || location.length < 2) {
          response = `CON Please enter a valid location.

0. Back
99. Exit`;
        } else {
          response = `CON Processing your career recommendations...
📱 Detailed results will be sent via SMS shortly.

Thank you for using Career Buddy AI!`;

          // Send AI request asynchronously to avoid USSD timeout
          setImmediate(async () => {
            try {
              const aiPrompt = `You are a Kenyan career counselor helping a student from ${location}. 

Student Profile:
- Location: ${location}, Kenya
- Main Interest: ${interest}
- Best Subject: ${subject}

Please provide:
1. TWO specific career recommendations that match their interests and subject strength
2. TWO nearby educational institutions in or near ${location} (TVETs, colleges, universities, or training centers)
3. Brief explanation why these careers suit them
4. Next steps they should take

Keep response under 300 words, practical, and Kenya-specific. Include specific institution names if possible.`;

              const aiResponse = await axios.post(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-latest:generateContent?key=${apiKey}`,
                {
                  contents: [{
                    parts: [{
                      text: aiPrompt
                    }]
                  }],
                  generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 400
                  }
                },
                {
                  headers: {
                    'Content-Type': 'application/json'
                  }
                }
              );

              const aiReply = aiResponse.data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
              
              if (!aiReply) {
                throw new Error('Empty AI response received');
              }

              // Send comprehensive SMS
              await sms.send({
                to: [phone],
                message: `🎓 CAREER BUDDY AI - Your Personalized Career Guide

📍 Location: ${location}
💡 Interest: ${interest}
📚 Strong Subject: ${subject}

${aiReply}

🚀 Keep pursuing your dreams! Visit career centers near you for more guidance.

- Career Buddy AI`,
                from: '5679'
              });

              console.log(`Career guidance sent successfully to ${phone} for ${location}`);

            } catch (error) {
              console.error('AI/SMS Error:', error.message);
              
              // Send fallback SMS
              try {
                await sms.send({
                  to: [phone],
                  message: `🎓 CAREER BUDDY AI

Sorry, we couldn't process your request right now. Please try again later or visit your nearest career guidance center.

Based on your interest in ${interest} and strength in ${subject}, consider exploring related courses at institutions near ${location}.

- Career Buddy AI`,
                  from: '5679'
                });
              } catch (smsError) {
                console.error('Fallback SMS failed:', smsError.message);
              }
            }
          });
        }
      }

      // Back navigation
      else if (inputs[inputs.length - 1] === '0') {
        if (inputs.length === 2) {
          response = `CON Welcome to Career Buddy AI 🎓
Find your ideal career path and nearby training opportunities in Kenya.

1. Start Career Discovery
99. Exit`;
        } else if (inputs.length === 3) {
          response = `CON What area interests you most?

1. Maths & Problem Solving
2. Science & Research  
3. Languages & Communication
4. Technical & Hands-on Work
5. Helping People

0. Back
99. Exit`;
        } else if (inputs.length === 4) {
          response = `CON Which subject are you strongest in?

1. Mathematics
2. Sciences (Physics/Chemistry/Biology)
3. English
4. Kiswahili  
5. Computer Studies

0. Back
99. Exit`;
        }
      }

      // Exit
      else if (inputs[inputs.length - 1] === '99') {
        response = 'END Thank you for using Career Buddy AI! 🎓 Good luck with your career journey!';
      }

      // Invalid input fallback
      else {
        response = 'END Invalid selection. Please dial the code again to restart.';
      }

      res.setHeader('Content-Type', 'text/plain');
      res.end(response);

    } catch (error) {
      console.error('USSD Handler Error:', error.message);
      res.setHeader('Content-Type', 'text/plain');
      res.end('END System error. Please try again later.');
    }
  });
};