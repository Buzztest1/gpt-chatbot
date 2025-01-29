require("dotenv").config();
const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

// OpenAI & Calendly API Keys
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const CALENDLY_CLIENT_ID = process.env.CALENDLY_CLIENT_ID;
const CALENDLY_CLIENT_SECRET = process.env.CALENDLY_CLIENT_SECRET;
let accessToken = "";

// CORS Setup - Allow GHL & BuzzFX
app.use(cors({ origin: "*", methods: "GET, POST" }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// OAuth 2.0: Get Access Token for Calendly
async function getCalendlyAccessToken() {
    try {
        const response = await axios.post("https://auth.calendly.com/oauth/token", {
            grant_type: "client_credentials",
            client_id: CALENDLY_CLIENT_ID,
            client_secret: CALENDLY_CLIENT_SECRET
        });

        accessToken = response.data.access_token;
        console.log("✅ Calendly Access Token Retrieved:", accessToken);
    } catch (error) {
        console.error("❌ Error fetching Calendly Access Token:", error.response ? error.response.data : error.message);
    }
}

// Run OAuth at startup
getCalendlyAccessToken();

// Root route for debugging
app.get("/", (req, res) => {
    res.set("Access-Control-Allow-Origin", "*");
    res.send("🚀 Chatbot backend is running successfully!");
});

// Function to Fetch Available Calendly Time Slots
async function getAvailableTimeSlots() {
    try {
        const response = await axios.get("https://api.calendly.com/users/me/event_types", {
            headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json"
            }
        });

        return response.data.collection.map(event => ({
            name: event.name,
            booking_link: event.scheduling_url
        }));
    } catch (error) {
        console.error("❌ Error fetching available slots:", error.message);
        return [];
    }
}

// Function to Get OpenAI GPT Response (Restricted to BuzzFX Topics)
async function getGPTResponse(message) {
    try {
        const response = await axios.post(
            "https://api.openai.com/v1/chat/completions",
            {
                model: "gpt-3.5-turbo",
                messages: [
                    { 
                        role: "system", 
                        content: "You are Buzz, the official AI assistant for BuzzFX. You ONLY answer questions related to BuzzFX, including services, pricing, consultations, and company information. If a user asks about anything unrelated to BuzzFX, politely decline to answer." 
                    },
                    { role: "user", content: message }
                ],
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

// Chatbot Route - Handles GPT & Calendly Booking
app.post("/chat", async (req, res) => {
    console.log("✅ Received a POST request to /chat");
    const userMessage = req.body.message.toLowerCase();

    if (userMessage.includes("book a consultation") || userMessage.includes("schedule a call")) {
        const slots = await getAvailableTimeSlots();
        if (slots.length > 0) {
            return res.json({ reply: `Here are available times:\n${slots.map(slot => `${slot.name}: ${slot.booking_link}`).join("\n")}` });
        } else {
            return res.json({ reply: "Sorry, I couldn't fetch available slots right now." });
        }
    }

    try {
        const gptResponse = await getGPTResponse(userMessage);
        res.json({ reply: gptResponse });
    } catch (error) {
        console.error("❌ Chatbot Error:", error);
        res.status(500).json({ error: "Something went wrong." });
    }
});

// Start the server
app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Chatbot backend running on port ${PORT}`);
});
