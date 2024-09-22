import clientPromise from '../lib/mongodb';

async function updateExistingUsers() {
  const client = await clientPromise;
  const db = client.db();
  await db.collection('users').updateMany({}, { $set: { online: false } });
  console.log('Updated existing users to set online status to false.');
}

updateExistingUsers().catch(console.error);
