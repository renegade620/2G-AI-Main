const OpenAI = require("openai");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

module.exports = async (req, res) => {
  if (req.method !== "POST") return res.status(405).send("Only POST allowed");

  let body = "";
  req.on("data", (chunk) => {
    body += chunk.toString();
  });
  req.on("end", async () => {
    const params = new URLSearchParams(body);
    const text = params.get("text") || "";
    const userInput = text.split("*").pop();
    let response = "";

    if (!text) {
      response = `CON Welcome to 2G AI
Ask a question on farming, health or business.`;
    } else {
      try {
        const completion = await openai.chat.completions.create({
          model: "gpt-3.5-turbo",
          messages: [{ role: "user", content: userInput }],
          max_tokens: 60,
          temperature: 0.7,
        });

        const aiReply = completion.choices[0].message.content.trim();
        response = `END ${aiReply}`;
      } catch (err) {
        console.error("OpenAI API error:", err);
        response = "END AI failed. Try again later.";
      }
    }

    res.setHeader("Content-Type", "text/plain");
    res.end(response);
  });
};
