import { createGeospatialIndex } from '../models/User';
import clientPromise from './mongodb';

export async function initDatabase() {
  try {
    const client = await clientPromise;
    const db = client.db();
    
    // Create a 2dsphere index on the location field
    await db.collection('users').createIndex({ location: "2dsphere" });
    console.log('Geospatial index created on users collection');
    
    // Other initialization tasks...
  } catch (error) {
    console.error('Error initializing database:', error);
  }
}
