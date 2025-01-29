require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios");

const app = express();
const PORT = process.env.PORT || 3000; // Change this line to use Render's PORT

// Middleware
app.use(bodyParser.json());

// OpenAI API Key
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// Route to Handle Chat Requests
app.post("/chat", async (req, res) => {
  const userMessage = req.body.message;

  try {
    // Check for specific keywords to route to different APIs
    if (userMessage.toLowerCase().includes("book a consultation")) {
      const bookingLink = await getBookingLink();
      return res.json({ reply: `You can book a consultation here: ${bookingLink}` });
    } else if (userMessage.toLowerCase().includes("services")) {
      const services = await getServices();
      return res.json({ reply: `Here are our services: ${services}` });
    } else {
      // Default: Send message to OpenAI for a response
      const gptResponse = await getGPTResponse(userMessage);
      return res.json({ reply: gptResponse });
    }
  } catch (error) {
    console.error("Error:", error.message);
    return res.status(500).json({ reply: "Sorry, something went wrong. Please try again." });
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
    console.error("Error with OpenAI API:", error.message);
    throw new Error("Failed to get GPT response.");
  }
}

// Example API Integration: Get Booking Link
async function getBookingLink() {
  try {
    // Replace with actual API call (e.g., Calendly API)
    const link = "https://calendly.com/your-booking-link";
    return link;
  } catch (error) {
    console.error("Error fetching booking link:", error.message);
    throw new Error("Failed to fetch booking link.");
  }
}

// Example API Integration: Get Services
async function getServices() {
  try {
    // Replace with actual API call or hardcoded data
    const services = ["Web Design", "SaaS Tools", "Branding Solutions"];
    return services.join(", ");
  } catch (error) {
    console.error("Error fetching services:", error.message);
    throw new Error("Failed to fetch services.");
  }
}

app.get("/", (req, res) => {
  res.send("Chatbot backend is running!");
});


// Start Server
app.listen(PORT, () => {
  console.log(`Chatbot backend running at http://localhost:${PORT}`);
});
