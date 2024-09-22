import { NextResponse } from 'next/server';

export async function GET() {
  // Sample product data, replace with actual data fetching logic
  const products = [
    { id: '1', name: 'Pizza', price: 12.99 },
    { id: '2', name: 'Burger', price: 8.99 },
    { id: '3', name: 'Sushi', price: 15.99 },
  ];

  return NextResponse.json(products);
}