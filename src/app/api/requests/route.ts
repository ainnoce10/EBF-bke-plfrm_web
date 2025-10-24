import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { writeFile } from 'fs/promises';
import path from 'path';
import { NotificationService } from '@/lib/notification-service';

export async function POST(request: NextRequest) {
  try {
    console.log('📥 Début de la réception de la demande...');
    
    const formData = await request.formData();
    console.log('📋 FormData reçu:', {
      name: formData.get('name'),
      phone: formData.get('phone'),
      neighborhood: formData.get('neighborhood'),
      position: formData.get('position'),
      inputType: formData.get('inputType'),
      description: formData.get('description'),
      hasAudio: formData.get('audio') instanceof File,
      hasPhoto: formData.get('photo') instanceof File
    });
    
    const name = formData.get('name') as string;
    const phone = formData.get('phone') as string;
    const neighborhood = formData.get('neighborhood') as string;
    const position = formData.get('position') as string;
    const inputType = formData.get('inputType') as 'text' | 'audio';
    const description = formData.get('description') as string;
    const audioFile = formData.get('audio') as File;
    const photoFile = formData.get('photo') as File;
    
    // Extraire les coordonnées GPS du champ position si elles sont fournies
    let latitude = null;
    let longitude = null;
    if (position && position.includes(',')) {
      const coords = position.split(',');
      if (coords.length === 2) {
        const lat = parseFloat(coords[0].trim());
        const lng = parseFloat(coords[1].trim());
        if (!isNaN(lat) && !isNaN(lng)) {
          latitude = lat;
          longitude = lng;
        }
      }
    }

    console.log('📝 Données extraites:', { name, phone, neighborhood, position, inputType, description, latitude, longitude });

    // Validate required fields
    if (!name) {
      console.log('❌ Nom manquant');
      return NextResponse.json(
        { error: 'Le nom est obligatoire' },
        { status: 400 }
      );
    }

    if (!phone) {
      console.log('❌ Téléphone manquant');
      return NextResponse.json(
        { error: 'Le numéro de téléphone est obligatoire' },
        { status: 400 }
      );
    }

    console.log('✅ Validation des champs réussie');

    // Find or create customer
    console.log('🔍 Recherche du client...');
    let customer = await db.customer.findUnique({
      where: { phone }
    });

    if (!customer) {
      console.log('👤 Création d\'un nouveau client...');
      customer = await db.customer.create({
        data: {
          name: name,
          phone,
          neighborhood: neighborhood || null,
          city: 'Bouaké',
          latitude: latitude,
          longitude: longitude
        }
      });
      console.log('✅ Client créé:', customer.id);
    } else {
      console.log('👤 Client existant trouvé:', customer.id);
    }

    // Handle file uploads
    let audioUrl = null;
    let photoUrl = null;

    console.log('📁 Gestion des fichiers uploadés...');

    if (audioFile && audioFile.size > 0) {
      console.log('🎵 Fichier audio détecté:', audioFile.name);
      const audioBuffer = Buffer.from(await audioFile.arrayBuffer());
      const audioFileName = `${Date.now()}-${audioFile.name}`;
      const audioPath = path.join(process.cwd(), 'public', 'uploads', 'audio', audioFileName);
      
      // Ensure directory exists
      await writeFile(audioPath, audioBuffer);
      audioUrl = `/uploads/audio/${audioFileName}`;
      console.log('✅ Fichier audio sauvegardé:', audioUrl);
    }

    if (photoFile && photoFile.size > 0) {
      console.log('📷 Fichier photo détecté:', photoFile.name);
      const photoBuffer = Buffer.from(await photoFile.arrayBuffer());
      const photoFileName = `${Date.now()}-${photoFile.name}`;
      const photoPath = path.join(process.cwd(), 'public', 'uploads', 'photos', photoFileName);
      
      // Ensure directory exists
      await writeFile(photoPath, photoBuffer);
      photoUrl = `/uploads/photos/${photoFileName}`;
      console.log('✅ Fichier photo sauvegardé:', photoUrl);
    }

    console.log('📝 Création de la demande...');
    // Create the request
    const newRequest = await db.request.create({
      data: {
        customerId: customer.id,
        type: inputType === 'text' ? 'TEXT' : 'AUDIO',
        description: inputType === 'text' ? description : null,
        audioUrl: audioUrl,
        photoUrl: photoUrl,
        status: 'NEW'
      },
      include: {
        customer: true
      }
    });

    console.log('✅ Demande créée:', newRequest.id);

    // If audio file exists, trigger transcription (async)
    if (audioUrl) {
      try {
        const ZAI = await import('z-ai-web-dev-sdk');
        const zai = await ZAI.create();
        
        // Note: In a real implementation, you would need to convert the audio to a format
        // that the AI service can process. This is a simplified example.
        const transcription = await zai.chat.completions.create({
          messages: [
            {
              role: 'system',
              content: 'Vous êtes un assistant qui transcrit des messages vocaux concernant des problèmes électriques. Transcrivez le message de manière précise et concise.'
            },
            {
              role: 'user',
              content: `Veuillez transcrire ce message vocal concernant un problème électrique. Le fichier audio est disponible à: ${audioUrl}`
            }
          ]
        });

        const transcriptionText = transcription.choices[0]?.message?.content;
        
        if (transcriptionText) {
          await db.request.update({
            where: { id: newRequest.id },
            data: { transcription: transcriptionText }
          });
        }
      } catch (error) {
        console.error('Transcription failed:', error);
        // Don't fail the request if transcription fails
      }
    }

    // Send notification using the hybrid service
    console.log('📱 Envoi de la notification via le service hybride...');
    const notificationService = NotificationService.getInstance();
    
    const notificationResult = await notificationService.sendNotification({
      customerName: customer.name,
      customerPhone: customer.phone,
      neighborhood: customer.neighborhood || undefined,
      latitude: customer.latitude || undefined,
      longitude: customer.longitude || undefined,
      type: newRequest.type,
      description: newRequest.description || undefined,
      transcription: newRequest.transcription || undefined,
      audioUrl: newRequest.audioUrl || undefined,
      photoUrl: newRequest.photoUrl || undefined,
      hasPhoto: !!newRequest.photoUrl,
      requestDate: new Date(newRequest.createdAt).toLocaleDateString('fr-FR'),
      requestId: newRequest.id
    });

    console.log('📱 Résultat de la notification:', notificationResult);

    if (notificationResult.success) {
      console.log('✅ Notification envoyée avec succès via:', notificationResult.method);
      
      if (notificationResult.method === 'whatsapp-direct') {
        console.log('✅ Message WhatsApp envoyé directement depuis le serveur');
      } else if (notificationResult.method === 'whatsapp-link' && notificationResult.whatsappLink) {
        console.log('📱 Lien WhatsApp généré:', notificationResult.whatsappLink);
      }
    } else {
      console.error('❌ Échec de la notification:', notificationResult.error);
    }

    return NextResponse.json({
      success: true,
      request: newRequest,
      notification: notificationResult
    });

  } catch (error) {
    console.error('Error creating request:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la création de la demande' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const technicianId = searchParams.get('technicianId');

    const where: any = {};
    
    if (status && status !== 'all') {
      where.status = status;
    }
    
    if (technicianId && technicianId !== 'all') {
      where.technicianId = technicianId;
    }

    const requests = await db.request.findMany({
      where,
      include: {
        customer: true,
        technician: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json(requests);

  } catch (error) {
    console.error('Error fetching requests:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des demandes' },
      { status: 500 }
    );
  }
}