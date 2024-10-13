// src/app/api/wallet/deposit/route.js
import { NextResponse } from 'next/server';
import clientPromise from '../../../lib/mongodb';
import { ObjectId } from 'mongodb';

export async function POST(req) {
    const { userId, amount } = await req.json();

    const client = await clientPromise;
    const db = client.db();

    try {
        const result = await db.collection('users').updateOne(
            { _id: new ObjectId(userId) },
            { $inc: { walletBalance: amount } }
        );

        if (result.modifiedCount === 1) {
            return NextResponse.json({ success: true });
        } else {
            return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
        }
    } catch (error) {
        console.error('Error depositing to wallet:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}