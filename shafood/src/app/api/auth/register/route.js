import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/app/lib/mongodb';
import bcrypt from 'bcryptjs';
import { createUser, getUserByEmail } from '@/app/models/User';

export async function POST(request) {
  try {
    const body = await request.json();
    console.log('Received registration data:', body);

    const { name, email, password } = body;

    if (!name || !email || !password) {
      const missingFields = [];
      if (!name) missingFields.push('name');
      if (!email) missingFields.push('email');
      if (!password) missingFields.push('password');
      return NextResponse.json({ error: `Missing required fields: ${missingFields.join(', ')}` }, { status: 400 });
    }

    const { db } = await connectToDatabase();

    const existingUser = await getUserByEmail(email);
    if (existingUser) {
      return NextResponse.json({ error: 'Email already in use' }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const userId = await createUser({
      name,
      email,
      password: hashedPassword,
    });

    return NextResponse.json({ message: 'User registered successfully', userId }, { status: 201 });
  } catch (error) {
    console.error('Error registering user:', error);
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
  }
}
