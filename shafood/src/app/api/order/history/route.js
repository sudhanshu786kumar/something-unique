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

  try {
    const orders = await db.collection('orders')
      .find({ chatId: new ObjectId(chatId) })
      .sort({ createdAt: -1 })
      .limit(10)
      .toArray();

    return NextResponse.json({ orders });
  } catch (error) {
    console.error('Error fetching order history:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
} 