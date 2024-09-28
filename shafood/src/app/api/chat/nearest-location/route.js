import { NextResponse } from 'next/server';
import clientPromise from '../../../lib/mongodb';
import { ObjectId } from 'mongodb';

// Helper function to calculate distance between two points
function distance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// Weiszfeld's algorithm to find geometric median
function geometricMedian(points, maxIterations = 100, tolerance = 1e-6) {
  let median = points.reduce((sum, p) => ({
    latitude: sum.latitude + p.latitude / points.length,
    longitude: sum.longitude + p.longitude / points.length
  }), { latitude: 0, longitude: 0 });

  for (let i = 0; i < maxIterations; i++) {
    let numeratorLat = 0, numeratorLon = 0, denominator = 0;
    for (const point of points) {
      const dist = distance(median.latitude, median.longitude, point.latitude, point.longitude);
      if (dist === 0) continue;
      const weight = 1 / dist;
      numeratorLat += point.latitude * weight;
      numeratorLon += point.longitude * weight;
      denominator += weight;
    }

    const newMedian = {
      latitude: numeratorLat / denominator,
      longitude: numeratorLon / denominator
    };

    const change = distance(median.latitude, median.longitude, newMedian.latitude, newMedian.longitude);
    median = newMedian;

    if (change < tolerance) break;
  }

  return median;
}

export async function POST(request) {
  try {
    const { chatId, currentUserId } = await request.json();

    if (!chatId || !currentUserId) {
      return NextResponse.json({ error: 'Missing required fields: chatId or currentUserId' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db();
    const chatCollection = db.collection('chats');
    const userCollection = db.collection('users');

    const chat = await chatCollection.findOne({ _id: new ObjectId(chatId) });
    if (!chat) {
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
    }

    // Get unique senders from chat messages
    const uniqueSenders = [...new Set(chat.messages.map(msg => msg.sender))];

    if (uniqueSenders.length < 2) {
      return NextResponse.json({ error: 'Not enough participants in the chat' }, { status: 400 });
    }

    // Fetch user documents for all unique senders
    const users = await userCollection.find({ name: { $in: uniqueSenders } }).toArray();

    const locations = users
      .filter(user => user && user.location && user.location.latitude && user.location.longitude)
      .map(user => ({
        latitude: user.location.latitude,
        longitude: user.location.longitude
      }));

    if (locations.length < 2) {
      return NextResponse.json({ error: 'Not enough location data. At least 2 users must have location data.' }, { status: 400 });
    }

    const optimalLocation = geometricMedian(locations);

    return NextResponse.json(optimalLocation, { status: 200 });
  } catch (error) {
    console.error('Error calculating optimal meeting point:', error);
    return NextResponse.json({ error: 'Internal server error: ' + error.message }, { status: 500 });
  }
}
