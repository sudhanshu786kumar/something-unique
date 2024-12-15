import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import clientPromise from '@/app/lib/mongodb';
import { authOptions } from '../../auth/[...nextauth]/route'; 
import { ObjectId } from 'mongodb';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      console.error('Session user ID missing:', session);
      return NextResponse.json({ error: 'Unauthorized - Invalid session' }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db();

    // Get chats where the current user is a participant
    const chats = await db.collection('chats').find({
      users: session.user.id,
      $and: [
        { users: { $ne: null } },
        { 
          $or: [
            { messages: { $exists: true, $not: { $size: 0 } } },
            { creatorId: session.user.id }
          ]
        }
      ]
    }).toArray();

    // Get all user IDs from chats (including current user)
    const uniqueUserIds = [...new Set(
      chats.flatMap(chat => 
        chat.users.filter(userId => userId !== null)
      )
    )];

    // Get user details including current user
    const users = await db.collection('users').find({
      _id: { 
        $in: uniqueUserIds.map(id => 
          typeof id === 'string' ? new ObjectId(id) : id
        )
      }
    }).toArray();

    const userMap = new Map(
      users.map(user => [user._id.toString(), user])
    );

    const formattedChats = chats
      .filter(chat => {
        const validParticipants = chat.users.filter(userId => 
          userId !== null && 
          userMap.has(userId.toString())
        );
        return validParticipants.length > 0;
      })
      .map(chat => {
        const chatParticipants = chat.users
          .filter(userId => 
            userId !== null && 
            userMap.has(userId.toString())
          )
          .map(userId => {
            const user = userMap.get(userId.toString());
            return {
              id: user._id.toString(),
              name: user.name || 'Unknown User',
              image: user.image,
              online: user.isOnline || false
            };
          });

        const lastMessage = chat.messages && chat.messages.length > 0 
          ? chat.messages[chat.messages.length - 1] 
          : null;

        // Include all chat details
        return {
          id: chat._id.toString(),
          participants: chatParticipants,
          lastMessage: lastMessage ? {
            text: lastMessage.text || '',
            sender: lastMessage.sender || 'Unknown',
            createdAt: lastMessage.createdAt || chat.createdAt,
            type: lastMessage.type || 'text'
          } : null,
          updatedAt: chat.updatedAt || chat.createdAt,
          // Add these fields explicitly
          orderStatus: chat.orderStatus || 'pending',
          orderer: chat.orderer || null,
          provider: chat.provider || null,
          totalAmount: chat.totalAmount || 0,
          deposits: chat.deposits || {},
          creatorId: chat.creatorId,
          // Add any other fields you need
          userStatuses: chat.userStatuses || {}
        };
      });

    // Sort by most recent activity
    formattedChats.sort((a, b) => {
      const dateA = a.lastMessage?.createdAt || a.updatedAt;
      const dateB = b.lastMessage?.createdAt || b.updatedAt;
      return new Date(dateB) - new Date(dateA);
    });

    return NextResponse.json(formattedChats);

  } catch (error) {
    console.error('Error fetching chats:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 