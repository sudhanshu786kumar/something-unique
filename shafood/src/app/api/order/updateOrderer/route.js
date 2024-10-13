import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";
import clientPromise from "../../../lib/mongodb";
import { ObjectId } from 'mongodb';
import Pusher from 'pusher';

console.log('Pusher configuration:', {
  appId: process.env.NEXT_PUBLIC_PUSHER_APP_ID,
  key: process.env.NEXT_PUBLIC_PUSHER_SECRET,
  secret: process.env.NEXT_PUBLIC_PUSHER_SECRET ? '[SECRET]' : undefined,
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER,
});

const pusher = new Pusher({
  appId: process.env.NEXT_PUBLIC_PUSHER_APP_ID,
  key: process.env.NEXT_PUBLIC_PUSHER_KEY,
  secret: process.env.NEXT_PUBLIC_PUSHER_SECRET,
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER,
  useTLS: true,
});

// Replace the existing Pusher configuration check with this:
if (!pusher.config.appId || !pusher.config.key || !pusher.config.secret || !pusher.config.cluster) {
  console.error('Pusher configuration is incomplete. Please check your environment variables.',pusher.config.token);
}

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { chatId, ordererId } = await req.json();
  console.log('Received request:', { chatId, ordererId });

  const client = await clientPromise;
  const db = client.db();
  const chatsCollection = db.collection('chats');

  try {
    const result = await chatsCollection.updateOne(
      { _id: new ObjectId(chatId) },
      { $set: { ordererId: ordererId } }
    );

    console.log('Update result:', result);

    if (result.modifiedCount === 0) {
      return NextResponse.json({ error: "Chat not found or orderer not updated" }, { status: 404 });
    }

    const updatedChat = await chatsCollection.findOne({ _id: new ObjectId(chatId) });
    console.log('Updated chat:', updatedChat);

    if (pusher.config.scheme) {
      try {
        await pusher.trigger(`chat-${chatId}`, 'order-update', {
          orderStatus: updatedChat.orderStatus,
          userStatuses: updatedChat.userStatuses || {},
          ordererId: updatedChat.ordererId
        });
        console.log('Pusher event triggered successfully');
      } catch (pusherError) {
        console.error('Error triggering Pusher event:', pusherError);
      }
    } else {
      console.warn('Pusher event not triggered due to missing configuration.');
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating orderer:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
