import { NextResponse } from 'next/server';
import clientPromise from '@/app/lib/mongodb';
import { ObjectId } from 'mongodb';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import Pusher from 'pusher';

export async function POST(req) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { chatId, ordererId } = await req.json();
        const client = await clientPromise;
        const db = client.db();

        // Update the orderer in the database
        const result = await db.collection('chats').findOneAndUpdate(
            { _id: new ObjectId(chatId) },
            { $set: { 
                orderer: ordererId,
                orderStatus: 'pending' // Ensure status is pending when orderer changes
            }},
            { returnDocument: 'after' }
        );

        if (!result) {
            return NextResponse.json({ error: "Chat not found" }, { status: 404 });
        }

        // Initialize Pusher
        const pusher = new Pusher({
            appId: process.env.NEXT_PUBLIC_PUSHER_APP_ID,
            key: process.env.NEXT_PUBLIC_PUSHER_KEY,
            secret: process.env.NEXT_PUBLIC_PUSHER_SECRET,
            cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER,
            useTLS: true
        });

        // Trigger real-time update
        await pusher.trigger(`chat-${chatId}`, 'order-update', {
            type: 'orderer-update',
            ordererId: ordererId,
            orderStatus: result.orderStatus,
            userStatuses: result.userStatuses || {}
        });

        return NextResponse.json({ 
            success: true,
            ordererId: ordererId,
            orderStatus: result.orderStatus
        });
    } catch (error) {
        console.error('Error updating orderer:', error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
