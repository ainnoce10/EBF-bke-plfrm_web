import nodemailer from 'nodemailer';

// Service d'envoi d'email avec pièces jointes comme alternative à WhatsApp
export class EmailService {
  private static instance: EmailService;
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER || '',
        pass: process.env.EMAIL_PASS || ''
      },
      tls: {
        rejectUnauthorized: false
      }
    });
  }

  static getInstance(): EmailService {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService();
    }
    return EmailService.instance;
  }

  async sendEmailWithAttachments(data: {
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
  }): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('📧 Envoi de l\'email avec pièces jointes...');

      const subject = `🆕 NOUVELLE DEMANDE EBF BOUAKÉ - ${data.customerName}`;
      
      let htmlContent = `
        <h2 style="color: #1f2937; font-family: Arial, sans-serif;">🆕 NOUVELLE DEMANDE EBF BOUAKÉ 🆕</h2>
        <table style="border-collapse: collapse; width: 100%; font-family: Arial, sans-serif; border: 1px solid #e5e7eb;">
          <tr style="background-color: #f3f4f6;">
            <td style="padding: 12px; border: 1px solid #d1d5db; font-weight: bold; color: #374151;">📞 Client:</td>
            <td style="padding: 12px; border: 1px solid #d1d5db; color: #1f2937;">${data.customerName}</td>
          </tr>
          <tr>
            <td style="padding: 12px; border: 1px solid #d1d5db; font-weight: bold; color: #374151;">📱 Téléphone:</td>
            <td style="padding: 12px; border: 1px solid #d1d5db; color: #1f2937;">${data.customerPhone}</td>
          </tr>
          <tr style="background-color: #f9fafb;">
            <td style="padding: 12px; border: 1px solid #d1d5db; font-weight: bold; color: #374151;">📍 Quartier:</td>
            <td style="padding: 12px; border: 1px solid #d1d5db; color: #1f2937;">${data.neighborhood || 'Non spécifié'}</td>
          </tr>
      `;

      if (data.latitude && data.longitude) {
        const mapsLink = `https://www.google.com/maps?q=${data.latitude},${data.longitude}`;
        htmlContent += `
          <tr>
            <td style="padding: 12px; border: 1px solid #d1d5db; font-weight: bold; color: #374151;">🗺️ Position GPS:</td>
            <td style="padding: 12px; border: 1px solid #d1d5db; color: #1f2937;">
              <a href="${mapsLink}" style="color: #2563eb; text-decoration: none; font-weight: 500;">📍 Voir sur Google Maps</a>
            </td>
          </tr>
        `;
      }

      htmlContent += `
          <tr style="background-color: #f3f4f6;">
            <td style="padding: 12px; border: 1px solid #d1d5db; font-weight: bold; color: #374151;">📅 Date:</td>
            <td style="padding: 12px; border: 1px solid #d1d5db; color: #1f2937;">${data.requestDate}</td>
          </tr>
          <tr>
            <td style="padding: 12px; border: 1px solid #d1d5db; font-weight: bold; color: #374151;">📝 Type:</td>
            <td style="padding: 12px; border: 1px solid #d1d5db; color: #1f2937;">${data.type === 'TEXT' ? 'Texte' : 'Audio'}</td>
          </tr>
          <tr style="background-color: #f9fafb;">
            <td style="padding: 12px; border: 1px solid #d1d5db; font-weight: bold; color: #374151;">🔍 Statut:</td>
            <td style="padding: 12px; border: 1px solid #d1d5db; color: #1f2937;">
              <span style="background-color: #fef3c7; color: #92400e; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold;">Nouveau</span>
            </td>
          </tr>
        </table>
      `;

      if (data.type === 'TEXT' && data.description) {
        htmlContent += `
          <div style="margin-top: 20px; padding: 15px; background-color: #f8fafc; border-left: 4px solid #3b82f6; border-radius: 4px;">
            <h3 style="color: #1e40af; margin-top: 0; font-family: Arial, sans-serif;">📄 Description:</h3>
            <p style="color: #374151; line-height: 1.6; margin-bottom: 0; font-family: Arial, sans-serif;">${data.description.replace(/\n/g, '<br>')}</p>
          </div>
        `;
      }

      if (data.type === 'AUDIO' && data.transcription) {
        htmlContent += `
          <div style="margin-top: 20px; padding: 15px; background-color: #fefce8; border-left: 4px solid #eab308; border-radius: 4px;">
            <h3 style="color: #a16207; margin-top: 0; font-family: Arial, sans-serif;">📝 Transcription:</h3>
            <p style="color: #374151; line-height: 1.6; margin-bottom: 0; font-family: Arial, sans-serif;">${data.transcription.replace(/\n/g, '<br>')}</p>
          </div>
        `;
      }

      const dashboardUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      htmlContent += `
        <div style="margin-top: 25px; padding: 20px; background-color: #eff6ff; border-radius: 8px; text-align: center; border: 1px solid #dbeafe;">
          <p style="margin: 0 0 10px 0; font-weight: bold; color: #1e40af; font-family: Arial, sans-serif;">🔗 Gérer la demande:</p>
          <a href="${dashboardUrl}/dashboard" style="display: inline-block; background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; font-family: Arial, sans-serif;">Accéder au tableau de bord</a>
        </div>
        <div style="margin-top: 20px; padding: 15px; background-color: #f0fdf4; border-radius: 8px; border: 1px solid #bbf7d0;">
          <p style="margin: 0; color: #166534; font-style: italic; font-family: Arial, sans-serif;">💡 Contactez le client rapidement pour planifier le diagnostic gratuit!</p>
        </div>
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 12px; font-family: Arial, sans-serif;">
          <p style="margin: 0;">Email envoyé automatiquement par EBF Bouaké - ${new Date().toLocaleString('fr-FR')}</p>
        </div>
      `;

      const attachments: any[] = [];

      // Ajouter la photo en pièce jointe si elle existe
      if (data.hasPhoto && data.photoUrl) {
        const fullPhotoUrl = data.photoUrl.startsWith('http') 
          ? data.photoUrl 
          : `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}${data.photoUrl}`;
        
        attachments.push({
          filename: `photo_${data.requestId}.jpg`,
          path: fullPhotoUrl
        });
      }

      // Ajouter l'audio en pièce jointe s'il existe
      if (data.audioUrl) {
        const fullAudioUrl = data.audioUrl.startsWith('http') 
          ? data.audioUrl 
          : `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}${data.audioUrl}`;
        
        attachments.push({
          filename: `audio_${data.requestId}.wav`,
          path: fullAudioUrl
        });
      }

      const mailOptions = {
        from: process.env.EMAIL_USER || '',
        to: process.env.TARGET_EMAIL || 'ebfbouake@gmail.com',
        subject: subject,
        html: htmlContent,
        attachments: attachments
      };

      await this.transporter.sendMail(mailOptions);
      console.log('✅ Email envoyé avec succès');

      return { success: true };

    } catch (error) {
      console.error('❌ Erreur lors de l\'envoi de l\'email:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue',
      };
    }
  }

  // Vérifier si le service est configuré
  isConfigured(): boolean {
    return !!(process.env.EMAIL_USER && process.env.EMAIL_PASS);
  }
}