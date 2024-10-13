import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";
import clientPromise from "../../lib/mongodb";
import { ObjectId } from 'mongodb';

export async function GET(request) {
    console.log('GET /api/wallet called');
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            console.log('Unauthorized access attempt');
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        console.log('Session user:', session.user);

        const client = await clientPromise;
        const db = client.db();
        
        console.log('Searching for user with ID:', session.user.id);
        let user = await db.collection('users').findOne({ _id: new ObjectId(session.user.id) });
        console.log('Database query result:', user);

        if (!user) {
            console.log('User not found, trying string ID');
            user = await db.collection('users').findOne({ _id: session.user.id });
            console.log('Database query result with string ID:', user);
            if (!user) {
                return NextResponse.json({ error: "User not found" }, { status: 404 });
            }
        }

        if (!user.hasOwnProperty('walletBalance')) {
            console.log('Wallet balance not found, initializing to 0');
            await db.collection('users').updateOne(
                { _id: user._id },
                { $set: { walletBalance: 0 } }
            );
            return NextResponse.json({ balance: 0 });
        }

        console.log('Returning wallet balance:', user.walletBalance);
        return NextResponse.json({ balance: user.walletBalance });
    } catch (error) {
        console.error('Error in GET /api/wallet:', error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function POST(request) {
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { amount } = await request.json();
    if (typeof amount !== 'number' || amount <= 0) {
        return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db();
    
    try {
        const result = await db.collection('users').updateOne(
            { _id: new ObjectId(session.user.id) },
            { $inc: { walletBalance: amount } }
        );

        if (result.modifiedCount === 1) {
            const updatedUser = await db.collection('users').findOne({ _id: new ObjectId(session.user.id) });
            return NextResponse.json({ newBalance: updatedUser.walletBalance });
        } else {
            return NextResponse.json({ error: "Failed to update balance" }, { status: 500 });
        }
    } catch (error) {
        console.error('Error updating wallet balance:', error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}