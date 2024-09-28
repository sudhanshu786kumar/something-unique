import { NextResponse } from 'next/server';

export const runtime = 'edge'; // Add this line to use Edge Runtime

export async function GET(request) {
    return NextResponse.json({ message: 'Pusher is being used for real-time updates' });
}
