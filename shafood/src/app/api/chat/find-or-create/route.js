import { NextResponse } from 'next/server';
import { findOrCreateChatSession } from '@/app/models/Chat'; // Adjust the import based on your project structure

export async function POST(request) {
    const { userIds } = await request.json();

    if (!userIds || !Array.isArray(userIds)) {
        return NextResponse.json({ error: 'Invalid user IDs' }, { status: 400 });
    }

    try {
        const chatId = await findOrCreateChatSession(userIds);
        return NextResponse.json({ chatId }, { status: 200 });
    } catch (error) {
        console.error('Error finding or creating chat session:', error);
        return NextResponse.json({ error: 'Failed to find or create chat session' }, { status: 500 });
    }
}
