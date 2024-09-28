import { NextResponse } from 'next/server';
import { updateUser } from '@/app/models/User';
import Pusher from 'pusher';

const pusher = new Pusher({
    appId: process.env.NEXT_PUBLIC_PUSHER_APP_ID,
    key: process.env.NEXT_PUBLIC_PUSHER_KEY,
    secret: process.env.NEXT_PUBLIC_PUSHER_SECRET,
    cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER,
    useTLS: true,
});

export async function POST(request) {
  const { userId, latitude, longitude } = await request.json();
  await updateUser(userId, { location: { latitude, longitude } });
  
  // Trigger a Pusher event with the location update
  await pusher.trigger('location-updates', 'location-update', {
    userId,
    latitude,
    longitude,
  });

  return NextResponse.json({ message: 'Location updated' });
}
