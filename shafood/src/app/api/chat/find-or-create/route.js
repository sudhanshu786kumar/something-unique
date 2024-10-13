import { NextResponse } from 'next/server';
import { findOrCreateChatSession } from '@/app/models/Chat';
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";

export async function POST(request) {
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { userIds } = await request.json();

    if (!userIds || !Array.isArray(userIds)) {
        return NextResponse.json({ error: 'Invalid user IDs' }, { status: 400 });
    }

    try {
        const chatId = await findOrCreateChatSession(userIds, session.user.id);
        return NextResponse.json({ chatId }, { status: 200 });
    } catch (error) {
        console.error('Error finding or creating chat session:', error);
        return NextResponse.json({ error: 'Failed to find or create chat session' }, { status: 500 });
    }
}