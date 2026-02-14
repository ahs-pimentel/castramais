import { useState, useEffect, useRef } from 'react';
import { RecaptchaVerifier, ConfirmationResult, UserCredential } from 'firebase/auth';
import { createRecaptchaVerifier, sendPhoneOTP, verifyPhoneOTP, formatPhoneToE164 } from '@/lib/firebase';

interface UseFirebasePhoneAuthReturn {
  sendOTP: (phoneNumber: string) => Promise<void>;
  verifyOTP: (code: string) => Promise<UserCredential>; // Retorna o UserCredential completo
  loading: boolean;
  error: string | null;
  clearError: () => void;
}

export function useFirebasePhoneAuth(): UseFirebasePhoneAuthReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recaptchaVerifierRef = useRef<RecaptchaVerifier | null>(null);
  const confirmationResultRef = useRef<ConfirmationResult | null>(null);

  // Inicializar reCAPTCHA quando o componente montar
  useEffect(() => {
    // Só inicializa no browser
    if (typeof window !== 'undefined' && !recaptchaVerifierRef.current) {
      try {
        recaptchaVerifierRef.current = createRecaptchaVerifier('recaptcha-container');
      } catch (err) {
        console.error('Erro ao inicializar reCAPTCHA:', err);
      }
    }

    // Cleanup
    return () => {
      if (recaptchaVerifierRef.current) {
        try {
          recaptchaVerifierRef.current.clear();
        } catch (err) {
          // Ignorar erros no cleanup
        }
      }
    };
  }, []);

  const sendOTP = async (phoneNumber: string): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      if (!recaptchaVerifierRef.current) {
        throw new Error('reCAPTCHA não inicializado');
      }

      // Formatar telefone para E.164
      const e164Phone = formatPhoneToE164(phoneNumber);
      console.log('[Hook] Telefone formatado:', e164Phone);

      // Enviar OTP via Firebase
      const confirmationResult = await sendPhoneOTP(e164Phone, recaptchaVerifierRef.current);
      confirmationResultRef.current = confirmationResult;

      setLoading(false);
    } catch (err: any) {
      setLoading(false);
      
      // Tratar erros específicos do Firebase
      const errorCode = err?.code || '';
      console.error('[Hook] Erro ao enviar OTP:', errorCode, err.message);
      
      if (errorCode === 'auth/invalid-phone-number') {
        setError('Número de telefone inválido');
      } else if (errorCode === 'auth/too-many-requests') {
        setError('Muitas tentativas. Aguarde alguns minutos e tente novamente.');
      } else if (errorCode === 'auth/quota-exceeded') {
        setError('Limite de SMS excedido. Tente novamente mais tarde.');
      } else if (errorCode === 'auth/captcha-check-failed') {
        setError('Falha na verificação reCAPTCHA. Recarregue a página.');
      } else if (errorCode === 'auth/missing-phone-number') {
        setError('Número de telefone não fornecido');
      } else if (errorCode === 'auth/operation-not-allowed') {
        setError('Autenticação por telefone não está habilitada. Contate o suporte.');
      } else if (errorCode === 'auth/billing-not-enabled') {
        setError('Serviço de SMS temporariamente indisponível. Por favor, tente novamente mais tarde ou entre em contato pelo WhatsApp.');
      } else {
        setError(`Erro ao enviar código: ${err.message || 'Tente novamente'}`);
      }
      
      throw err;
    }
  };

  const verifyOTP = async (code: string): Promise<UserCredential> => {
    setLoading(true)
    setError(null)

    try {
      if (!confirmationResultRef.current) {
        throw new Error('Nenhum código foi enviado. Envie o OTP primeiro.')
      }

      // Verificar código
      const userCredential = await verifyPhoneOTP(confirmationResultRef.current, code)

      setLoading(false)
      return userCredential
    } catch (err: any) {
      setLoading(false)
      
      // Tratar erros específicos
      const errorCode = err?.code || ''
      
      if (errorCode === 'auth/invalid-verification-code') {
        setError('Código inválido. Verifique e tente novamente.')
      } else if (errorCode === 'auth/code-expired') {
        setError('Código expirado. Solicite um novo código.')
      } else {
        setError('Erro ao verificar código. Tente novamente.')
      }
      
      throw err
    }
  }

  const clearError = () => {
    setError(null);
  };

  return {
    sendOTP,
    verifyOTP,
    loading,
    error,
    clearError,
  };
}
