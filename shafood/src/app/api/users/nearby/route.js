import { NextResponse } from 'next/server';
import { getAllUsers } from '@/app/models/User';

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
  const { searchParams } = new URL(request.url);
  const latitude = parseFloat(searchParams.get('latitude'));
  const longitude = parseFloat(searchParams.get('longitude'));
  const radius = parseFloat(searchParams.get('radius')) || 7;
  const foodProviders = searchParams.get('foodProviders')?.split(',') || [];
  const priceRange = searchParams.get('priceRange');

  if (isNaN(latitude) || isNaN(longitude)) {
    return NextResponse.json({ error: 'Invalid latitude or longitude' }, { status: 400 });
  }

  try {
    const allUsers = await getAllUsers();
    const nearbyUsers = allUsers.filter(user => {
      if (!user.location) return false;
      const distance = calculateDistance(latitude, longitude, user.location.latitude, user.location.longitude);
      const matchesFoodProviders = foodProviders.length === 0 || (user.preferences?.foodProviders && user.preferences.foodProviders.some(provider => foodProviders.includes(provider)));
      const matchesPriceRange = !priceRange || user.preferences?.priceRange === priceRange;
      return distance <= radius && matchesFoodProviders && matchesPriceRange;
    }).map(user => ({
      id: user._id,
      name: user.name,
      distance: calculateDistance(latitude, longitude, user.location.latitude, user.location.longitude),
      preferredProviders: user.preferences?.foodProviders || []
    }));

    return NextResponse.json(nearbyUsers);
  } catch (error) {
    console.error('Error fetching nearby users:', error);
    return NextResponse.json({ error: 'Failed to fetch nearby users' }, { status: 500 });
  }
}
