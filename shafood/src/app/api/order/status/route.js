// src/app/api/order/status/route.js
import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";
import clientPromise from "../../../lib/mongodb";
import { ObjectId } from 'mongodb';

export async function GET(request) {
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const chatId = searchParams.get('chatId');

    if (!chatId) {
        return NextResponse.json({ error: "Chat ID is required" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db();

    // Add security check
    const chat = await db.collection('chats').findOne({
        _id: new ObjectId(chatId),
        users: session.user.id // Ensure user is a participant
    });

    if (!chat) {
        return NextResponse.json({ error: "Chat not found or access denied" }, { status: 403 });
    }

    return NextResponse.json({
        orderStatus: chat.orderStatus || 'pending',
        userStatuses: typeof chat.userStatuses === 'object' ? chat.userStatuses : {},
        orderer: chat.orderer || null
    });
}

export async function POST(request) {
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { chatId, status } = await request.json();

    if (!chatId || !status) {
        return NextResponse.json({ error: "Chat ID and status are required" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db();

    // Add security check
    const chat = await db.collection('chats').findOne({
        _id: new ObjectId(chatId),
        users: session.user.id
    });

    if (!chat) {
        return NextResponse.json({ error: "Chat not found or access denied" }, { status: 403 });
    }

    const result = await db.collection('chats').updateOne(
        { 
            _id: new ObjectId(chatId),
            users: session.user.id // Additional security check in update
        },
        { $set: { [`userStatuses.${session.user.id}`]: status } }
    );

    if (result.modifiedCount === 1) {
        return NextResponse.json({ success: true });
    } else {
        return NextResponse.json({ error: "Failed to update status" }, { status: 500 });
    }
}