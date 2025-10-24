// Service WhatsApp pour envoyer des notifications automatiques
export class WhatsAppService {
  private static instance: WhatsAppService;
  private readonly phoneNumber = '22549615701';

  static getInstance(): WhatsAppService {
    if (!WhatsAppService.instance) {
      WhatsAppService.instance = new WhatsAppService();
    }
    return WhatsAppService.instance;
  }

  async sendNotification(data: {
    customerName: string;
    customerPhone: string;
    neighborhood?: string;
    latitude?: number | null;
    longitude?: number | null;
    type: 'TEXT' | 'AUDIO';
    description?: string;
    transcription?: string;
    audioUrl?: string;
    photoUrl?: string;
    hasPhoto: boolean;
    requestDate: string;
    requestId: string;
  }): Promise<{ success: boolean; whatsappLink?: string; error?: string }> {
    try {
      console.log('📱 Préparation de la notification WhatsApp...');

      const message = this.formatMessage(data);
      const encodedMessage = encodeURIComponent(message);
      const whatsappLink = `https://wa.me/${this.phoneNumber}?text=${encodedMessage}`;

      console.log('📱 Lien WhatsApp généré:', whatsappLink);

      // Pour l'instant, on retourne le lien pour ouverture manuelle
      // Dans une version future, on pourrait intégrer une API comme:
      // - Twilio API for WhatsApp
      // - WhatsApp Business API
      // - Meta Business Suite

      return {
        success: true,
        whatsappLink,
      };
    } catch (error) {
      console.error('❌ Erreur lors de la préparation de la notification WhatsApp:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue',
      };
    }
  }

  private formatMessage(data: {
    customerName: string;
    customerPhone: string;
    neighborhood?: string;
    latitude?: number | null;
    longitude?: number | null;
    type: 'TEXT' | 'AUDIO';
    description?: string;
    transcription?: string;
    audioUrl?: string;
    photoUrl?: string;
    hasPhoto: boolean;
    requestDate: string;
    requestId: string;
  }): string {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    let message = `🆕 *NOUVELLE DEMANDE EBF BOUAKÉ* 🆕\n\n`;
    
    message += `*📞 Client:* ${data.customerName}\n`;
    message += `*📱 Téléphone:* ${data.customerPhone}\n`;
    message += `*📍 Quartier:* ${data.neighborhood || 'Non spécifié'}\n`;
    
    // Ajouter le lien Google Maps si les coordonnées sont disponibles
    if (data.latitude && data.longitude) {
      const mapsLink = `https://www.google.com/maps?q=${data.latitude},${data.longitude}`;
      message += `*🗺️ Position GPS:* ${mapsLink}\n`;
    }
    
    message += `*📅 Date:* ${data.requestDate}\n`;
    message += `*📝 Type:* ${data.type === 'TEXT' ? 'Texte' : 'Audio'}\n`;
    message += `*🔍 Statut:* Nouveau\n\n`;
    
    if (data.type === 'TEXT' && data.description) {
      message += `*📄 Description:*\n${data.description}\n\n`;
    }
    
    if (data.type === 'AUDIO') {
      if (data.audioUrl) {
        const fullAudioUrl = data.audioUrl.startsWith('http') ? data.audioUrl : `${baseUrl}${data.audioUrl}`;
        message += `*🎵 Message audio:* ${fullAudioUrl}\n`;
      }
      if (data.transcription) {
        message += `*📝 Transcription:*\n${data.transcription}\n\n`;
      }
    }
    
    if (data.hasPhoto && data.photoUrl) {
      const fullPhotoUrl = data.photoUrl.startsWith('http') ? data.photoUrl : `${baseUrl}${data.photoUrl}`;
      message += `*📷 Photo:* ${fullPhotoUrl}\n\n`;
    }
    
    const dashboardUrl = `${baseUrl}/dashboard`;
    message += `*🔗 Gérer la demande:* ${dashboardUrl}\n\n`;
    message += `*💡 Contactez le client rapidement pour planifier le diagnostic gratuit!*`;
    
    return message;
  }

  // Méthode pour ouvrir WhatsApp manuellement
  openWhatsApp(message: string): void {
    try {
      const encodedMessage = encodeURIComponent(message);
      const whatsappUrl = `https://wa.me/${this.phoneNumber}?text=${encodedMessage}`;
      
      console.log('📱 Ouverture de WhatsApp...');
      const newWindow = window.open(whatsappUrl, '_blank', 'width=800,height=600');
      
      if (newWindow) {
        console.log('✅ WhatsApp ouvert avec succès');
      } else {
        console.error('❌ Impossible d\'ouvrir WhatsApp - popup bloqué');
        // Fallback: copier le lien dans le presse-papiers
        this.copyToClipboard(whatsappUrl);
      }
    } catch (error) {
      console.error('❌ Erreur lors de l\'ouverture de WhatsApp:', error);
    }
  }

  private copyToClipboard(text: string): void {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        alert('Lien WhatsApp copié dans le presse-papiers! Collez-le dans votre navigateur.');
      });
    } else {
      // Fallback pour les anciens navigateurs
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      alert('Lien WhatsApp copié! Collez-le dans votre navigateur.');
    }
  }
}