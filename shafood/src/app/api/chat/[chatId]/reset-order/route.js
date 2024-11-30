import { NextResponse } from 'next/server';
import clientPromise from '@/app/lib/mongodb';
import { ObjectId } from 'mongodb';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import Pusher from 'pusher';

export async function POST(request, { params }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { chatId } = params;
        const client = await clientPromise;
        const db = client.db();

        // Reset the chat's order-related fields
        await db.collection('chats').updateOne(
            { _id: new ObjectId(chatId) },
            {
                $set: {
                    orderStatus: 'pending',
                    orderer: null,
                    provider: null,
                    totalAmount: 0,
                    deposits: {},
                    userStatuses: {}
                }
            }
        );

        // Notify other users about the reset
        const pusher = new Pusher({
            appId: process.env.NEXT_PUBLIC_PUSHER_APP_ID,
            key: process.env.NEXT_PUBLIC_PUSHER_KEY,
            secret: process.env.NEXT_PUBLIC_PUSHER_SECRET,
            cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER,
            useTLS: true
        });

        await pusher.trigger(`chat-${chatId}`, 'order-update', {
            type: 'reset',
            orderStatus: 'pending',
            userStatuses: {}
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error resetting order:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
} 