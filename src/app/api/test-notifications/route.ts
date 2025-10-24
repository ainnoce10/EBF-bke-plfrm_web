import { NextRequest, NextResponse } from 'next/server';
import { NotificationService } from '@/lib/notification-service';

export async function GET(request: NextRequest) {
  try {
    const notificationService = NotificationService.getInstance();
    const configStatus = notificationService.getConfigurationStatus();
    const instructions = notificationService.getConfigurationInstructions();

    return NextResponse.json({
      config: configStatus,
      instructions: instructions
    });
  } catch (error) {
    console.error('Error checking notification configuration:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la vérification de la configuration' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('📤 Envoi d\'une notification de test...');
    
    const notificationService = NotificationService.getInstance();
    
    const result = await notificationService.sendNotification({
      customerName: body.customerName || 'Client Test',
      customerPhone: body.customerPhone || '+2250708058497',
      neighborhood: body.neighborhood || 'Quartier Test',
      latitude: body.latitude || 7.6934,
      longitude: body.longitude || -5.0354,
      type: body.type || 'TEXT',
      description: body.description || 'Message de test',
      transcription: body.transcription,
      audioUrl: body.audioUrl,
      photoUrl: body.photoUrl,
      hasPhoto: body.hasPhoto || false,
      requestDate: body.requestDate || new Date().toLocaleDateString('fr-FR'),
      requestId: body.requestId || 'test-' + Date.now()
    });

    console.log('📱 Résultat de la notification de test:', result);

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Notification de test envoyée avec succès!',
        method: result.method,
        whatsappLink: result.whatsappLink
      });
    } else {
      return NextResponse.json({
        success: false,
        message: 'Échec de l\'envoi de la notification de test',
        error: result.error
      });
    }
  } catch (error) {
    console.error('Error sending test notification:', error);
    return NextResponse.json(
      { error: 'Erreur lors de l\'envoi de la notification de test' },
      { status: 500 }
    );
  }
}