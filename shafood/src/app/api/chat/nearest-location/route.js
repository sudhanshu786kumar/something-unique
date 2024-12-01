import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";

// Helper function to calculate distance between two points using Haversine formula
function distance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// Weiszfeld's algorithm to find geometric median
function geometricMedian(points, maxIterations = 100, tolerance = 1e-6) {
  // Initial guess: arithmetic mean of all points
  let median = points.reduce((sum, p) => ({
    latitude: sum.latitude + p.latitude / points.length,
    longitude: sum.longitude + p.longitude / points.length
  }), { latitude: 0, longitude: 0 });

  for (let i = 0; i < maxIterations; i++) {
    let numeratorLat = 0, numeratorLon = 0, denominator = 0;
    
    for (const point of points) {
      const dist = distance(median.latitude, median.longitude, point.latitude, point.longitude);
      if (dist === 0) continue;
      
      const weight = 1 / dist;
      numeratorLat += point.latitude * weight;
      numeratorLon += point.longitude * weight;
      denominator += weight;
    }

    const newMedian = {
      latitude: numeratorLat / denominator,
      longitude: numeratorLon / denominator
    };

    // Check if the solution has converged
    const change = distance(median.latitude, median.longitude, newMedian.latitude, newMedian.longitude);
    median = newMedian;

    if (change < tolerance) break;
  }

  return median;
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { chatId, currentUserId, userLocations } = await request.json();

    if (!chatId || !currentUserId || !userLocations || userLocations.length === 0) {
      return NextResponse.json({ error: "Missing required data" }, { status: 400 });
    }

    // Filter out any invalid locations
    const validLocations = userLocations
      .filter(user => user.location && 
        typeof user.location.latitude === 'number' && 
        typeof user.location.longitude === 'number'
      )
      .map(user => user.location);

    if (validLocations.length === 0) {
      return NextResponse.json({ error: "No valid user locations provided" }, { status: 400 });
    }

    // Calculate the optimal meeting point using geometric median
    const optimalLocation = geometricMedian(validLocations);

    // Calculate distances from optimal point to each user
    const distances = validLocations.map(loc => 
      distance(optimalLocation.latitude, optimalLocation.longitude, loc.latitude, loc.longitude)
    );

    return NextResponse.json({
      latitude: optimalLocation.latitude,
      longitude: optimalLocation.longitude,
      averageDistance: distances.reduce((a, b) => a + b, 0) / distances.length,
      maxDistance: Math.max(...distances)
    });

  } catch (error) {
    console.error('Error calculating nearest location:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
