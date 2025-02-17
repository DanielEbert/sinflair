import WebSocket, { WebSocketServer } from 'ws';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';

dotenv.config();


const wss = new WebSocketServer({
    port: 1443,
    verifyClient: (info, cb) => {
        const apiKey = info.req.headers['x-api-key'];
        const validApiKey = process.env.API_KEY;
        apiKey == validApiKey ? cb(true) : cb(false, 401, 'Unauthorized');
    }
});

// Topic name -> set of clients
const topics = new Map();
// Client ID -> ws
const clients = new Map();

wss.on('connection', function connection(ws) {
    ws.isAlive = true;
    ws.topic = null;
    ws.clientId = uuidv4();
    clients.set(ws.clientId, ws);

    console.log(`Client connected: ${ws.clientId}, Total clients: ${clients.size}`);

    ws.on('error', (error) => { console.error(`WebSocket error for client ${ws.clientId}:`, error); });

    ws.on('message', (data, isBinary) => {
        console.log(`Server recv: ${data}`)
        if (ws.topic === null) {
            // First message
            ws.topic = data.toString().trim();
            if (!ws.topic) {
                ws.send(JSON.stringify({ type: 'error', message: 'Topic cannot be empty' }));
                return;
            }
            if (!topics.has(ws.topic)) topics.set(ws.topic, new Set());
            topics.get(ws.topic).add(ws);
            console.log(`Client ${ws.clientId} joined topic: ${ws.topic}, Topic size: ${topics.get(ws.topic).size}`);
            return;
        }

        if (!topics.has(ws.topic)) return;

        topics.get(ws.topic).forEach(client => {
            if (client === ws || client.readyState !== WebSocket.OPEN || client.topic !== ws.topic) return;
            client.send(data, { isBinary: isBinary });
        })
    });

    ws.on('close', () => {
        clients.delete(ws.clientId);
        if (!ws.topic || !topics.has(ws.topic)) return;
        topics.get(ws.topic).delete(ws);
        if (topics.get(ws.topic).size === 0) {
            topics.delete(ws.topic);
        }
    })
});

const interval = setInterval(() => {
    wss.clients.forEach((ws) => {
        if (ws.isAlive === false) {
            console.log(`Terminating inactive client: ${ws.clientId}`);
            return ws.terminate();
        }
        ws.isAlive = false;
        ws.ping();
    })
}, 30000);

wss.on('close', () => {
    clearInterval(interval)
})

console.log(`WebSocket server started on port 1443`);
