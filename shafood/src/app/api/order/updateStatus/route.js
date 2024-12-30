// src/app/api/order/updateStatus/route.js

import { NextResponse } from 'next/server';

import clientPromise from '@/app/lib/mongodb';

import { ObjectId } from 'mongodb';

import { getServerSession } from 'next-auth';

import { authOptions } from '../../auth/[...nextauth]/route';

import Pusher from 'pusher';

// Create Pusher instance with proper environment variables
const pusher = new Pusher({
    appId: process.env.PUSHER_APP_ID,
    key: process.env.NEXT_PUBLIC_PUSHER_KEY,
    secret: process.env.PUSHER_SECRET,
    cluster: process.env.PUSHER_CLUSTER,
    useTLS: true
});

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

        // Update the chat document with new status
        const updateData = {
            $set: {
                orderStatus: status,
                lastUpdated: new Date()
            }
        };

        if (resetUserStatuses) {
            updateData.$set.userStatuses = {};
        } else if (status) {
            // Update the status for the current user
            updateData.$set[`userStatuses.${session.user.id}`] = status;
        }

        const result = await chatsCollection.updateOne(
            { _id: new ObjectId(chatId) },
            updateData
        );

        // Fetch updated chat data to send in real-time update
        const updatedChat = await chatsCollection.findOne({ _id: new ObjectId(chatId) });

        try {
            // Trigger Pusher event with complete updated data
            await pusher.trigger(`order-${chatId}`, 'order-update', {
                orderStatus: updatedChat.orderStatus,
                userStatuses: updatedChat.userStatuses || {},
                orderer: updatedChat.ordererId,
                lastUpdated: updatedChat.lastUpdated,
                updatedBy: session.user.id
            });
        } catch (pusherError) {
            console.error('Pusher error:', pusherError);
            // Continue with the response even if Pusher fails
        }

        return NextResponse.json({
            message: "Status updated successfully",
            orderStatus: updatedChat.orderStatus,
            userStatuses: updatedChat.userStatuses || {},
            orderer: updatedChat.ordererId
        });
    } catch (error) {
        console.error('Error updating status:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}


