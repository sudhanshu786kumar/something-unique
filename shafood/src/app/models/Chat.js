 // Adjust the import based on your database setup

import clientPromise from "../lib/mongodb";

import { ObjectId } from "mongodb";
import Pusher from 'pusher'; // Use the server-side Pusher library

export const findExistingGroupChat = async (userIds) => {
    const client = await clientPromise;
    const db = client.db();
    const chatCollection = db.collection('chats');

    // Find a chat that includes all the user IDs
    const chat = await chatCollection.findOne({
        users: { $all: userIds }
    });

    return chat; // Return the found chat or null if not found
};

// export const createGroupChat = async (userIds, creatorId) => {
//     const client = await clientPromise;
//     const db = client.db();
//     const chatCollection = db.collection('chats');

//     const newChat = {
//         users: [...userIds, creatorId], // Include the creator in the chat
//         messages: [], // Initialize with an empty messages array
//         createdAt: new Date(),
//     };

//     const result = await chatCollection.insertOne(newChat);
    
//     // Notify all users in the chat about the new chat
//     userIds.forEach(userId => {
//         notifyNewChat(userId); // Notify each user about the new chat
//     });
    
//     return { id: result.insertedId, ...newChat }; // Return the new chat object
// };

export const getChatMessages = async (chatId) => {
    const client = await clientPromise;
    const db = client.db();
    const chatCollection = db.collection('chats');
    const chatObjectId = typeof chatId === 'string' ? new ObjectId(chatId) : chatId;
    const chat = await chatCollection.findOne({ _id: chatObjectId });
    console.log("hiiiiiiiiiiiiiii",chat);
    return chat ? chat.messages: [];
};

export const sendMessageToChat = async (chatId, text, sender) => {
    const client = await clientPromise;
    const db = client.db();
    const chatCollection = db.collection('chats');

    const message = { text, sender, createdAt: new Date() }; // Adjust sender as needed

    // Convert chatId to ObjectId using 'new'
    const chatObjectId = typeof chatId === 'string' ? new ObjectId(chatId) : chatId;

    try {
        // Check if the chat exists
        const chat = await chatCollection.findOne({ _id: chatObjectId });
        if (!chat) {
            console.error('Chat not found for ID:', chatId);
            throw new Error('Chat not found'); // Throw an error if chat does not exist
        }

        const result = await chatCollection.updateOne(
            { _id: chatObjectId },
            { $push: { messages: message } } // Push the new message to the messages array
        );

        console.log('Update result:', result);
        if (result.modifiedCount === 0) {
            console.warn('No documents were modified. Check if the chatId is correct and if the message is being pushed correctly.');
        }

        // Notify clients about the new message using Pusher
        const pusher = new Pusher({
            appId: process.env.NEXT_PUBLIC_PUSHER_APP_ID,
            key: process.env.NEXT_PUBLIC_PUSHER_KEY,
            secret: process.env.NEXT_PUBLIC_PUSHER_SECRET,
            cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER,
            useTLS: true,
        });

        // Trigger the event to notify other users
        await pusher.trigger(`chat-${chatObjectId}`, 'new-message', message);

        return message;
    } catch (error) {
        console.error('Error sending message:', error);
        throw new Error('Failed to send message'); // Rethrow the error for the API route to catch
    }
};

export const getMessagesForChat = async (chatId) => {
    const client = await clientPromise;
    const db = client.db();
    const chatCollection = db.collection('chats');

    const chat = await chatCollection.findOne({ _id: chatId });
    return chat ? chat.messages : []; // Return messages or an empty array if no chat found
};

// New function to find or create a chat session
export const findOrCreateChatSession = async (userIds) => {
    const client = await clientPromise;
    const db = client.db();
    const chatCollection = db.collection('chats');

    // Find a chat that includes all the user IDs
    const chat = await chatCollection.findOne({
        users: { $all: userIds }
    });

    if (chat) {
        return chat._id; // Return existing chat ID
    } else {
        // Create a new chat session if none exists
        const newChat = {
            users: userIds,
            messages: [],
            createdAt: new Date(),
        };
        const result = await chatCollection.insertOne(newChat);
        return result.insertedId; // Return new chat ID
    }
};