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
  console.log(`User update result for user ${id}:`, result);
  return result.modifiedCount > 0;
}

export async function getAllUsers() {
  const client = await clientPromise;
  const db = client.db();
  return db.collection('users').find({}).toArray();
}

