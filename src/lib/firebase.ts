// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from "firebase/auth";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBFHHUaC0rILRfd-vxaK_hoDa3bPj2JvMk",
  authDomain: "castramais-9f7e0.firebaseapp.com",
  projectId: "castramais-9f7e0",
  storageBucket: "castramais-9f7e0.firebasestorage.app",
  messagingSenderId: "524785577715",
  appId: "1:524785577715:web:c7b5ea2a848889669b9186",
  measurementId: "G-EFMRJPDP34"
};

// Initialize Firebase (evita reinicialização em hot reload)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Firebase services
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);

// Analytics só funciona no browser
export const getAnalyticsInstance = () => {
  if (typeof window !== 'undefined') {
    return getAnalytics(app);
  }
  return null;
};

// ============================================
// PHONE AUTHENTICATION
// ============================================

/**
 * Cria um RecaptchaVerifier invisível para phone auth
 * @param elementId - ID do elemento HTML onde o reCAPTCHA será renderizado
 * @returns RecaptchaVerifier instance
 */
export function createRecaptchaVerifier(elementId: string): RecaptchaVerifier {
  return new RecaptchaVerifier(auth, elementId, {
    size: 'invisible',
    callback: () => {
      // reCAPTCHA resolvido, pode enviar SMS
    },
  });
}

/**
 * Envia código OTP via SMS usando Firebase Phone Authentication
 * @param phoneNumber - Número no formato E.164 (+55XXXXXXXXXXX)
 * @param recaptchaVerifier - Instância do RecaptchaVerifier
 * @returns ConfirmationResult para verificar o código posteriormente
 */
export async function sendPhoneOTP(
  phoneNumber: string,
  recaptchaVerifier: RecaptchaVerifier
): Promise<ConfirmationResult> {
  try {
    const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifier);
    return confirmationResult;
  } catch (error: any) {
    console.error('Erro ao enviar OTP:', error);
    throw error;
  }
}

/**
 * Verifica o código OTP inserido pelo usuário
 * @param confirmationResult - Resultado do envio do SMS
 * @param code - Código de 6 dígitos inserido pelo usuário
 * @returns UserCredential com o token de autenticação
 */
export async function verifyPhoneOTP(
  confirmationResult: ConfirmationResult,
  code: string
) {
  try {
    const result = await confirmationResult.confirm(code);
    return result;
  } catch (error: any) {
    console.error('Erro ao verificar código:', error);
    throw error;
  }
}

/**
 * Converte telefone brasileiro para formato E.164
 * @param phone - Telefone no formato brasileiro (11999999999)
 * @returns Telefone no formato E.164 (+5511999999999)
 */
export function formatPhoneToE164(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('55')) {
    return `+${cleaned}`;
  }
  return `+55${cleaned}`;
}

export default app;
