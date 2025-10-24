"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Mail, CheckCircle, XCircle, Loader2 } from "lucide-react";

export default function TestEmailPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const testEmailConfig = async () => {
    setIsLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/test-notifications/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      
      if (data.success) {
        setResult({
          success: true,
          message: 'Email de test envoyé avec succès! Vérifiez votre boîte de réception Gmail.'
        });
      } else {
        setResult({
          success: false,
          message: `Échec de l'envoi: ${data.error || 'Erreur inconnue'}`
        });
      }
    } catch (error) {
      setResult({
        success: false,
        message: `Erreur de connexion: ${error instanceof Error ? error.message : 'Erreur inconnue'}`
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 p-4">
      <div className="max-w-2xl mx-auto pt-20">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5" />
              Test de configuration Email
            </CardTitle>
            <CardDescription>
              Vérifiez que la configuration email est correcte pour recevoir les demandes des clients
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold text-blue-900 mb-2">Configuration requise:</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• EMAIL_USER: ebfbouake@gmail.com</li>
                <li>• EMAIL_PASS: Mot de passe d'application Gmail</li>
                <li>• TARGET_EMAIL: ebfbouake@gmail.com</li>
              </ul>
            </div>

            <div className="bg-yellow-50 p-4 rounded-lg">
              <h3 className="font-semibold text-yellow-900 mb-2">Comment obtenir un mot de passe d'application Gmail:</h3>
              <ol className="text-sm text-yellow-800 space-y-1 list-decimal list-inside">
                <li>Allez dans les paramètres de votre compte Google</li>
                <li>Sécurité → Vérification en deux étapes (doit être activée)</li>
                <li>Mots de passe d'application</li>
                <li>Créez un nouveau mot de passe pour "Autre application"</li>
                <li>Utilisez ce mot de passe dans EMAIL_PASS</li>
              </ol>
            </div>

            <Button 
              onClick={testEmailConfig} 
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Envoi en cours...
                </>
              ) : (
                <>
                  <Mail className="w-4 h-4 mr-2" />
                  Envoyer un email de test
                </>
              )}
            </Button>

            {result && (
              <Alert className={result.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
                <div className="flex items-center gap-2">
                  {result.success ? (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-600" />
                  )}
                  <AlertDescription className={result.success ? "text-green-800" : "text-red-800"}>
                    {result.message}
                  </AlertDescription>
                </div>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}