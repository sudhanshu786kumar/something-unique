import { NextResponse } from 'next/server';
import { getAllUsers } from '@/app/models/User';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';

const EARTH_RADIUS = 6371; // Earth's radius in kilometers

function calculateDistance(lat1, lon1, lat2, lon2) {
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return EARTH_RADIUS * c;
}

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const latitude = parseFloat(searchParams.get('latitude'));
    const longitude = parseFloat(searchParams.get('longitude'));
    const radius = parseFloat(searchParams.get('radius')) || 7;
    const foodProviders = searchParams.get('foodProviders')?.split(',') || [];

    if (isNaN(latitude) || isNaN(longitude)) {
      return NextResponse.json({ error: 'Invalid location' }, { status: 400 });
    }

    console.log('Search parameters:', {
      latitude,
      longitude,
      radius,
      foodProviders
    });

    const allUsers = await getAllUsers();
    
    const nearbyUsers = allUsers
      .filter(user => {
        // Skip if it's the current user
        if (user._id.toString() === session.user.id) return false;

        // Skip if user is not online
        if (!user.online && !user.isOnline) return false;

        // Skip if no location
        if (!user.location?.latitude || !user.location?.longitude) return false;

        // Calculate distance
        const distance = calculateDistance(
          latitude,
          longitude,
          user.location.latitude,
          user.location.longitude
        );

        // Check if within radius
        if (distance > radius) return false;

        // Check if food providers match (if specified)
        if (foodProviders.length > 0) {
          const userProviders = user.foodProviders || user.preferences?.foodProviders || [];
          if (!foodProviders.some(provider => userProviders.includes(provider))) {
            return false;
          }
        }

        return true;
      })
      .map(user => {
        // Calculate distance once for each user
        const distance = calculateDistance(
          latitude,
          longitude,
          user.location.latitude,
          user.location.longitude
        );

        return {
          id: user._id.toString(),
          name: user.name,
          distance: Number(distance.toFixed(1)), // Keep as number but rounded to 1 decimal
          preferredProviders: user.foodProviders || user.preferences?.foodProviders || [],
          online: user.online || user.isOnline || false,
          lastSeen: user.lastSeen || user.updatedAt,
          location: user.location
        };
      })
      .sort((a, b) => a.distance - b.distance); // Sort by distance

    console.log(`Found ${nearbyUsers.length} nearby users`);

    return NextResponse.json(nearbyUsers);
  } catch (error) {
    console.error('Error fetching nearby users:', error);
    return NextResponse.json({ error: 'Failed to fetch nearby users' }, { status: 500 });
  }
}
