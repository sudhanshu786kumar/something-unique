import { NextResponse } from 'next/server';
import { updateUserPreferences } from '@/app/models/User';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';

export async function POST(request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { foodProviders, priceRange, locationRange } = await request.json();
    const userId = session.user.id;

    // Log the received data for debugging
    console.log('Received preferences data:', { userId, foodProviders, priceRange, locationRange });

    // More detailed validation
    const validationErrors = [];
    
    if (!Array.isArray(foodProviders)) {
      validationErrors.push('foodProviders must be an array');
    } else if (foodProviders.some(provider => typeof provider !== 'string' || !provider.trim())) {
      validationErrors.push('All food providers must be non-empty strings');
    }
    
    if (!priceRange) validationErrors.push('priceRange is required');
    if (typeof locationRange !== 'number') validationErrors.push('locationRange must be a number');

    if (validationErrors.length > 0) {
      return NextResponse.json({ 
        error: 'Invalid input', 
        validationErrors,
        received: { foodProviders, priceRange, locationRange } 
      }, { status: 400 });
    }

    // Update user preferences in the database
    const preferences = {
      foodProviders: foodProviders.map(p => p.trim()),
      priceRange,
      locationRange: Number(locationRange)
    };

    await updateUserPreferences(userId, preferences);
    
    return NextResponse.json({ 
      message: 'Preferences updated successfully',
      preferences
    });
  } catch (error) {
    console.error('Error updating preferences:', error);
    return NextResponse.json({ 
      error: 'Failed to update preferences',
      details: error.message 
    }, { status: 500 });
  }
}
