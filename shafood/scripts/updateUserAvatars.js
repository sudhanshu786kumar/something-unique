import { generateAvatar } from '../src/app/utils/avatarUtils';
import clientPromise from '../src/app/lib/mongodb';

async function updateUserAvatars() {
  try {
    const client = await clientPromise;
    const db = client.db();
    
    const users = await db.collection('users').find({
      $or: [
        { image: { $exists: false } },
        { image: null },
        { image: '' }
      ]
    }).toArray();
    
    console.log(`Found ${users.length} users without avatars`);
    
    for (const user of users) {
      const avatarUrl = generateAvatar(user.email);
      
      await db.collection('users').updateOne(
        { _id: user._id },
        { $set: { image: avatarUrl } }
      );
      
      console.log(`Updated avatar for user: ${user.email}`);
    }
    
    console.log('Avatar update complete!');
  } catch (error) {
    console.error('Error updating avatars:', error);
  } finally {
    process.exit();
  }
}

updateUserAvatars(); 