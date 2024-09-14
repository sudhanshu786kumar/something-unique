import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';
import { setUserLocation, updateUser } from '@/app/models/User';

export async function POST(request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { lat, lng, isSharing } = await request.json();

  try {
    if (lat && lng) {
      await setUserLocation(session.user.id, lat, lng);
    }
    
    await updateUser(session.user.id, { isSharing });

    return NextResponse.json({ message: 'Location updated successfully' });
  } catch (error) {
    console.error('Error updating user location:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
