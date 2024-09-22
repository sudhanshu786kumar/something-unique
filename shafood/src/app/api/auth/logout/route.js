import { NextResponse } from 'next/server';
import { updateUser } from '@/app/models/User';

export async function POST(request) {
  const { userId } = await request.json(); // Ensure you get the userId from the request

  if (!userId) {
    return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
  }

  try {
    await updateUser(userId, { online: false }); // Mark user as offline
    return NextResponse.json({ message: 'User marked as offline' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to mark user as offline' }, { status: 500 });
  }
}
