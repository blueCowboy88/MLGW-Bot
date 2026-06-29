const PORT = process.env.PORT || 3000;
// Change from localhost to binding to all interfaces
app.listen(PORT, '0.0.0.0', () => console.log(`Server running on port ${PORT}`));

import express from 'express';
import cors from 'cors';
import { GoogleGenAI } from '@google/genai';
import 'dotenv/config';

const app = express();
app.use(cors());
app.use(express.json());

// Initialize the Gemini client
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// In-memory store for active chat sessions (for demo purposes)
const activeChats = {};

app.post('/api/chat/start', async (req, res) => {
    const { firstName, lastName, sessionId } = req.body;

    const mlgwInstructions = 
        `You are a helpful, courteous, and professional virtual customer service assistant for ` +
        `Memphis Light Gas and Water (MLGW). You are speaking with customer ${firstName} ${lastName}. ` +
        `Your goal is to assist them with utilities queries (electricity, gas, water, billing, and outages) ` +
        `in the Memphis and Shelby County area. ` +
        `If they report an emergency (like a gas leak or downed power line), immediately instruct them to call ` +
        `MLGW Emergency at (901) 528-4465. Keep your answers concise, practical, and localized to Memphis.`;

    try {
        // Create a new chat session using gemini-2.5-flash
        const chat = ai.chats.create({
            model: 'gemini-2.5-flash',
            config: { systemInstruction: mlgwInstructions }
        });

        // Store the session
        activeChats[sessionId] = chat;

        // Generate the initial welcome message
        const response = await chat.sendMessage({
            message: `Greet me warmly by my first name (${firstName}) and ask how you can help with my MLGW account or services today.`
        });

        res.json({ reply: response.text });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to initialize chat session' });
    }
});

app.post('/api/chat/message', async (req, res) => {
    const { sessionId, message } = req.body;
    const chat = activeChats[sessionId];

    if (!chat) {
        return res.status(404).json({ error: 'Chat session not found. Please refresh.' });
    }

    try {
        const response = await chat.sendMessage({ message: message });
        res.json({ reply: response.text });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to process message' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));