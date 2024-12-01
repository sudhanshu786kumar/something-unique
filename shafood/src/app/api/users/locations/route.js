import { NextResponse } from 'next/server';
import { getAllUsers } from '@/app/models/User';
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userIds = searchParams.get('userIds')?.split(',') || [];
    
    const users = await getAllUsers();
    
    let userLocations;
    if (userIds.length > 0) {
      // Filter users by the provided userIds
      userLocations = users
        .filter(user => userIds.includes(user._id.toString()))
        .map(user => ({
          id: user._id,
          name: user.name,
          location: user.location,
        }));
    } else {
      // If no userIds provided, return all users (maintain backward compatibility)
      userLocations = users.map(user => ({
        id: user._id,
        name: user.name,
        location: user.location,
      }));
    }

    return NextResponse.json(userLocations);
  } catch (error) {
    console.error('Error fetching user locations:', error);
    return NextResponse.json({ error: "Failed to fetch user locations" }, { status: 500 });
  }
}
