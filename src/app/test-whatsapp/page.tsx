"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageCircle, ExternalLink } from "lucide-react";

export default function TestWhatsAppPage() {
  const testWhatsAppLink = () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
    const message = `🆕 *TEST NOTIFICATION EBF BOUAKÉ* 🆕\n\n` +
      `*📞 Client:* Jean Test\n` +
      `*📱 Téléphone:* +225123456789\n` +
      `*📍 Quartier:* Zone 4\n` +
      `*📅 Date:* ${new Date().toLocaleDateString('fr-FR')}\n` +
      `*📝 Type:* Texte\n` +
      `*🔍 Statut:* Nouveau\n\n` +
      `*📄 Description:*\nProblème de disjoncteur qui saute fréquemment\n\n` +
      `*🔗 Gérer la demande:* ${origin}/dashboard\n\n` +
      `*💡 Ceci est un message de test!*`;

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/22549615701?text=${encodedMessage}`;
    
    console.log('📱 Lien WhatsApp de test:', whatsappUrl);
    
    // Ouvre WhatsApp dans un nouvel onglet
    const newWindow = window.open(whatsappUrl, '_blank');
    
    if (newWindow) {
      alert('WhatsApp ouvert avec succès! Vérifiez que le message est pré-rempli.');
    } else {
      alert('Impossible d\'ouvrir WhatsApp. Veuillez autoriser les popups.');
      // Copier le lien dans le presse-papiers
      navigator.clipboard.writeText(whatsappUrl).then(() => {
        alert('Lien copié dans le presse-papiers! Collez-le dans votre navigateur.');
      });
    }
  };

  const copyWhatsAppLink = () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
    const message = `🆕 *TEST NOTIFICATION EBF BOUAKÉ* 🆕\n\n` +
      `*📞 Client:* Jean Test\n` +
      `*📱 Téléphone:* +225123456789\n` +
      `*📍 Quartier:* Zone 4\n` +
      `*📅 Date:* ${new Date().toLocaleDateString('fr-FR')}\n` +
      `*📝 Type:* Texte\n` +
      `*🔍 Statut:* Nouveau\n\n` +
      `*📄 Description:*\nProblème de disjoncteur qui saute fréquemment\n\n` +
      `*🔗 Gérer la demande:* ${origin}/dashboard\n\n` +
      `*💡 Ceci est un message de test!*`;

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/22549615701?text=${encodedMessage}`;
    
    navigator.clipboard.writeText(whatsappUrl).then(() => {
      alert('Lien WhatsApp copié dans le presse-papiers!');
    });
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white p-8">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="w-6 h-6 text-green-600" />
              Test de Notification WhatsApp
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-gray-700">
              <p>Cette page permet de tester si les notifications WhatsApp fonctionnent correctement.</p>
              <p className="mt-2">Numéro WhatsApp: <strong>+225 49 61 57 01</strong></p>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Message de test qui sera envoyé :</h3>
                <div className="bg-gray-100 p-4 rounded-lg text-sm font-mono whitespace-pre-wrap">
                  {`🆕 TEST NOTIFICATION EBF BOUAKÉ 🆕

📞 Client: Jean Test
📱 Téléphone: +225123456789
📍 Quartier: Zone 4
📅 Date: ${new Date().toLocaleDateString('fr-FR')}
📝 Type: Texte
🔍 Statut: Nouveau

📄 Description:
Problème de disjoncteur qui saute fréquemment

🔗 Gérer la demande: ${typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'}/dashboard

💡 Ceci est un message de test!`}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  onClick={testWhatsAppLink}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Ouvrir WhatsApp
                </Button>
                
                <Button 
                  variant="outline"
                  onClick={copyWhatsAppLink}
                  className="flex-1"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Copier le lien
                </Button>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-800 mb-2">Instructions :</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Cliquez sur "Ouvrir WhatsApp" pour tester directement</li>
                  <li>• Si WhatsApp ne s'ouvre pas, autorisez les popups</li>
                  <li>• Utilisez "Copier le lien" comme alternative</li>
                  <li>• Vérifiez que le message est bien pré-rempli dans WhatsApp</li>
                  <li>• Le numéro doit être +225 49 61 57 01</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}