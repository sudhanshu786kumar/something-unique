import { NextResponse } from 'next/server';
import Pusher from 'pusher';

const pusher = new Pusher({
    appId: process.env.NEXT_PUBLIC_PUSHER_APP_ID,
    key: process.env.NEXT_PUBLIC_PUSHER_KEY,
    secret: process.env.NEXT_PUBLIC_PUSHER_SECRET,
    cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER,
    useTLS: true,
});

export async function POST(request) {
    const { sender, chatId } = await request.json();

    if (!sender || !chatId) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    try {
        // Trigger the typing event
        await pusher.trigger(`chat-${chatId}`, 'typing', { sender });
        return NextResponse.json({ success: true }, { status: 200 });
    } catch (error) {
        console.error('Error sending typing event:', error);
        return NextResponse.json({ error: 'Failed to send typing event' }, { status: 500 });
    }
}
