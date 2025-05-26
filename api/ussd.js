module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).send('Only POST allowed');

  let body = '';
  req.on('data', chunk => { body += chunk.toString(); });
  req.on('end', () => {
    const params = new URLSearchParams(body);
    const text = params.get('text');

    let response = '';

    if (text === '') {
      response = `CON Welcome to 2G AI
1. Crop Advice
2. Weather Tips
3. Exit`;
    } else if (text === '1') {
      response = 'END Use neem oil and rotate crops.';
    } else if (text === '2') {
      response = 'END Rains expected tomorrow. Time to sow.';
    } else {
      response = 'END Invalid input.';
    }

    res.setHeader('Content-Type', 'text/plain');
    res.end(response);
  });
};
