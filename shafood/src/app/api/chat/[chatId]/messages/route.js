import { NextResponse } from 'next/server';
import { getChatMessages } from '@/app/models/Chat'; // Adjust the import based on your project structure

export async function GET(request, { params }) {
  const { chatId } = params;

  try {
    const messages = await getChatMessages(chatId);
    console.log("messages",messages);
    return NextResponse.json({ messages }, { status: 200 });
    
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
  }
}
