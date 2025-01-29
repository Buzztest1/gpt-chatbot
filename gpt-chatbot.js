const cors = require("cors");
const express = require("express");
const axios = require("axios");

const app = express();
const PORT = process.env.PORT || 3000;

// CORS Setup - Allow GHL & BuzzFX, and Handle Preflight Requests
const corsOptions = {
    origin: "*",  // TEMP FIX: Allows all origins (to confirm CORS is working)
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    allowedHeaders: ["Content-Type"],
    credentials: true,
    optionsSuccessStatus: 204
};

app.use(cors(corsOptions));

// Handle Preflight Requests
app.options("*", cors(corsOptions));

// Middleware to handle JSON requests
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// OpenAI API Key
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// Root route for debugging
app.get("/", (req, res) => {
  res.set("Access-Control-Allow-Origin", "*"); // Ensures the header is always included
  res.send("🚀 Chatbot backend is running successfully!");
});

// Chat endpoint for handling user messages
app.post("/chat", async (req, res) => {
  res.set("Access-Control-Allow-Origin", "*"); // Ensures header is present

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
