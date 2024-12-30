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

  try {
    const result = await db.collection('chats').updateOne(
      { _id: new ObjectId(chatId) },
      { 
        $set: {
          orderStatus: 'pending',
          userStatuses: {},
          orderer: null
        }
      }
    );

    if (result.modifiedCount === 0) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error cancelling order:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
} 