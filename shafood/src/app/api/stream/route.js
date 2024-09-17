import { NextResponse } from 'next/server';

let clients = [];

export async function GET(request) {
  const stream = new ReadableStream({
    start(controller) {
      // Add the client to the list
      clients.push(controller);

      // Keep the connection alive
      const keepAlive = setInterval(() => {
        controller.enqueue(`data: ${JSON.stringify({ message: 'Keep alive' })}\n\n`);
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
  clients.forEach(client => {
    client.enqueue(`data: ${JSON.stringify(location)}\n\n`);
  });
}
