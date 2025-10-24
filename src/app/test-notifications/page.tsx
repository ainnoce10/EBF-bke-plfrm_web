"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Mail, 
  MessageSquare, 
  Link,
  Settings,
  RefreshCw
} from "lucide-react";

interface ConfigStatus {
  whatsappDirect: boolean;
  whatsappTwilio: boolean;
  email: boolean;
  whatsappLink: boolean;
}

export default function TestNotificationsPage() {
  const [configStatus, setConfigStatus] = useState<ConfigStatus>({
    whatsappDirect: false,
    whatsappTwilio: false,
    email: false,
    whatsappLink: false
  });
  const [instructions, setInstructions] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkConfiguration();
  }, []);

  const checkConfiguration = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/test-notifications");
      const data = await response.json();
      setConfigStatus(data.config);
      setInstructions(data.instructions);
    } catch (error) {
      console.error("Erreur lors de la vérification de la configuration:", error);
    } finally {
      setLoading(false);
    }
  };

  const sendTestNotification = async (type: 'text' | 'photo' | 'audio' | 'location' = 'text') => {
    setLoading(true);
    try {
      const testData: any = {
        customerName: "Client Test",
        customerPhone: "+2250708058497",
        neighborhood: "Quartier Test",
        type: "TEXT",
        description: "Ceci est un message de test pour vérifier le système de notifications.",
        hasPhoto: false,
        requestDate: new Date().toLocaleDateString('fr-FR'),
        requestId: "test-" + Date.now()
      };

      // Ajouter des données spécifiques selon le type de test
      switch (type) {
        case 'photo':
          testData.hasPhoto = true;
          testData.photoUrl = "/uploads/photos/test-photo.jpg";
          testData.description = "Test avec photo - Problème électrique visible";
          break;
        case 'audio':
          testData.type = "AUDIO";
          testData.audioUrl = "/uploads/audio/test-audio.wav";
          testData.transcription = "Ceci est une transcription de test d'un message audio concernant un problème électrique.";
          break;
        case 'location':
          testData.neighborhood = "Quartier avec position GPS";
          testData.latitude = 7.6934;
          testData.longitude = -5.0354;
          testData.description = "Test avec position GPS - Client localisé à Bouaké";
          break;
        default:
          // Test texte simple
          break;
      }

      const response = await fetch("/api/test-notifications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(testData),
      });

      const result = await response.json();
      
      let message = result.message || "Test de notification envoyé !";
      if (result.success && result.method) {
        message += `\nMéthode utilisée: ${result.method}`;
        if (result.whatsappLink) {
          message += `\nLien WhatsApp: ${result.whatsappLink}`;
        }
      }
      
      alert(message);
    } catch (error) {
      console.error("Erreur lors de l'envoi de la notification de test:", error);
      alert("Erreur lors de l'envoi de la notification de test");
    } finally {
      setLoading(false);
    }
  };

  const StatusBadge = ({ active }: { active: boolean }) => (
    <Badge variant={active ? "default" : "secondary"}>
      {active ? (
        <CheckCircle className="w-4 h-4 mr-1" />
      ) : (
        <XCircle className="w-4 h-4 mr-1" />
      )}
      {active ? "Actif" : "Inactif"}
    </Badge>
  );

  const ServiceCard = ({ 
    title, 
    description, 
    icon: Icon, 
    status, 
    features 
  }: {
    title: string;
    description: string;
    icon: any;
    status: boolean;
    features: string[];
  }) => (
    <Card className={`transition-all duration-300 ${status ? 'border-green-200 bg-green-50' : 'border-gray-200'}`}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Icon className={`w-6 h-6 ${status ? 'text-green-600' : 'text-gray-400'}`} />
            <span>{title}</span>
          </div>
          <StatusBadge active={status} />
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-600 mb-4">{description}</p>
        <div className="space-y-2">
          <h4 className="font-semibold text-sm">Fonctionnalités:</h4>
          <ul className="text-xs text-gray-500 space-y-1">
            {features.map((feature, index) => (
              <li key={index} className="flex items-center">
                <div className={`w-2 h-2 rounded-full mr-2 ${status ? 'bg-green-500' : 'bg-gray-300'}`} />
                {feature}
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Test des Notifications
          </h1>
          <p className="text-gray-600">
            Vérifiez la configuration de vos services de notification et envoyez des messages de test.
          </p>
        </div>

        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <ServiceCard
            title="WhatsApp Direct"
            description="Envoi automatique depuis le serveur"
            icon={MessageSquare}
            status={configStatus.whatsappDirect}
            features={[
              "Envoi automatique sans intervention",
              "Pas d'ouverture WhatsApp côté client",
              "Messages reçus directement",
              "Idéal pour l'expérience utilisateur"
            ]}
          />
          
          <ServiceCard
            title="WhatsApp Twilio"
            description="Envoi direct de médias dans WhatsApp"
            icon={MessageSquare}
            status={configStatus.whatsappTwilio}
            features={[
              "Envoi direct d'images et vidéos",
              "Messages audio directement dans WhatsApp",
              "Liens cliquables automatiquement",
              "Professionnel et fiable"
            ]}
          />
          
          <ServiceCard
            title="Email avec Pièces Jointes"
            description="Notification par email avec fichiers joints"
            icon={Mail}
            status={configStatus.email}
            features={[
              "Pièces jointes directement dans l'email",
              "Format HTML professionnel",
              "Réception instantanée",
              "Accessible sur tous les appareils"
            ]}
          />
          
          <ServiceCard
            title="WhatsApp par Lien"
            description="Méthode de fallback toujours disponible"
            icon={Link}
            status={configStatus.whatsappLink}
            features={[
              "Toujours fonctionnel",
              "Ouverture manuelle requise",
              "Liens vers les fichiers",
              "Simple et rapide"
            ]}
          />
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold flex items-center">
              <MessageSquare className="w-5 h-5 mr-2" />
              Tests de Notification
            </h2>
            <div className="text-sm text-gray-600">
              Cliquez sur un type de test pour vérifier les fonctionnalités
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <Button 
              onClick={() => sendTestNotification('text')} 
              disabled={loading}
              variant="outline"
              className="h-auto p-4 flex flex-col items-center space-y-2"
            >
              <MessageSquare className="w-6 h-6" />
              <span className="text-sm">Message Texte</span>
              <span className="text-xs text-gray-500">Test simple</span>
            </Button>
            
            <Button 
              onClick={() => sendTestNotification('photo')} 
              disabled={loading}
              variant="outline"
              className="h-auto p-4 flex flex-col items-center space-y-2"
            >
              <div className="w-6 h-6 bg-blue-100 rounded flex items-center justify-center">
                <div className="w-4 h-4 bg-blue-500 rounded"></div>
              </div>
              <span className="text-sm">Avec Photo</span>
              <span className="text-xs text-gray-500">Test image</span>
            </Button>
            
            <Button 
              onClick={() => sendTestNotification('audio')} 
              disabled={loading}
              variant="outline"
              className="h-auto p-4 flex flex-col items-center space-y-2"
            >
              <div className="w-6 h-6 bg-green-100 rounded flex items-center justify-center">
                <div className="w-4 h-1 bg-green-500 rounded"></div>
              </div>
              <span className="text-sm">Message Audio</span>
              <span className="text-xs text-gray-500">Test vocal</span>
            </Button>
            
            <Button 
              onClick={() => sendTestNotification('location')} 
              disabled={loading}
              variant="outline"
              className="h-auto p-4 flex flex-col items-center space-y-2"
            >
              <div className="w-6 h-6 bg-red-100 rounded flex items-center justify-center">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              </div>
              <span className="text-sm">Position GPS</span>
              <span className="text-xs text-gray-500">Test maps</span>
            </Button>
          </div>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 mb-2">🎯 Ce que vous devriez recevoir:</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• <strong>Message Texte:</strong> Notification WhatsApp avec lien vers dashboard</li>
              <li>• <strong>Avec Photo:</strong> Message + lien cliquable vers l'image</li>
              <li>• <strong>Message Audio:</strong> Message + lien vers fichier audio + transcription</li>
              <li>• <strong>Position GPS:</strong> Message + lien Google Maps pour itinéraire</li>
            </ul>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold flex items-center">
              <Settings className="w-5 h-5 mr-2" />
              Instructions de Configuration
            </h2>
            <Button 
              onClick={checkConfiguration} 
              disabled={loading}
              variant="outline"
              size="sm"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Actualiser
            </Button>
          </div>
          
          {instructions ? (
            <div className="bg-gray-50 rounded p-4">
              <pre className="whitespace-pre-wrap text-sm text-gray-700 font-mono">
                {instructions}
              </pre>
            </div>
          ) : (
            <p className="text-gray-500">Chargement des instructions...</p>
          )}
        </div>
      </div>
    </main>
  );
}