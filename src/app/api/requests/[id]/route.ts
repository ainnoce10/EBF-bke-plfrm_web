import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    
    const { status, technicianId, scheduledDate, notes } = body;

    // Validate the request exists
    const existingRequest = await db.request.findUnique({
      where: { id },
      include: { customer: true }
    });

    if (!existingRequest) {
      return NextResponse.json(
        { error: 'Demande non trouvée' },
        { status: 404 }
      );
    }

    // Update the request
    const updatedRequest = await db.request.update({
      where: { id },
      data: {
        ...(status && { status }),
        ...(technicianId && { technicianId }),
        ...(scheduledDate && { scheduledDate: new Date(scheduledDate) }),
        ...(notes !== undefined && { notes })
      },
      include: {
        customer: true,
        technician: true
      }
    });

    return NextResponse.json(updatedRequest);

  } catch (error) {
    console.error('Error updating request:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour de la demande' },
      { status: 500 }
    );
  }
}