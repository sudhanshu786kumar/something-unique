import clientPromise from '../lib/mongodb';
import { ObjectId } from 'mongodb';

export async function createOrder(orderData) {
  const client = await clientPromise;
  const db = client.db();
  const result = await db.collection('orders').insertOne(orderData);
  return result.insertedId;
}

export async function getOrdersByUserId(userId) {
  const client = await clientPromise;
  const db = client.db();
  return db.collection('orders').find({ userId: new ObjectId(userId) }).toArray();
}
