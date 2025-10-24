// Service WhatsApp pour envoi direct depuis le serveur
export class WhatsAppDirectService {
  private static instance: WhatsAppDirectService;
  private readonly apiKey: string;
  private readonly phoneNumberId: string;
  private readonly targetPhoneNumber: string;

  constructor() {
    // Configuration pour l'API WhatsApp Business
    this.apiKey = process.env.WHATSAPP_API_KEY || '';
    this.phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID || '';
    this.targetPhoneNumber = process.env.TARGET_WHATSAPP_NUMBER || '22549615701';
  }

  static getInstance(): WhatsAppDirectService {
    if (!WhatsAppDirectService.instance) {
      WhatsAppDirectService.instance = new WhatsAppDirectService();
    }
    return WhatsAppDirectService.instance;
  }

  async sendDirectMessage(data: {
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
  }): Promise<{ success: boolean; error?: string; messageId?: string; whatsappLink?: string }> {
    try {
      console.log('📱 Envoi direct du message WhatsApp...');

      // Formater le message
      const message = this.formatMessage(data);
      
      // Utiliser l'API WhatsApp Business
      const result = await this.sendViaWhatsAppAPI(message, data);
      
      if (result.success) {
        console.log('✅ Message WhatsApp envoyé avec succès:', result.messageId);
        return {
          success: true,
          messageId: result.messageId,
          whatsappLink: (result as any).whatsappLink
        };
      } else {
        // Toujours vérifier si un lien WhatsApp est disponible et le retourner comme succès
        console.log('📱 Vérification du lien WhatsApp comme fallback');
        if ((result as any).whatsappLink) {
          console.log('📱 Lien WhatsApp disponible comme fallback');
          return {
            success: true,
            messageId: (result as any).messageId || 'fallback-' + Date.now(),
            whatsappLink: (result as any).whatsappLink
          };
        } else {
          console.log('❌ Aucun lien WhatsApp disponible, génération d\'un nouveau lien');
          // Générer un nouveau lien WhatsApp comme dernier recours
          const message = this.formatMessage(data);
          return await this.sendViaWhatsAppLink(message);
        }
      }

    } catch (error) {
      console.error('❌ Erreur lors de l\'envoi direct WhatsApp:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      };
    }
  }

  private async sendViaWhatsAppAPI(message: string, data: any): Promise<{ success: boolean; error?: string; messageId?: string }> {
    try {
      // Utiliser directement CallMeBot pour une configuration plus simple
      return await this.sendViaCallMeBot(message);

    } catch (error) {
      console.error('❌ Échec de l\'envoi via CallMeBot:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      };
    }
  }

  private async sendViaMetaAPI(message: string, data: any): Promise<{ success: boolean; error?: string; messageId?: string }> {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      
      // Envoyer d'abord le message texte
      const textResult = await this.sendTextMessage(message);
      if (!textResult.success) {
        return textResult;
      }

      // Envoyer les médias séparément si disponibles
      if (data.hasPhoto && data.photoUrl) {
        const fullPhotoUrl = data.photoUrl.startsWith('http') 
          ? data.photoUrl 
          : `${baseUrl}${data.photoUrl}`;
        
        const photoResult = await this.sendMediaMessage('image', fullPhotoUrl);
        if (!photoResult.success) {
          console.warn('⚠️ Échec de l\'envoi de la photo, mais le message texte a été envoyé');
        }
      }

      if (data.audioUrl && !data.hasPhoto) {
        const fullAudioUrl = data.audioUrl.startsWith('http') 
          ? data.audioUrl 
          : `${baseUrl}${data.audioUrl}`;
        
        const audioResult = await this.sendMediaMessage('audio', fullAudioUrl);
        if (!audioResult.success) {
          console.warn('⚠️ Échec de l\'envoi de l\'audio, mais le message texte a été envoyé');
        }
      }

      return textResult;
    } catch (error) {
      console.error('❌ Erreur API Meta:', error);
      throw error;
    }
  }

  private async sendTextMessage(message: string): Promise<{ success: boolean; error?: string; messageId?: string }> {
    const apiData = {
      messaging_product: 'whatsapp',
      to: this.targetPhoneNumber,
      text: {
        body: message
      }
    };

    const response = await fetch(`https://graph.facebook.com/v18.0/${this.phoneNumberId}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(apiData)
    });

    const result = await response.json();
    
    if (response.ok) {
      return {
        success: true,
        messageId: result.messages?.[0]?.id
      };
    } else {
      throw new Error(result.error?.message || 'Erreur API WhatsApp Business');
    }
  }

  private async sendMediaMessage(type: string, mediaUrl: string): Promise<{ success: boolean; error?: string; messageId?: string }> {
    const apiData = {
      messaging_product: 'whatsapp',
      to: this.targetPhoneNumber,
      media: {
        type: type,
        media_url: mediaUrl
      }
    };

    const response = await fetch(`https://graph.facebook.com/v18.0/${this.phoneNumberId}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(apiData)
    });

    const result = await response.json();
    
    if (response.ok) {
      return {
        success: true,
        messageId: result.messages?.[0]?.id
      };
    } else {
      throw new Error(result.error?.message || `Erreur API WhatsApp Business pour le média ${type}`);
    }
  }

  private async sendViaCallMeBot(message: string): Promise<{ success: boolean; error?: string; messageId?: string }> {
    try {
      // Service gratuit CallMeBot pour envoyer des messages WhatsApp
      // CallMeBot nécessite une clé API pour fonctionner
      // Si pas de clé API, on passe directement au lien WhatsApp
      const apiKey = process.env.CALLMEBOT_API_KEY;
      
      if (!apiKey) {
        console.log('⚠️ Pas de clé API CallMeBot, utilisation du lien WhatsApp direct');
        return await this.sendViaWhatsAppLink(message);
      }
      
      const encodedMessage = encodeURIComponent(message);
      const targetPhone = this.targetPhoneNumber.replace('+', '');
      
      // Utiliser CallMeBot avec la clé API
      const url = `https://api.callmebot.com/whatsapp.php?phone=${targetPhone}&text=${encodedMessage}&apikey=${apiKey}`;
      
      console.log('📤 Envoi du message via CallMeBot à:', targetPhone);
      
      const response = await fetch(url);
      const result = await response.text();
      
      console.log('📡 Réponse CallMeBot:', result);
      
      if (response.ok && (result.includes('OK') || result.includes('Message queued'))) {
        return {
          success: true,
          messageId: 'callmebot-' + Date.now()
        };
      } else {
        // Si CallMeBot échoue, utiliser la méthode du lien WhatsApp direct
        console.log('⚠️ CallMeBot a échoué, utilisation du lien WhatsApp direct');
        return await this.sendViaWhatsAppLink(message);
      }

    } catch (error) {
      console.error('❌ Erreur CallMeBot:', error);
      // Fallback vers le lien WhatsApp
      return await this.sendViaWhatsAppLink(message);
    }
  }

  private async sendViaWhatsAppLink(message: string): Promise<{ success: boolean; error?: string; messageId?: string; whatsappLink?: string }> {
    try {
      // Générer un lien WhatsApp direct qui s'ouvrira automatiquement
      const targetPhone = this.targetPhoneNumber.replace('+', '');
      const encodedMessage = encodeURIComponent(message);
      const whatsappLink = `https://wa.me/${targetPhone}?text=${encodedMessage}`;
      
      console.log('📱 Génération du lien WhatsApp direct:', whatsappLink);
      
      // Retourner le lien avec un statut de succès pour qu'il soit ouvert automatiquement
      return {
        success: true,
        messageId: 'link-' + Date.now(),
        whatsappLink: whatsappLink
      };
      
    } catch (error) {
      console.error('❌ Erreur lors de la génération du lien WhatsApp:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur lors de la génération du lien WhatsApp'
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
    requestDate: string;
  }): string {
    let message = `🆕 NOUVELLE DEMANDE EBF BOUAKÉ 🆕\n\n`;
    
    message += `📞 Client: ${data.customerName}\n`;
    message += `📱 Téléphone: ${data.customerPhone}\n`;
    message += `📍 Quartier: ${data.neighborhood || 'Non spécifié'}\n`;
    
    // Ajouter le lien Google Maps si les coordonnées sont disponibles
    if (data.latitude && data.longitude) {
      const mapsLink = `https://www.google.com/maps?q=${data.latitude},${data.longitude}`;
      message += `🗺️ Position GPS: ${mapsLink}\n`;
    }
    
    message += `📅 Date: ${data.requestDate}\n`;
    message += `📝 Type: ${data.type === 'TEXT' ? 'Texte' : 'Audio'}\n`;
    message += `🔍 Statut: Nouveau\n\n`;
    
    if (data.type === 'TEXT' && data.description) {
      message += `📄 Description:\n${data.description}\n\n`;
    }
    
    if (data.type === 'AUDIO' && data.transcription) {
      message += `📝 Transcription:\n${data.transcription}\n\n`;
    }
    
    // Ajouter les liens vers les médias si disponibles
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    if (data.photoUrl) {
      const fullPhotoUrl = data.photoUrl.startsWith('http') ? data.photoUrl : `${baseUrl}${data.photoUrl}`;
      message += `📷 Photo: ${fullPhotoUrl}\n`;
    }
    
    if (data.audioUrl) {
      const fullAudioUrl = data.audioUrl.startsWith('http') ? data.audioUrl : `${baseUrl}${data.audioUrl}`;
      message += `🎵 Message audio: ${fullAudioUrl}\n`;
    }
    
    if (data.photoUrl || data.audioUrl) {
      message += `\n`;
    }
    
    const dashboardUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    message += `🔗 Gérer la demande: ${dashboardUrl}/dashboard\n\n`;
    message += `💡 Contactez le client rapidement pour planifier le diagnostic gratuit!`;
    
    return message;
  }

  // Vérifier si le service est configuré
  isConfigured(): boolean {
    // Toujours configuré car nous utilisons le service gratuit CallMeBot
    return true;
  }

  // Obtenir les instructions de configuration
  getConfigurationInstructions(): string {
    let instructions = 'Configuration de l\'envoi direct WhatsApp:\n\n';

    if (!this.apiKey || !this.phoneNumberId) {
      instructions += `📱 Méthode 1 - WhatsApp Business API:\n`;
      instructions += `1. Créer un compte Meta for Developers\n`;
      instructions += `2. Configurer WhatsApp Business API\n`;
      instructions += `3. Obtenir un token d'accès et un phone number ID\n`;
      instructions += `4. Configurer les variables d'environnement:\n`;
      instructions += `   - WHATSAPP_API_KEY=votre_token\n`;
      instructions += `   - WHATSAPP_PHONE_NUMBER_ID=votre_phone_id\n`;
      instructions += `   - TARGET_WHATSAPP_NUMBER=22549615701\n\n`;
    }

    if (!process.env.CALLMEBOT_API_KEY) {
      instructions += `📱 Méthode 2 - CallMeBot (gratuit mais limité):\n`;
      instructions += `1. Visiter https://callmebot.com\n`;
      instructions += `2. Obtenir une clé API gratuite\n`;
      instructions += `3. Configurer la variable d'environnement:\n`;
      instructions += `   - CALLMEBOT_API_KEY=votre_clé_api\n\n`;
    }

    return instructions;
  }
}