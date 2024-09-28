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
  const radius = parseFloat(searchParams.get('radius')) || 7; // Default to 7 km
  const foodProviders = searchParams.get('foodProviders') ? searchParams.get('foodProviders').split(',') : []; // Get food providers from query
  const priceRange = searchParams.get('priceRange') ? searchParams.get('priceRange').split('-').map(Number) : [0, Infinity]; // Get price range from query

  if (isNaN(latitude) || isNaN(longitude)) {
    return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 });
  }

  const users = await getAllUsers();
  
  const nearbyUsers = users
    .filter(user => user.location && user.online) // Check if user is online and has a location
    .map(user => ({
      id: user._id,
      name: user.name,
      distance: calculateDistance(latitude, longitude, user.location.latitude, user.location.longitude),
      preferredProviders: user.foodProviders || [], // Include preferred providers
      price: user.price || 0 // Assuming user has a price property
    }))
    .filter(user => user.distance <= radius) // Filter by distance
    .filter(user => foodProviders.length === 0 || user.preferredProviders.some(provider => foodProviders.includes(provider))) // Filter by food providers
    .filter(user => user.price <= priceRange) // Filter by price range
    .sort((a, b) => a.distance - b.distance);

  return NextResponse.json(nearbyUsers);
}
