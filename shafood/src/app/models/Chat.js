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

export const getChatMessages = async (chatId) => {
    const client = await clientPromise;
    const db = client.db();
    const chatCollection = db.collection('chats');
    const chatObjectId = typeof chatId === 'string' ? new ObjectId(chatId) : chatId;
    const chat = await chatCollection.findOne({ _id: chatObjectId });
    return chat ? chat.messages: [];
};

export const sendMessageToChat = async (chatId, text, sender, id, messageType = 'text', additionalData = null) => {
    const client = await clientPromise;
    const db = client.db();
    const chatCollection = db.collection('chats');

    const message = { 
        id, 
        text, 
        sender, 
        createdAt: new Date(),
        messageType,
        additionalData
    };

    const chatObjectId = typeof chatId === 'string' ? new ObjectId(chatId) : chatId;

    try {
        const chat = await chatCollection.findOne({ _id: chatObjectId });
        if (!chat) {
            throw new Error('Chat not found');
        }

        const result = await chatCollection.updateOne(
            { _id: chatObjectId },
            { $push: { messages: message } }
        );

        const pusher = new Pusher({
            appId: process.env.NEXT_PUBLIC_PUSHER_APP_ID,
            key: process.env.NEXT_PUBLIC_PUSHER_KEY,
            secret: process.env.NEXT_PUBLIC_PUSHER_SECRET,
            cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER,
            useTLS: true,
        });

        await pusher.trigger(`chat-${chatObjectId}`, 'new-message', message);

        return message;
    } catch (error) {
        console.error('Error sending message:', error);
        throw new Error('Failed to send message');
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
export const findOrCreateChatSession = async (userIds, creatorId) => {
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
            orderStatus: 'pending',
            orderer: null,
            provider: null,
            totalAmount: 0,
            deposits: {},
            creatorId: creatorId
        };
        const result = await chatCollection.insertOne(newChat);
        return result.insertedId; // Return new chat ID
    }
};