import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";
import clientPromise from "../../../lib/mongodb";
import { ObjectId } from 'mongodb';
import Pusher from 'pusher';

const pusher = new Pusher({
  appId: process.env.NEXT_PUBLIC_PUSHER_APP_ID,
  key: process.env.NEXT_PUBLIC_PUSHER_KEY,
  secret: process.env.NEXT_PUBLIC_PUSHER_SECRET,
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER,
  useTLS: true,
});

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { chatId, userId, status } = await req.json();

  const client = await clientPromise;
  const db = client.db();
  const chatsCollection = db.collection('chats');

  try {
    const result = await chatsCollection.updateOne(
      { _id: new ObjectId(chatId) },
      { $set: { [`userStatuses.${userId}`]: status } }
    );

    if (result.modifiedCount === 0) {
      return NextResponse.json({ error: "Chat not found or status not updated" }, { status: 404 });
    }

    const updatedChat = await chatsCollection.findOne({ _id: new ObjectId(chatId) });

    // Trigger Pusher event
    await pusher.trigger(`chat-${chatId}`, 'user-status-update', {
      userStatuses: updatedChat.userStatuses || {},
      userId,
      status
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating user status:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

