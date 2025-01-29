require("dotenv").config();
const express = require("express");
const axios = require("axios");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to handle JSON requests
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// OpenAI API Key
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// Root route for debugging
app.get("/", (req, res) => {
  res.send("🚀 Chatbot backend is running successfully!");
});

// Chat endpoint for handling user messages
app.post("/chat", async (req, res) => {
  console.log("✅ Received a POST request to /chat");
  console.log("Request Body:", req.body);

  const userMessage = req.body.message;

  if (!userMessage) {
    return res.status(400).json({ error: "Message is required" });
  }

  try {
    const gptResponse = await getGPTResponse(userMessage);
    res.json({ reply: gptResponse });
  } catch (error) {
    console.error("❌ Chatbot Error:", error);
    res.status(500).json({ error: "Something went wrong." });
  }
});

// Function to Get OpenAI GPT Response
async function getGPTResponse(message) {
  try {
    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: message }],
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OPENAI_API_KEY}`,
        }
      }
    );
    return response.data.choices[0].message.content;
  } catch (error) {
    console.error("❌ Error with OpenAI API:", error.message);
    throw new Error("Failed to get GPT response.");
  }
}

// Start the server - LISTENS ON ALL INTERFACES
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Chatbot backend running on port ${PORT}`);
});
