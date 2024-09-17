import { NextResponse } from 'next/server';
import { getAllUsers } from '@/app/models/User';

export async function GET() {
  const users = await getAllUsers();
  
  const userLocations = users.map(user => ({
    id: user._id,
    name: user.name,
    location: user.location,
  }));

  return NextResponse.json(userLocations);
}
