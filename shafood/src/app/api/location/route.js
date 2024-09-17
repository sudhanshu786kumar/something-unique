import { NextResponse } from 'next/server';
import { sendLocationUpdate } from '../stream/route';
import { updateUser } from '@/app/models/User';

export async function POST(request) {
  const { userId, latitude, longitude } = await request.json();
  await updateUser(userId, { location: { latitude, longitude } });
  sendLocationUpdate({ userId, latitude, longitude });
  return NextResponse.json({ message: 'Location updated' });
}
