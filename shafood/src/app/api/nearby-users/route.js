import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/app/lib/mongodb';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';

export async function GET(request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const lat = parseFloat(searchParams.get('lat'));
  const lng = parseFloat(searchParams.get('lng'));

  if (isNaN(lat) || isNaN(lng)) {
    return NextResponse.json({ error: 'Invalid latitude or longitude' }, { status: 400 });
  }

  try {
    const { db } = await connectToDatabase();

    console.log(`Searching for users near lat: ${lat}, lng: ${lng}`);

    const nearbyUsers = await db.collection('users').find({
      _id: { $ne: session.user.id },
      isSharing: true,
      location: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [lng, lat]
          },
          $maxDistance: 10000 // 10km radius
        }
      }
    }).toArray();

    console.log(`Found ${nearbyUsers.length} nearby users`);

    const sanitizedUsers = nearbyUsers.map(user => ({
      id: user._id.toString(),
      name: user.name,
      lat: user.location.coordinates[1],
      lng: user.location.coordinates[0],
      isOrdering: user.isOrdering || false
    }));

    return NextResponse.json(sanitizedUsers);
  } catch (error) {
    console.error('Error fetching nearby users:', error);
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
  }
}
