import * as admin from 'firebase-admin';

// Inicializar Firebase Admin SDK (apenas uma vez)
if (!admin.apps.length) {
  // Verificar se está usando service account JSON ou credenciais padrão
  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

  if (serviceAccount) {
    // Service Account via variável de ambiente (JSON string)
    try {
      const serviceAccountKey = JSON.parse(serviceAccount);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccountKey),
      });
    } catch (error) {
      console.error('Erro ao inicializar Firebase Admin com service account:', error);
      throw new Error('Configuração do Firebase Admin inválida');
    }
  } else {
    // Fallback: credenciais padrão do ambiente (para Cloud Run, etc.)
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
    });
  }
}

export const adminAuth = admin.auth();
export const adminFirestore = admin.firestore();

/**
 * Verifica e decodifica um token Firebase ID
 * @param idToken - Token Firebase do frontend
 * @returns DecodedIdToken com informações do usuário
 */
export async function verifyFirebaseToken(idToken: string) {
  try {
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    return decodedToken;
  } catch (error) {
    console.error('Erro ao verificar token Firebase:', error);
    throw new Error('Token Firebase inválido ou expirado');
  }
}

export default admin;
