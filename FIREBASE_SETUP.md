# Configuração Firebase SMS OTP

Este documento descreve como configurar o Firebase Phone Authentication (SMS OTP) no projeto.

## 1. Habilitar Phone Authentication no Firebase Console

1. Acesse o [Firebase Console](https://console.firebase.google.com/)
2. Selecione seu projeto: **castramais-9f7e0**
3. No menu lateral, vá em **Build** → **Authentication**
4. Clique na aba **Sign-in method**
5. Localize **Phone** na lista e clique em **Enable**
6. Salve as alterações

## 2. Configurar Domínios Autorizados

Ainda em **Authentication** → **Settings** → **Authorized domains**:

1. Adicione os domínios do seu aplicativo:
   - `localhost` (já deve estar adicionado)
   - `castramaismg.org` (seu domínio de produção)
   - Outros domínios de staging/desenvolvimento, se aplicável

## 3. Configurar reCAPTCHA

O Firebase Phone Auth usa reCAPTCHA v2 automaticamente para verificação web.

**Não é necessária configuração adicional** - o reCAPTCHA está configurado como invisível no código.

### Teste de reCAPTCHA

Se você quiser testar localmente sem acionar o reCAPTCHA real, use os números de teste do Firebase:

1. No Firebase Console, vá em **Authentication** → **Sign-in method** → **Phone**
2. Role até **Phone numbers for testing**
3. Adicione um número de teste (ex: `+1 650-555-1234`) e um código fixo (ex: `123456`)
4. Use este número no desenvolvimento para evitar custos de SMS

## 4. Configuração Simplificada (Sem Service Account)

⚠️ **NOTA:** Este projeto foi configurado para funcionar **SEM** Firebase Admin SDK no backend, evitando a necessidade de Service Account Key.

A validação do OTP é feita inteiramente no frontend pelo Firebase, e o backend apenas verifica:
- CPF do tutor no banco de dados
- Correspondência entre o telefone autenticado e o cadastrado

**Não é necessária configuração adicional no backend!**

## 5. Testar o Fluxo

### 5.1 Desenvolvimento Local

1. Inicie o servidor: `npm run dev`
2. Acesse: `http://localhost:3000/tutor`
3. Digite um CPF cadastrado
4. O sistema buscará o telefone e enviará SMS via Firebase
5. Digite o código de 6 dígitos recebido por SMS
6. Você será autenticado no sistema

### 5.2 Números de Teste

Para evitar custos durante desenvolvimento, use números de teste:

1. Configure no Firebase Console (passo 3 acima)
2. Use o número configurado no cadastro do tutor
3. O código sempre será o mesmo (ex: `123456`)

## 6. Custos

### Firebase Authentication
- **Gratuito** até 10.000 verificações/mês
- Após isso: ~$0.01 por verificação (SMS)

### Estimativa de Custos
- 1.000 SMS/mês = **Gratuito**
- 20.000 SMS/mês = ~$100/mês
- 50.000 SMS/mês = ~$400/mês

**Dica:** Para reduzir custos, mantenha a opção de login por senha disponível para usuários recorrentes.

## 7. Monitoramento

Acompanhe o uso no Firebase Console:

1. **Usage and billing** → **Details & settings**
2. Verifique **Authentication** → **Phone**
3. Acompanhe o número de verificações por dia/mês

## 8. Segurança

### ⚠️ IMPORTANTE:

1. **NUNCA** commite o arquivo JSON do Service Account no git
2. **SEMPRE** use variáveis de ambiente em produção
3. Configure **App Check** (opcional mas recomendado) para proteger contra abuso
4. Monitore tentativas de autenticação suspeitas no Firebase Console

## 9. Troubleshooting

### Erro: "reCAPTCHA não inicializado"
- Verifique se o domínio está autorizado no Firebase Console
- Certifique-se de que o elemento `#recaptcha-container` existe no DOM

### Erro: "auth/invalid-phone-number"
- Verifique se o número está no formato E.164 (+55XXXXXXXXXXX)
- Confirme que o número tem 11 dígitos (DDD + número)

### Erro: "auth/too-many-requests"
- Muitas tentativas do mesmo IP/dispositivo
- Aguarde alguns minutos ou use número de teste

### Erro: "Token Firebase inválido ou expirado"
- Verifique se o Service Account Key está configurado corretamente
- Confirme que o `project_id` no JSON corresponde ao projeto Firebase

## 10. Rollback (Em caso de problemas)

Se precisar voltar para o sistema antigo de OTP por WhatsApp:

1. Reverta os commits relacionados ao Firebase
2. A API `/api/tutor/enviar-codigo` ainda funciona com WhatsApp
3. O banco de dados `otp_codes` ainda existe
4. Nenhuma migração de dados é necessária

## Suporte

Em caso de dúvidas sobre Firebase:
- [Documentação Firebase Phone Auth](https://firebase.google.com/docs/auth/web/phone-auth)
- [Preços do Firebase](https://firebase.google.com/pricing)
