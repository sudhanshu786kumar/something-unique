import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../auth/[...nextauth]/route";
import clientPromise from "../../../../lib/mongodb";
import { ObjectId } from 'mongodb';

export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    
    // Check for authentication first
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Please login to continue" }, { status: 401 });
    }

    const chatId = params.chatId;
    if (!chatId) {
      return NextResponse.json({ error: "Chat ID is required" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db();

    // Check if user is part of the chat
    const chat = await db.collection('chats').findOne({
      _id: new ObjectId(chatId),
      users: session.user.id
    });

    if (!chat) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error validating chat access:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
} 