import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const app = express();
app.use(express.json());

const PORT = 3000;

// Lazy initialization of the Gemini client
let aiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY environment variable is required but missing. Please set it in your Secrets panel.");
    }
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

// 1. HEALTHCHECK ENDPOINT
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: new Date() });
});

// 2. AI CHAT ENDPOINT (Proxied to keep API key safe)
app.post("/api/chat", async (req, res) => {
  try {
    const { message, history, language } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    const ai = getGeminiClient();

    // Context-rich travel specialist system prompt
    const systemInstruction = `
      You are an expert AI travel consultant, tour guide, and tourism specialist named Sweden Travel AI.
      Your goal is to assist tourists, business travelers, families, students, and Halal-conscious visitors with their queries about Sweden.
      
      Always speak in a friendly, professional, and helpful tone.
      You support three languages: English, Arabic, and Swedish.
      The current language is: ${language || 'en'}. You MUST reply in this language.
      If the language is Arabic (ar), make sure your response is formatted beautifully with Middle Eastern hospitality and proper RTL-compatible spacing.

      Use your comprehensive knowledge about:
      - 14 Swedish Cities (Stockholm, Gothenburg, Malmö, Uppsala, Lund, Kiruna, Visby, Örebro, Linköping, Jönköping, Karlstad, Helsingborg, Falun, Luleå).
      - Attractions, restaurants, hotels, public transport, and seasonal weather advice.
      - Halal restaurants, mosques, Islamic centers, and prayer timings (important for Muslim Travel Guide).
      - Hidden gems, saving money, safety, emergency numbers (112, 114 14, 1177).
      - Basic Swedish phrases (like "Hej" = Hello, "Tack" = Thank you, "Fika" = Coffee break).

      Guidelines:
      - Keep responses highly practical, informative, and visually scannable.
      - Structure lists with clean bullet points.
      - Do not include fake flights or real booking IDs; explain how they can search flights/hotels in the Sweden Travel AI app.
      - Avoid technical larping or container logs. Focus 100% on a premium travel companion experience.
    `;

    // Map history to the required format for gemini-2.5-flash
    const contents = [];
    if (history && Array.isArray(history)) {
      for (const msg of history) {
        contents.push({
          role: msg.sender === 'user' ? 'user' : 'model',
          parts: [{ text: msg.text }]
        });
      }
    }
    
    // Append the current message
    contents.push({
      role: 'user',
      parts: [{ text: message }]
    });

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: contents,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.7,
      }
    });

    res.json({ text: response.text });
  } catch (error: any) {
    console.error("Gemini Chat API Error:", error);
    res.status(500).json({ error: error.message || "Failed to contact Gemini AI" });
  }
});

// 3. INTELLIGENT TRIP PLANNER ENDPOINT (Returns structured JSON)
app.post("/api/plan-trip", async (req, res) => {
  try {
    const { prefs, language } = req.body;
    if (!prefs) {
      return res.status(400).json({ error: "Preferences are required" });
    }

    const ai = getGeminiClient();

    const prompt = `
      Create a detailed, highly personalized travel itinerary for Sweden based on the following travel preferences:
      - Departure Country: ${prefs.departureCountry}
      - Start Date: ${prefs.startDate}
      - End Date: ${prefs.endDate}
      - Budget: ${prefs.budget} (Budget/Comfort/Luxury)
      - Travelers: ${prefs.travelers?.adults || 1} Adults, ${prefs.travelers?.children || 0} Children
      - Travel Style: ${prefs.travelStyle}
      - Preferred Cities: ${prefs.preferredCities?.join(", ") || "Stockholm"}
      - Transportation: ${prefs.transportation}
      - Hotel Rating: ${prefs.hotelRating} stars
      - Dietary Preferences: ${prefs.dietaryPreferences}
      - Languages Spoken: ${prefs.languagesSpoken}

      The output MUST be in ${language === 'ar' ? 'Arabic' : language === 'sv' ? 'Swedish' : 'English'}.
      You MUST respond ONLY with a single JSON object. Do NOT wrap the JSON in markdown code blocks like \`\`\`json \`\`\`. Output raw JSON text only.

      The JSON structure MUST follow this exact schema:
      {
        "title": "A customized itinerary name, e.g. '7-Day Arctic & Archipelago Discovery'",
        "itineraryDays": [
          {
            "day": 1,
            "title": "Day 1 Title",
            "description": "Brief summary of the day",
            "activities": [
              {
                "time": "09:00",
                "title": "Activity name",
                "description": "Detailed description of what to do, where to go, and customized tips matching dietary/travel styles.",
                "location": "Name of the location/attraction",
                "cost": "Cost in SEK or 'Free'"
              }
            ]
          }
        ],
        "estimatedCosts": {
          "accommodation": 5000,
          "flights": 3000,
          "food": 2500,
          "transport": 1000,
          "activities": 1500,
          "shopping": 1000,
          "insurance": 500,
          "emergency": 1000,
          "total": 15500
        },
        "packingList": [
          "Item 1",
          "Item 2"
        ],
        "safetyAdvice": [
          "Advice 1",
          "Advice 2"
        ],
        "travelTips": [
          "Tip 1",
          "Tip 2"
        ]
      }

      Strict guidelines:
      - Customize the daily activities to reflect their preferred travelStyle and dietary preferences (e.g. if Halal is preferred, suggest specific halal/vegetarian-friendly spots in Stockholm/Gothenburg; if Nature, focus on national parks and hiking trails).
      - Estimate cost values realistically in Swedish Krona (SEK) matching their budget tier.
      - Make sure the dates and number of days match the duration between ${prefs.startDate} and ${prefs.endDate} exactly.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        responseMimeType: "application/json",
        temperature: 0.5,
      }
    });

    const rawText = response.text || "{}";
    let cleanedText = rawText.trim();
    if (cleanedText.startsWith("```json")) {
      cleanedText = cleanedText.substring(7);
    }
    if (cleanedText.endsWith("```")) {
      cleanedText = cleanedText.substring(0, cleanedText.length - 3);
    }
    cleanedText = cleanedText.trim();

    const plan = JSON.parse(cleanedText);
    res.json(plan);
  } catch (error: any) {
    console.error("Gemini Planner API Error:", error);
    res.status(500).json({ error: error.message || "Failed to generate personalized trip plan." });
  }
});

// 4. ITINERARY SMART SUMMARY ENDPOINT
app.post("/api/itinerary-summary", async (req, res) => {
  try {
    const { itinerary, language } = req.body;
    if (!itinerary) {
      return res.status(400).json({ error: "Itinerary is required" });
    }

    const ai = getGeminiClient();
    const targetLang = language === 'ar' ? 'Arabic' : language === 'sv' ? 'Swedish' : 'English';

    const prompt = `
      Analyze this Sweden travel itinerary and generate a beautiful, smart summary of exactly 3 sentences.
      
      Itinerary Title: "${itinerary.title || "Trip to Sweden"}"
      Departure Country: "${itinerary.departureCountry || "N/A"}"
      Preferred Cities: "${(itinerary.preferredCities || []).join(", ")}"
      Number of days: ${itinerary.itineraryDays?.length || 0} days
      
      Day-by-day outline:
      ${(itinerary.itineraryDays || []).map((day: any) => `Day ${day.day}: ${day.title} - ${day.description}`).join("\n")}

      Guidelines:
      - The summary MUST be exactly 3 sentences long.
      - First sentence: Highlight the main travel experience and the primary cities/areas visited.
      - Second sentence: Mention the key attractions or unique activities featured in the itinerary.
      - Third sentence: Evaluate and describe the overall daily pace of the trip (e.g., active, moderate, or leisurely) and the vibe.
      - The summary MUST be written in ${targetLang}.
      - Return ONLY the raw 3-sentence text. Do NOT use markdown formatting, code blocks, bold text, or headers.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        temperature: 0.6,
      }
    });

    res.json({ summary: response.text?.trim() });
  } catch (error: any) {
    console.error("Gemini Summary API Error:", error);
    res.status(500).json({ error: error.message || "Failed to generate itinerary summary." });
  }
});

// Vite Middleware & Static Serving setup
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Sweden Travel AI Backend] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
