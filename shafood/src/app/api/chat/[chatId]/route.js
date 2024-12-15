import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";
import clientPromise from "../../../lib/mongodb";
import { ObjectId } from 'mongodb';

async function validateChatAccess(db, chatId, userId) {
  try {
    const chat = await db.collection('chats').findOne({
      _id: new ObjectId(chatId),
      users: userId
    });
    
    if (!chat) {
      return null;
    }
    
    // Additional validation if needed
    return chat;
  } catch (error) {
    console.error('Error validating chat access:', error);
    return null;
  }
}

export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    
    // Check authentication first
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Please login to continue" }, { status: 401 });
    }

    const chatId = params.chatId;
    if (!chatId) {
      return NextResponse.json({ error: "Chat ID is required" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db();

    // Strict validation
    const chat = await validateChatAccess(db, chatId, session.user.id);
    if (!chat) {
      return NextResponse.json({ error: "Chat not found or access denied" }, { status: 403 });
    }

    return NextResponse.json(chat);
  } catch (error) {
    console.error('Error fetching chat:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
} 