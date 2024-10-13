import { getServerSession } from "next-auth/next";
import { NextResponse } from 'next/server';
import clientPromise from "@/app/lib/mongodb";
import { ObjectId } from 'mongodb';
import { authOptions } from "../../auth/[...nextauth]/route";

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const client = await clientPromise;
    const db = client.db();
    const usersCollection = db.collection('users');

    await usersCollection.updateOne(
      { _id: new ObjectId(session.user.id) },
      { 
        $set: { 
          isOnline: true,
          lastSeen: new Date()
        } 
      }
    );

    return NextResponse.json({ message: 'User status updated to online' });
  } catch (error) {
    console.error('Error setting user online:', error);
    return NextResponse.json({ error: 'Failed to update user status' }, { status: 500 });
  }
}
