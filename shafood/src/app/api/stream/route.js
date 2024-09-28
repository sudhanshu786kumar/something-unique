import { NextResponse } from 'next/server';
import Pusher from 'pusher';

const pusher = new Pusher({
    appId: process.env.NEXT_PUBLIC_PUSHER_APP_ID,
    key: process.env.NEXT_PUBLIC_PUSHER_KEY,
    secret: process.env.NEXT_PUBLIC_PUSHER_SECRET,
    cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER,
    useTLS: true,
});

let clients = [];

export async function GET(request) {
  const stream = new ReadableStream({
    start(controller) {
      // Add the client to the list
      clients.push(controller);

      // Keep the connection alive
      const keepAlive = setInterval(() => {
        const message = JSON.stringify({ message: 'Keep alive' });
        controller.enqueue(new TextEncoder().encode(`data: ${message}\n\n`)); // Convert string to Uint8Array
      }, 10000);

      // Cleanup on close
      request.signal.addEventListener('abort', () => {
        clearInterval(keepAlive);
        clients = clients.filter(client => client !== controller);
      });
    },
  });

  const res = new Response(stream);
  res.headers.set('Content-Type', 'text/event-stream');
  res.headers.set('Cache-Control', 'no-cache');
  res.headers.set('Connection', 'keep-alive');

  return res;
}

export function sendLocationUpdate(location) {
    // Trigger the location update event
    pusher.trigger(`location-updates`, 'location-update', location);
}
