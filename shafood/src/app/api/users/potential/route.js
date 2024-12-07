import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import clientPromise from '@/app/lib/mongodb';

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const latitude = parseFloat(searchParams.get('latitude'));
    const longitude = parseFloat(searchParams.get('longitude'));
    const radius = parseFloat(searchParams.get('radius')) || 12; // Increased radius

    const client = await clientPromise;
    const db = client.db();

    const users = await db.collection('users').find({
      _id: { $ne: session.user.id },
      location: {
        $nearSphere: {
          $geometry: {
            type: "Point",
            coordinates: [longitude, latitude]
          },
          $maxDistance: radius * 1000 // Convert km to meters
        }
      }
    }).toArray();

    return NextResponse.json(users);
  } catch (error) {
    console.error('Error fetching potential users:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 