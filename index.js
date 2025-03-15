const { makeWASocket, useMultiFileAuthState } = require('@whiskeysockets/baileys');
const axios = require('axios');
require('dotenv').config();

async function connectWhatsApp() {
    const { state, saveCreds } = await useMultiFileAuthState('auth');
    const sock = makeWASocket({ auth: state });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('messages.upsert', async ({ messages }) => {
        const m = messages[0];
        if (!m.message || m.key.fromMe) return;

        const sender = m.key.remoteJid;
        const text = m.message.conversation || m.message.extendedTextMessage?.text;

        if (text) {
            const reply = await chatWithGPT(text);
            await sock.sendMessage(sender, { text: reply });
        }
    });

    return sock;
}

async function chatWithGPT(text) {
    const apiKey = process.env.OPENAI_API_KEY;
    const res = await axios.post('https://api.openai.com/v1/chat/completions', {
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: text }],
    }, {
        headers: { 'Authorization': `Bearer ${apiKey}` }
    });

    return res.data.choices[0].message.content.trim();
}

connectWhatsApp();
