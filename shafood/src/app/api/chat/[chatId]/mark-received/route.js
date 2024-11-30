import { NextResponse } from 'next/server';



import clientPromise from '@/app/lib/mongodb';



import { ObjectId } from 'mongodb';



import { getServerSession } from 'next-auth';



import { authOptions } from '../../auth/[...nextauth]/route';



import Pusher from 'pusher';







export async function POST(request, { params }) {



    try {



        const session = await getServerSession(authOptions);



        if (!session) {



            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });



        }







        const { chatId } = params;



        const { userId } = await request.json();







        const client = await clientPromise;



        const db = client.db();







        // First get the chat to check all users



        const chat = await db.collection('chats').findOne({ _id: new ObjectId(chatId) });



        if (!chat) {



            return NextResponse.json({ error: 'Chat not found' }, { status: 404 });



        }







        // Update the user's received status



        const result = await db.collection('chats').findOneAndUpdate(



            { _id: new ObjectId(chatId) },



            { 



                $set: { 



                    [`userStatuses.${userId}`]: { received: true }



                }



            },



            { returnDocument: 'after' }



        );







        // Get all users in the chat



        const chatUsers = chat.users;



        let finalOrderStatus = result.value?.orderStatus || 'ordered';







        // Check if all users have marked as received



        const allReceived = chatUsers.every(userId => 



            result.value?.userStatuses?.[userId]?.received === true



        );







        // If all users have received, update order status to completed



        if (allReceived) {



            await db.collection('chats').updateOne(



                { _id: new ObjectId(chatId) },



                { $set: { orderStatus: 'completed' } }



            );



            finalOrderStatus = 'completed';



        }







        // Get final state after all updates



        const finalState = await db.collection('chats').findOne({ _id: new ObjectId(chatId) });







        // Initialize Pusher



        const pusher = new Pusher({



            appId: process.env.NEXT_PUBLIC_PUSHER_APP_ID,



            key: process.env.NEXT_PUBLIC_PUSHER_KEY,



            secret: process.env.NEXT_PUBLIC_PUSHER_SECRET,



            cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER,



            useTLS: true



        });







        // Trigger real-time update with the correct status



        await pusher.trigger(`chat-${chatId}`, 'order-update', {



            type: 'status-update',



            orderStatus: finalOrderStatus,



            userStatuses: finalState.userStatuses || {},



            ordererId: finalState.orderer,



            lastMarkedUserId: userId,



            receivedCount: Object.values(finalState.userStatuses || {})



                .filter(status => status.received).length



        });







        return NextResponse.json({



            success: true,



            userStatuses: finalState.userStatuses || {},



            orderStatus: finalOrderStatus,



            receivedCount: Object.values(finalState.userStatuses || {})



                .filter(status => status.received).length



        });



    } catch (error) {



        console.error('Error marking as received:', error);



        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });



    }



} 


