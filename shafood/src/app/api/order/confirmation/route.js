// src/app/api/order/confirm/route.js
import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";
import clientPromise from "../../../lib/mongodb";
import { ObjectId } from 'mongodb';

export async function POST(request) {
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { chatId } = await request.json();

    if (!chatId) {
        return NextResponse.json({ error: "Chat ID is required" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db();

    const chat = await db.collection('chats').findOne({ _id: new ObjectId(chatId) });

    if (!chat) {
        return NextResponse.json({ error: "Chat not found" }, { status: 404 });
    }

    // Update user's confirmation status
    await db.collection('chats').updateOne(
        { _id: new ObjectId(chatId) },
        { $set: { [`confirmations.${session.user.id}`]: true } }
    );

    // Check if all users have confirmed
    const allConfirmed = Object.values(chat.confirmations).every(status => status === true);

    if (allConfirmed) {
        // Distribute money
        const orderer = chat.orderer;
        const totalAmount = chat.totalAmount;
        const userCount = chat.users.length;
        const amountPerUser = totalAmount / userCount;

        for (const userId of chat.users) {
            if (userId !== orderer) {
                await db.collection('users').updateOne(
                    { _id: new ObjectId(userId) },
                    { $inc: { walletBalance: -amountPerUser } }
                );
            }
        }

        await db.collection('users').updateOne(
            { _id: new ObjectId(orderer) },
            { $inc: { walletBalance: totalAmount } }
        );

        await db.collection('chats').updateOne(
            { _id: new ObjectId(chatId) },
            { $set: { orderStatus: 'completed' } }
        );

        return NextResponse.json({ success: true, message: "Order completed and funds distributed" });
    } else {
        return NextResponse.json({ success: true, message: "Confirmation recorded" });
    }
}