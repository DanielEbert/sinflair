import WebSocket from 'ws';
import dotenv from 'dotenv';

dotenv.config();

const ws = new WebSocket('wss://ws.sinflair.com', {
    headers: {
        'x-api-key': process.env.API_KEY
    }
});

ws.on('error', console.error);

ws.on('open', function open() {
    ws.send('audi');
    ws.send('hello world');
});

ws.on('message', function message(data) {
    console.log('received: %s', data);
});
