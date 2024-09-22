import { NextResponse } from 'next/server';
import { updateUserPreferences } from '@/app/models/User'; // Ensure this function exists

export async function POST(request) {
  const { userId, foodProviders, priceRange, locationRange } = await request.json();

  // Validate input
  if (!userId || !Array.isArray(foodProviders) || typeof priceRange !== 'string' || isNaN(locationRange)) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  }

  try {
    // Update user preferences in the database
    await updateUserPreferences(userId, { foodProviders, priceRange, locationRange });
    return NextResponse.json({ message: `Preferences updated successfully ${foodProviders}` });
  } catch (error) {
    console.error('Error updating preferences:', error); // Log the error for debugging
    return NextResponse.json({ error: 'Failed to update preferences' }, { status: 500 });
  }
}
