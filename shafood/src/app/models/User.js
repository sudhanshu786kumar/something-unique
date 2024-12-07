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

export const getUserByEmail = async (email) => {
  const client = await clientPromise;
  const db = client.db();
  const user = await db.collection('users').findOne({ email });
  if (user) {
    user.id = user._id.toString(); // Ensure ID is always available
  }
  return user;
};

export async function getUserById(id) {
  const client = await clientPromise;
  const db = client.db();
  return db.collection('users').findOne({ _id: new ObjectId(id) });
}

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

export const updateUserPreferences = async (userId, preferences) => {
  const client = await clientPromise;
  const db = client.db();
  const userCollection = db.collection('users');
  const result = await userCollection.updateOne(
    { _id: new ObjectId(userId) },
    { 
      $set: { 
        ...preferences,
        preferences: preferences
      } 
    }
  );
  return result;
};

export const findOrCreateUser = async (userData) => {
  const client = await clientPromise;
  const db = client.db();
  const collection = db.collection('users');

  const existingUser = await collection.findOne({ email: userData.email });
  if (existingUser) {
    return existingUser._id;
  }

  const result = await collection.insertOne({
    ...userData,
    createdAt: new Date(),
    updatedAt: new Date(),
    online: true,
    lastLogin: new Date(),
  });

  return result.insertedId;
};
