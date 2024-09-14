import clientPromise from '../lib/mongodb';
import { ObjectId } from 'mongodb';

export async function createGroup(groupData) {
  const client = await clientPromise;
  const db = client.db();
  const result = await db.collection('groups').insertOne(groupData);
  return result.insertedId;
}

export async function getGroupById(id) {
  const client = await clientPromise;
  const db = client.db();
  return db.collection('groups').findOne({ _id: new ObjectId(id) });
}

export async function addUserToGroup(groupId, userId) {
  const client = await clientPromise;
  const db = client.db();
  return db.collection('groups').updateOne(
    { _id: new ObjectId(groupId) },
    { $addToSet: { members: new ObjectId(userId) } }
  );
}
