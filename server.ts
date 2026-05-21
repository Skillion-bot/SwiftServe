/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express, { Request, Response } from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());

const PORT = 3000;

// Lazy-loaded Gemini AI client to prevent startup crashes if GEMINI_API_KEY is missing
let aiClient: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY" || apiKey.trim() === "") {
    return null;
  }
  
  if (!aiClient) {
    try {
      aiClient = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });
    } catch (e) {
      console.error("Failed to initialize GoogleGenAI client:", e);
      return null;
    }
  }
  return aiClient;
}

// ----------------------------------------------------
// API ROUTES
// ----------------------------------------------------

// Health Check
app.get("/api/health", (req: Request, res: Response) => {
  res.json({ status: "healthy", timestamp: new Date().toISOString() });
});

// Real-Time Repair Suggestion & Price Estimation
app.post("/api/ai/suggest", async (req: Request, res: Response) => {
  const { brand, model, description } = req.body;

  if (!description) {
    return res.status(400).json({ error: "Problem description is required" });
  }

  const client = getAiClient();
  if (!client) {
    // Elegant fallback simulation when GEMINI IS NOT CONFIGURED
    console.log("Using server fallback for suggestion analysis...");
    const fallback = generateServerFallbackSuggestion(brand || "", model || "", description);
    return res.json(fallback);
  }

  try {
    const prompt = `You are the master repair assistant of SwiftServe. Analyze this electronic/phone repair request and provide structured diagnosis suggestions.
    Device details:
    Brand: ${brand || "Unknown"}
    Model: ${model || "Unknown"}
    Issue description: "${description}"
    
    Format the output response inside the expected JSON schema including likely problem/issue, actions required, cost estimates in Ghana Cedis (GHS), duration, and diagnostic confidence of this guess. Provide logical, realistic, premium estimates based on African informal repair ecosystems.`;

    const response = await client.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            possibleIssue: { type: Type.STRING, description: "Probably what's wrong with the phone based on user issue description." },
            recommendedRepair: { type: Type.STRING, description: "What actions a technician needs to execute to resolve it." },
            estimatedCostMin: { type: Type.INTEGER, description: "Lower boundary price in Ghana Cedis (GHS)." },
            estimatedCostMax: { type: Type.INTEGER, description: "Upper boundary price in Ghana Cedis (GHS)." },
            estimatedDuration: { type: Type.STRING, description: "Approximate completion time (e.g., '1-2 hours', 'A few hours', 'Next day')." },
            confidence: { type: Type.INTEGER, description: "Likelihood percentage that this diagnostics suggestion is accurate." }
          },
          required: ["possibleIssue", "recommendedRepair", "estimatedCostMin", "estimatedCostMax", "estimatedDuration", "confidence"]
        }
      }
    });

    const textResult = response.text;
    if (textResult) {
      const parsedResult = JSON.parse(textResult.trim());
      return res.json(parsedResult);
    } else {
      throw new Error("No response string text returned from Gemini API");
    }
  } catch (error: any) {
    console.error("Gemini suggestion error:", error);
    const fallback = generateServerFallbackSuggestion(brand || "", model || "", description);
    return res.json({ ...fallback, warning: "Fallback loaded due to Gemini API processing error" });
  }
});

// AI Chatbot smart answers FAQs, repair estimates, guidelines
app.post("/api/ai/chat", async (req: Request, res: Response) => {
  const { message, history } = req.body;

  if (!message) {
    return res.status(400).json({ error: "Message is required" });
  }

  const client = getAiClient();
  if (!client) {
    console.log("Using fallback for AI Chat handler...");
    const reply = generateServerFallbackChat(message);
    return res.json({ response: reply });
  }

  try {
    const formattedHistory = (history || []).map((h: any) => ({
      role: h.role === "user" ? "user" : "model",
      parts: [{ text: h.text }]
    }));

    // Add immediate instructions of context
    const chat = client.chats.create({
      model: "gemini-3.5-flash",
      config: {
        systemInstruction: `You are SwiftServe AI chatbot, an interactive premium assistant for SwiftServe digital platform in Africa (Ghana, Nigeria, Kenya).
        We connect customers with highly certified phone repair technicians and multiple small business offerings like Errands, Grocery, Laundry, logistics, etc.
        Help answer friendly inquiries about repair prices, estimated times, how SwiftServe works (e.g., customer submits ticket, technician accepts, customer pays, receives updates via SMS/WhatsApp).
        Sound modern, professional, extremely helpful, warm, and tech-savvy. Use Ghanaian currency context (Ghana Cedis GHS, MoMo - Mobile Money payments) but remain open-minded. Keep your replies structured, concise, and easy to read.`
      }
    });

    // Send context manually if history format is too custom or do simple chat model
    const response = await chat.sendMessage({ message: message });
    return res.json({ response: response.text });
  } catch (err) {
    console.error("Gemini Chat error:", err);
    const reply = generateServerFallbackChat(message);
    return res.json({ response: reply, warning: "Fallback interactive chat due to API error." });
  }
});

// Voice-to-Order parsing system: takes voice transcription text & structures a ticket
app.post("/api/ai/voice-to-ticket", async (req: Request, res: Response) => {
  const { voiceText } = req.body;

  if (!voiceText || voiceText.trim() === "") {
    return res.status(400).json({ error: "Voice transcription text is required" });
  }

  const client = getAiClient();
  if (!client) {
    console.log("Using fallback for Voice-To-Ticket analyzer...");
    const parsedTicket = parseVoiceTextFallback(voiceText);
    return res.json(parsedTicket);
  }

  try {
    const prompt = `You are the master voice voice-to-order processor for SwiftServe.
    Analyze the user's spoken request (expressed in text transcripts) and structure it into a perfect digital ticket.
    Voice Request: "${voiceText}"
    
    Understand the device brand, model, detailed description,preferred appointment type, urgency and provide realistic AI estimated costs and duration in Ghana Cedis. If any fields are not clearly in the text, guess logically or fill with appropriate defaults.`;

    const response = await client.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            brand: { type: Type.STRING, description: "Recognized device brand name, e.g. Samsung, Apple, TECNO, Infinix." },
            model: { type: Type.STRING, description: "Recognized device model, e.g. Galaxy S23, iPhone 14 Pro, Hot 30." },
            description: { type: Type.STRING, description: "Summarized text describing the problem, e.g. 'Broken charging port'." },
            urgency: { type: Type.STRING, description: "Urgency level. Must be one of: 'low', 'medium', 'high'." },
            type: { type: Type.STRING, description: "Delivery mode. Must be one of: 'pickup', 'walk-in'." },
            possibleIssue: { type: Type.STRING, description: "Short AI analysis of the probable physical issue." },
            suggestedRepair: { type: Type.STRING, description: "Recommended service, e.g. Battery replacement, charging flex replacement." },
            estimatedCostMin: { type: Type.INTEGER, description: "Lower boundary price in GHS." },
            estimatedCostMax: { type: Type.INTEGER, description: "Upper boundary price in GHS." },
            estimatedDuration: { type: Type.STRING, description: "Estimated completion timeframe." }
          },
          required: [
            "brand", "model", "description", "urgency", "type", 
            "possibleIssue", "suggestedRepair", "estimatedCostMin", "estimatedCostMax", "estimatedDuration"
          ]
        }
      }
    });

    const resultText = response.text;
    if (resultText) {
      const parsedOutput = JSON.parse(resultText.trim());
      return res.json(parsedOutput);
    } else {
      throw new Error("Empty text reply returned from Gemini voice parser");
    }
  } catch (error) {
    console.error("Gemini Voice Parsing error:", error);
    const parsedTicket = parseVoiceTextFallback(voiceText);
    return res.json({ ...parsedTicket, warning: "Structured using elegant fallback processor" });
  }
});

// ----------------------------------------------------
// FALLBACK GENERATION HELPERS
// ----------------------------------------------------

function generateServerFallbackSuggestion(brand: string, model: string, description: string) {
  const descLower = description.toLowerCase();
  let possibleIssue = "Hardware component diagnostic required";
  let recommendedRepair = "Complete inspection & swap of target terminal module";
  let minCost = 150;
  let maxCost = 400;
  let duration = "2-4 hours";
  let confidence = 75;

  if (descLower.includes("screen") || descLower.includes("crack") || descLower.includes("shatter")) {
    possibleIssue = "Shattered or cracked outer Glass and damaged LCD/OLED panel assembly";
    recommendedRepair = "Full premium high-contrast touch display module replacement";
    minCost = 350;
    maxCost = 950;
    duration = "1-2 hours";
    confidence = 92;
  } else if (descLower.includes("charging") || descLower.includes("charge") || descLower.includes("port") || descLower.includes("plug")) {
    possibleIssue = "Clogged charging gate, loose ribbon connector or oxidized lightning/USB-C controller pins";
    recommendedRepair = "Clean connector docking port or perform precision micro-soldering component replacement of the charging flex board";
    minCost = 100;
    maxCost = 250;
    duration = "45-60 minutes";
    confidence = 88;
  } else if (descLower.includes("battery") || descLower.includes("drain") || descLower.includes("die") || descLower.includes("power")) {
    possibleIssue = "Degraded Lithium-Ion cell chemistry exceeding standard wear-and-tear charging cycles (80% health trigger)";
    recommendedRepair = "Safety verified OEM premium grade zero-cycle high capacity battery swap";
    minCost = 180;
    maxCost = 380;
    duration = "30-45 minutes";
    confidence = 95;
  } else if (descLower.includes("water") || descLower.includes("wet") || descLower.includes("liquid") || descLower.includes("drop")) {
    possibleIssue = "Liquid corrosion on the main logic board, short circuited resistor arrays and mineral deposits";
    recommendedRepair = "Ultrasonic cleaning deep diagnostic, oxidation removal, component-level board dry-out & bridge reconnect";
    minCost = 200;
    maxCost = 650;
    duration = "24-48 hours";
    confidence = 60;
  } else if (descLower.includes("speaker") || descLower.includes("sound") || descLower.includes("volume") || descLower.includes("mic")) {
    possibleIssue = "Blown audio driver coil, acoustic mesh block, or receiver microphone element failure";
    recommendedRepair = "Acoustic chamber clean-out or micro socket speaker/receiver transducer terminal replacement";
    minCost = 80;
    maxCost = 220;
    duration = "1 Hour";
    confidence = 85;
  }

  return {
    possibleIssue,
    recommendedRepair,
    estimatedCostMin: minCost,
    estimatedCostMax: maxCost,
    estimatedDuration: duration,
    confidence
  };
}

function generateServerFallbackChat(message: string): string {
  const msgLower = message.toLowerCase();

  if (msgLower.includes("price") || msgLower.includes("cost") || msgLower.includes("how much")) {
    return `💰 **SwiftServe Pricing Info**:
- **Charging Issue**: GH₵ 100 - GH₵ 250 (Usually taken 45 mins)
- **Screen replacements**: GH₵ 350 - GH₵ 1,200+ (relative to Premium/Original panels)
- **Battery replacement**: GH₵ 180 - GH₵ 450 (OEM grade, safe swap)
- **Admin/Service fee**: We don't charge hidden fees! You will receive a secure digital invoice link, and you can pay deposits via MTN Mobile Money (MoMo), Telecel Cash, or Cards!`;
  }

  if (msgLower.includes("momo") || msgLower.includes("pay") || msgLower.includes("payment")) {
    return `📲 **How Mobile Money (MoMo) Payments Work**:
1. When a technician accepts your order and sets his diagnostics price or invoice, you will see a "Pay" trigger button.
2. Enter your MoMo number (**MTN, Telecel, or AirtelTigo**).
3. The platform simulates/triggers a standard USSD payment prompt request on your device.
4. Once verified, your SwiftServe repair tracker updates instantly to "Fully Paid" or "Deposit Paid", and your funds are securely escrowed for technicians. Can also download immediate receipts!`;
  }

  if (msgLower.includes("how do") || msgLower.includes("workflow") || msgLower.includes("stage")) {
    return `⚙️ **SwiftServe Core Operations Workflow**:
1. **Request Received**: Customer places repair ticket with brand, model, descriptions, or voice-to-order tool.
2. **Diagnosing**: Specialist accepts and inspects the structural problems.
3. **Repair In Progress**: Core technician executes board, displays, or port fixes.
4. **Ready for Pickup**: Device compiles cleanly & verified. Customers pay balance, and pick up, or technician delivers to doorstep!`;
  }

  return `🤖 Salut! I am the **SwiftServe AI Assistant**. I'm here to support service businesses across Africa, beginning with micro phone repairs in Accra, Lagos, & Nairobi.
- Ask me about **"repairs pricing estimates"**,
- Ask me how to use the **"Mobile Money (MoMo)" payment gateway**,
- Ask me about **"repair stages"** and how notifications trigger automatically.
What device are we digitizing today?`;
}

function parseVoiceTextFallback(voiceFormatted: string) {
  const textLower = voiceFormatted.toLowerCase();
  
  let brand = "Generic";
  let model = "Smart Device";
  let description = voiceFormatted;
  let urgency: "low" | "medium" | "high" = "medium";
  let type: "pickup" | "walk-in" = "walk-in";
  
  // Brand parsing
  if (textLower.includes("samsung") || textLower.includes("galaxy")) {
    brand = "Samsung";
    if (textLower.includes("s22")) model = "Galaxy S22";
    else if (textLower.includes("s23")) model = "Galaxy S23";
    else if (textLower.includes("s21")) model = "Galaxy S21";
    else model = "Galaxy A Series";
  } else if (textLower.includes("iphone") || textLower.includes("apple") || textLower.includes("pro max")) {
    brand = "Apple";
    if (textLower.includes("13")) model = "iPhone 13 Pro";
    else if (textLower.includes("14")) model = "iPhone 14 Pro Max";
    else if (textLower.includes("15")) model = "iPhone 15";
    else model = "iPhone XR";
  } else if (textLower.includes("tecno") || textLower.includes("spark") || textLower.includes("camon")) {
    brand = "TECNO";
    if (textLower.includes("spark 10")) model = "Spark 10 Pro";
    else model = "Camon 20";
  } else if (textLower.includes("infinix") || textLower.includes("hot") || textLower.includes("note")) {
    brand = "Infinix";
    model = "Hot 30 Play";
  }

  // Type parsing
  if (textLower.includes("pickup") || textLower.includes("pick up") || textLower.includes("deliver") || textLower.includes("doorstep")) {
    type = "pickup";
  }

  // Urgency parsing
  if (textLower.includes("urgent") || textLower.includes("asap") || textLower.includes("fast") || textLower.includes("immediately")) {
    urgency = "high";
  } else if (textLower.includes("whenever") || textLower.includes("slow") || textLower.includes("next week")) {
    urgency = "low";
  }

  const generatedAIPredicts = generateServerFallbackSuggestion(brand, model, voiceFormatted);

  return {
    brand,
    model,
    description,
    urgency,
    type,
    possibleIssue: generatedAIPredicts.possibleIssue,
    suggestedRepair: generatedAIPredicts.recommendedRepair,
    estimatedCostMin: generatedAIPredicts.estimatedCostMin,
    estimatedCostMax: generatedAIPredicts.estimatedCostMax,
    estimatedDuration: generatedAIPredicts.estimatedDuration
  };
}

// ----------------------------------------------------
// VITE OR STATIC ASSETS ROUTING
// ----------------------------------------------------

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
    app.get("*", (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[SwiftServe Server] Running and ready on http://localhost:${PORT}`);
  });
}

startServer();
