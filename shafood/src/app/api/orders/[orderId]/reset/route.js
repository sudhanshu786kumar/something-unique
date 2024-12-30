import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function POST(request, { params }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { orderId } = params;
    
    // Add your database logic here to reset the order
    // Example: await prisma.order.update({
    //   where: { id: orderId },
    //   data: { status: 'RESET', currentStep: 0 }
    // });

    return NextResponse.json({ 
      message: 'Order reset successfully' 
    });
  } catch (error) {
    console.error('Error resetting order:', error);
    return NextResponse.json({ 
      error: 'Failed to reset order',
      details: error.message 
    }, { status: 500 });
  }
} 