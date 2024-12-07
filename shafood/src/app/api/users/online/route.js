import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import clientPromise from '@/app/lib/mongodb';
import { authOptions } from '../../auth/[...nextauth]/route';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db();

    const onlineUsers = await db.collection('users')
      .find({ 
        isOnline: true,
        lastSeen: { 
          $gte: new Date(Date.now() - 5 * 60 * 1000) // Consider users online if seen in last 5 minutes
        }
      })
      .project({ _id: 1 })
      .toArray();

    return NextResponse.json({
      onlineUsers: onlineUsers.map(user => user._id.toString())
    });

  } catch (error) {
    console.error('Error fetching online users:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 