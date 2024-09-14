import { createGeospatialIndex } from '../models/User';
import clientPromise from './mongodb';

export async function initDatabase() {
  try {
    const client = await clientPromise;
    const db = client.db();
    await db.collection('users').createIndex({ location: "2dsphere" });
    console.log('Geospatial index created');
  } catch (error) {
    console.error('Error creating geospatial index:', error);
  }
}
