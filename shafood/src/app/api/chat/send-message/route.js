import { NextResponse } from 'next/server';
import { sendMessageToChat } from '@/app/models/Chat'; // Adjust the import based on your project structure

export async function POST(request) {
  const { message, sender, chatId,id } = await request.json();

  if (!message || !sender || !chatId) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  try {
    // Send the message to the chat
    const sentMessage = await sendMessageToChat(chatId, message,sender, id);

    // Return the sent message as a response
    return NextResponse.json(sentMessage, { status: 200 });
  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}
