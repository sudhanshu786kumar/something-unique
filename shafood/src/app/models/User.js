import clientPromise from '../lib/mongodb';
import { ObjectId } from 'mongodb';

export async function createUser(userData) {
  const client = await clientPromise;
  const db = client.db();
  const userWithDefaults = {
    ...userData,
    isSharing: false,
    isOrdering: false,
    location: null,
    online: false, // Default to offline
    createdAt: new Date(),
    updatedAt: new Date()
  };
  const result = await db.collection('users').insertOne(userWithDefaults);
  return result.insertedId;
}

export async function getUserByEmail(email) {
  const client = await clientPromise;
  const db = client.db();
  return db.collection('users').findOne({ email });
}

export async function getUserById(id) {
  const client = await clientPromise;
  const db = client.db();
  return db.collection('users').findOne({ _id: new ObjectId(id) });
}

// Add this function to update the online status
export async function updateUser(id, updateData) {
  const client = await clientPromise;
  const db = client.db();
  const result = await db.collection('users').updateOne(
    { _id: new ObjectId(id) },
    { 
      $set: { 
        ...updateData,
        updatedAt: new Date()
      } 
    }
  );
  return result.modifiedCount > 0;
}

export async function getAllUsers() {
  const client = await clientPromise;
  const db = client.db();
  return db.collection('users').find({}).toArray();
}

// Define the updateUserPreferences function
export const updateUserPreferences = async (userId, preferences) => {
  const client=await clientPromise;
  const db = client.db();
  const userCollection = db.collection('users');
  const result = await userCollection.updateOne(
    { _id: new ObjectId(userId) },
    { 
      $set: { 
        ...preferences,
        preferences: preferences
      } 
    } // Assuming preferences is an object containing user preferences
  );
  return result;
};

// Ensure you export the function

export async function findOrCreateUser(userData) {
  const client = await clientPromise;
  const db = client.db();
  const existingUser = await getUserByEmail(userData.email);

  if (existingUser) {
    return existingUser._id;
  }

  const userWithDefaults = {
    ...userData,
    isSharing: false,
    isOrdering: false,
    location: null,
    online: true,
    createdAt: new Date(),
    updatedAt: new Date()
  };
  const result = await db.collection('users').insertOne(userWithDefaults);
  return result.insertedId;
}

