 // Adjust the import based on your database setup

import clientPromise from "../lib/mongodb";
import { sendMessageUpdate } from '@/app/api/chat/[chatId]/stream/route'; // Adjust the import based on your project structure
import { notifyNewChat } from '@/app/api/chat/notifications/[userId]/route'; // Adjust the import based on your project structure

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

export const createGroupChat = async (userIds, creatorId) => {
    const client = await clientPromise;
    const db = client.db();
    const chatCollection = db.collection('chats');

    const newChat = {
        users: [...userIds, creatorId], // Include the creator in the chat
        messages: [], // Initialize with an empty messages array
        createdAt: new Date(),
    };

    const result = await chatCollection.insertOne(newChat);
    
    // Notify all users in the chat about the new chat
    userIds.forEach(userId => {
        notifyNewChat(userId); // Notify each user about the new chat
    });
    
    return { id: result.insertedId, ...newChat }; // Return the new chat object
};

export const getChatMessages = async (chatId) => {
    const client = await clientPromise;
    const db = client.db();
    const chatCollection = db.collection('chats');

    const chat = await chatCollection.findOne({ _id: chatId });
    return chat ? chat.messages : [];
};

export const sendMessageToChat = async (chatId, text) => {
    const client = await clientPromise;
    const db = client.db();
    const chatCollection = db.collection('chats');

    const message = { text, sender: 'User', createdAt: new Date() }; // Adjust sender as needed
    console.log('Sending message:', message,chatId); // Debug log
    await chatCollection.updateOne(
        { _id: chatId },
        { $push: { messages: message } } // Push the new message to the messages array
    );

    sendMessageUpdate(chatId, message); // Notify clients about the new message
    return message;
};