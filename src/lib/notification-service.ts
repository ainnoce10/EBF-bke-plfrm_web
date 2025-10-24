import { WhatsAppService } from './whatsapp';
import { EmailService } from './email-service';
import { WhatsAppDirectService } from './whatsapp-direct';

// Service de notification hybride qui essaie plusieurs méthodes
export class NotificationService {
  private static instance: NotificationService;
  private whatsappService: WhatsAppService;
  private emailService: EmailService;
  private whatsappDirectService: WhatsAppDirectService;

  constructor() {
    this.whatsappService = WhatsAppService.getInstance();
    this.emailService = EmailService.getInstance();
    this.whatsappDirectService = WhatsAppDirectService.getInstance();
  }

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
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
  }): Promise<{ success: boolean; error?: string; method?: string }> {
    console.log('📧 Envoi de la notification par email...');

    // Utiliser uniquement l'envoi par email
    if (this.emailService.isConfigured()) {
      try {
        console.log('📧 Envoi de l\'email avec pièces jointes...');
        const emailResult = await this.emailService.sendEmailWithAttachments(data);
        
        if (emailResult.success) {
          console.log('✅ Email envoyé avec succès');
          return { 
            success: true, 
            method: 'email'
          };
        } else {
          throw new Error(emailResult.error || 'Échec de l\'envoi de l\'email');
        }
      } catch (error) {
        console.error('❌ Échec de l\'envoi de l\'email:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Erreur lors de l\'envoi de l\'email',
          method: 'email-failed'
        };
      }
    } else {
      console.error('❌ Le service email n\'est pas configuré');
      return {
        success: false,
        error: 'Le service email n\'est pas correctement configuré. Veuillez contacter l\'administrateur.',
        method: 'not-configured'
      };
    }
  }

  // Méthode pour configurer les variables d'environnement nécessaires
  getConfigurationStatus(): {
    email: boolean;
    whatsappDirect: boolean;
    whatsappTwilio: boolean;
    whatsappLink: boolean;
  } {
    return {
      email: !!(process.env.EMAIL_USER && process.env.EMAIL_PASS),
      whatsappDirect: this.whatsappDirectService.isConfigured(),
      whatsappTwilio: !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN),
      whatsappLink: true // Toujours disponible
    };
  }

  // Méthode pour obtenir des instructions de configuration
  getConfigurationInstructions(): string {
    const status = this.getConfigurationStatus();
    let instructions = 'Configuration des services de notification:\n\n';

    if (!status.email) {
      instructions += `📧 Email (non configuré) - Méthode principale:\n`;
      instructions += `1. Utiliser un compte Gmail\n`;
      instructions += `2. Activer l'accès aux applications moins sécurisées ou utiliser un mot de passe d'application\n`;
      instructions += `3. Configurer les variables d'environnement:\n`;
      instructions += `   - EMAIL_USER=your_email@gmail.com\n`;
      instructions += `   - EMAIL_PASS=your_password_or_app_password\n`;
      instructions += `   - TARGET_EMAIL=target_email@example.com\n\n`;
    }

    if (!status.whatsappDirect) {
      instructions += `📱 Envoi Direct WhatsApp (non configuré):\n`;
      instructions += this.whatsappDirectService.getConfigurationInstructions();
    }

    if (!status.whatsappTwilio) {
      instructions += `📱 WhatsApp Twilio (non configuré):\n`;
      instructions += `1. Créer un compte Twilio: https://www.twilio.com/try-twilio\n`;
      instructions += `2. Obtenir un numéro WhatsApp Business\n`;
      instructions += `3. Configurer les variables d'environnement:\n`;
      instructions += `   - TWILIO_ACCOUNT_SID=your_account_sid\n`;
      instructions += `   - TWILIO_AUTH_TOKEN=your_auth_token\n`;
      instructions += `   - TWILIO_WHATSAPP_NUMBER=your_whatsapp_number\n\n`;
    }

    if (status.whatsappLink) {
      instructions += `🔗 WhatsApp Lien (toujours disponible):\n`;
      instructions += `Cette méthode fonctionne toujours mais nécessite l'ouverture manuelle de WhatsApp.\n\n`;
    }

    instructions += `Pour tester la configuration, visitez: /test-notifications`;

    return instructions;
  }
}