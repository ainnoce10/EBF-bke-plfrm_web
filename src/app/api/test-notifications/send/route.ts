import { NextRequest, NextResponse } from 'next/server';
import { NotificationService } from '@/lib/notification-service';

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    const notificationService = NotificationService.getInstance();
    const result = await notificationService.sendNotification({
      customerName: data.customerName || "Client Test",
      customerPhone: data.customerPhone || "+22500000000",
      neighborhood: data.neighborhood,
      latitude: data.latitude,
      longitude: data.longitude,
      type: data.type || 'TEXT',
      description: data.description,
      transcription: data.transcription,
      audioUrl: data.audioUrl,
      photoUrl: data.photoUrl,
      hasPhoto: data.hasPhoto || false,
      requestDate: data.requestDate || new Date().toLocaleDateString('fr-FR'),
      requestId: data.requestId || "test-" + Date.now()
    });

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: `Notification de test envoyée avec succès via ${result.method}`,
        method: result.method,
        result: result
      });
    } else {
      return NextResponse.json({
        success: false,
        message: `Échec de l'envoi de la notification: ${result.error}`,
        error: result.error
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Error sending test notification:', error);
    return NextResponse.json(
      { error: 'Erreur lors de l\'envoi de la notification de test' },
      { status: 500 }
    );
  }
}