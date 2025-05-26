const axios = require("axios");

module.exports = async (req, res) => {
  if (req.method !== "POST") return res.status(405).send("Only POST allowed");

  let body = "";
  req.on("data", chunk => { body += chunk.toString(); });

  req.on("end", async () => {
    const params = new URLSearchParams(body);
    const text = params.get("text") || "";
    const inputs = text.split("*");
    const level = inputs.length;
    let response = "";

    const subjectMap = {
      "1": "Maths",
      "2": "Languages",
      "3": "Sciences",
      "4": "Technicals"
    };

    // Entry Point
    if (level === 1) {
      response = `CON SmartStudy AI - Choose a Subject:
1. Maths
2. Languages
3. Sciences
4. Technicals`;
    }

    // After subject selection
    else if (level === 2) {
      response = `CON Enter your question in ${subjectMap[inputs[1]] || 'Selected Subject'}:`;
    }

    // After entering question
    else if (level === 3) {
      const subject = subjectMap[inputs[1]] || "General";
      const question = inputs[2];

      try {
        const aiRes = await axios.post(
          "https://api.cohere.ai/v1/chat",
          {
            message: `You are an expert in ${subject}. Help a student with this question: ${question}`,
            model: "command-r-plus",
            connectors: [{ id: "web-search" }],
          },
          {
            headers: {
              "Authorization": `Bearer ${process.env.COHERE_API_KEY}`,
              "Content-Type": "application/json"
            }
          }
        );

        const aiReply = aiRes.data.text.trim();

        response = `CON ${aiReply}
1. Ask again
2. Change subject
0. Exit`;
      } catch (err) {
        response = "END AI failed. Try again.";
      }
    }

    // Handle after reply options
    else if (level === 4) {
      const option = inputs[3];
      if (option === "1") {
        response = `CON Ask another question in ${subjectMap[inputs[1]] || 'the same subject'}:`;
      } else if (option === "2") {
        response = `CON Choose a new Subject:
1. Maths
2. Languages
3. Sciences
4. Technicals`;
      } else {
        response = "END Thanks for using SmartStudy AI.";
      }
    }

    // If user goes deeper than level 4
    else if (level === 5) {
      const subject = subjectMap[inputs[1]] || "General";
      const question = inputs[4];

      try {
        const aiRes = await axios.post(
          "https://api.cohere.ai/v1/chat",
          {
            message: `You are an expert in ${subject}. Help a student with this question: ${question}`,
            model: "command-r-plus",
            connectors: [{ id: "web-search" }],
          },
          {
            headers: {
              "Authorization": `Bearer ${process.env.COHERE_API_KEY}`,
              "Content-Type": "application/json"
            }
          }
        );

        const aiReply = aiRes.data.text.trim();

        response = `CON ${aiReply}
1. Ask again
2. Change subject
0. Exit`;
      } catch (err) {
        response = "END AI failed. Try again.";
      }
    }

    res.setHeader("Content-Type", "text/plain");
    res.end(response);
  });
};
