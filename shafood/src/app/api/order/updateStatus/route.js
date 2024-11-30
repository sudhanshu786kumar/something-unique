// src/app/api/order/updateStatus/route.js
import { NextResponse } from 'next/server';
import clientPromise from '@/app/lib/mongodb';
import { ObjectId } from 'mongodb';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import Pusher from 'pusher';

export async function POST(req) {
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { chatId, status, ordererId, resetUserStatuses } = await req.json();

    const client = await clientPromise;
    const db = client.db();
    const chatsCollection = db.collection('chats');

    try {
        const chat = await chatsCollection.findOne({ _id: new ObjectId(chatId) });
        
        if (!chat) {
            return NextResponse.json({ error: "Chat not found" }, { status: 404 });
        }

        const updateData = { 
            orderStatus: status,
            lastUpdated: new Date()
        };

        if (status === 'pending' || resetUserStatuses) {
            updateData.orderer = null;
            updateData.userStatuses = {};
        } else {
            updateData.orderer = ordererId;
        }

        // Update the chat document
        await chatsCollection.updateOne(
            { _id: new ObjectId(chatId) },
            { $set: updateData }
        );

        // Fetch the updated chat data
        const updatedChat = await chatsCollection.findOne({ _id: new ObjectId(chatId) });

        // Initialize Pusher
        const pusher = new Pusher({
            appId: process.env.NEXT_PUBLIC_PUSHER_APP_ID,
            key: process.env.NEXT_PUBLIC_PUSHER_KEY,
            secret: process.env.NEXT_PUBLIC_PUSHER_SECRET,
            cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER,
            useTLS: true
        });

        // Trigger Pusher event with complete updated data
        await pusher.trigger(`chat-${chatId}`, 'order-update', {
            type: 'status-update',
            orderStatus: updatedChat.orderStatus,
            userStatuses: updatedChat.userStatuses || {},
            ordererId: updatedChat.orderer,
            lastUpdated: updatedChat.lastUpdated
        });

        return NextResponse.json({ 
            success: true,
            orderStatus: updatedChat.orderStatus,
            userStatuses: updatedChat.userStatuses || {},
            ordererId: updatedChat.orderer
        });
    } catch (error) {
        console.error('Error updating order status:', error);
        return NextResponse.json({ error: "Internal server error", details: error.message }, { status: 500 });
    }
}
