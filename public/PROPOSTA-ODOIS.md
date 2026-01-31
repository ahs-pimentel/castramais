# Proposta Comercial

**Plataforma de Gestão e Comunicação Digital**

---

## Solução Completa de Tecnologia

*Sistema integrado de cadastro, gerenciamento e comunicação automatizada via WhatsApp*

A Odois Tecnologia oferece uma solução completa e integrada para organizações que necessitam de um sistema robusto de gestão de cadastros, comunicação automatizada e presença digital profissional.

Nossa plataforma centraliza todas as operações em um único ambiente, proporcionando eficiência operacional, redução de custos e uma experiência superior para seus usuários finais.

---

## 1. Sobre a Odois Tecnologia

A Odois Tecnologia é uma empresa especializada no desenvolvimento de soluções digitais personalizadas para organizações públicas e privadas. Com foco em inovação e eficiência, desenvolvemos plataformas que automatizam processos, melhoram a comunicação e otimizam a gestão de dados.

Nossa equipe é composta por profissionais experientes em desenvolvimento de software, infraestrutura de servidores e integração de sistemas, garantindo entregas de alta qualidade e suporte técnico especializado.

**Nossos diferenciais:**
- Desenvolvimento sob medida para cada cliente
- Infraestrutura própria com alta disponibilidade
- Suporte técnico dedicado
- Integração nativa com WhatsApp Business API
- Conformidade com LGPD

---

## 2. Visão Geral da Solução

A plataforma proposta é um ecossistema digital completo que integra:

- **Sistema de Gestão:** Ambiente web responsivo para cadastro, consulta e gerenciamento de informações
- **Comunicação Automatizada:** Integração com WhatsApp Business para envio de notificações, códigos de verificação e comunicados
- **Landing Page Profissional:** Página institucional otimizada para conversão e captação de cadastros
- **Infraestrutura Dedicada:** Servidor VPS exclusivo com banco de dados PostgreSQL de alta performance

A solução foi projetada para escalar conforme a demanda, suportando desde centenas até milhares de usuários simultâneos sem perda de performance.

---

## 3. Detalhamento dos Serviços

### 3.1 Sistema de Cadastro e Gerenciamento com WhatsApp

O coração da plataforma é um sistema web completo que permite:

**Gestão de Cadastros:**
- Cadastro completo de usuários com validação de CPF
- Campos personalizáveis conforme necessidade do cliente
- Busca avançada por múltiplos critérios (nome, CPF, cidade, status)
- Exportação de dados em formatos CSV e Excel
- Histórico completo de alterações e interações

**Autenticação Segura via WhatsApp:**
- Login sem senha utilizando código OTP (One-Time Password)
- Envio automático de código de 6 dígitos via WhatsApp
- Fallback para e-mail quando WhatsApp indisponível
- Tokens JWT com expiração configurável
- Proteção contra tentativas de força bruta

**Painel Administrativo:**
- Dashboard com estatísticas em tempo real
- Gestão de múltiplos usuários administradores
- Níveis de permissão configuráveis
- Logs de auditoria de todas as ações
- Relatórios gerenciais exportáveis

**Área do Usuário:**
- Interface responsiva otimizada para mobile
- Consulta e atualização de dados cadastrais
- Histórico de interações e solicitações
- Notificações personalizadas

**Funcionalidades Técnicas:**
- API RESTful documentada para integrações
- Validação automática de CEP via ViaCEP e BrasilAPI
- Máscaras e validações em tempo real
- Cache inteligente para alta performance
- Backup automático diário

---

### 3.2 Landing Page Institucional

Página web profissional e otimizada que serve como porta de entrada para sua organização:

**Design e Experiência:**
- Layout moderno e responsivo (mobile-first)
- Identidade visual personalizada com cores e logo do cliente
- Animações sutis para melhor engajamento
- Carregamento otimizado (< 3 segundos)
- Compatível com todos os navegadores modernos

**Seções Incluídas:**
- Hero section com chamada principal e CTA
- Apresentação dos serviços/programas
- Informações importantes e orientações
- Agenda de eventos/campanhas
- Estatísticas e números relevantes
- Seção de contato com WhatsApp integrado
- Footer com links institucionais

**Otimização:**
- SEO on-page para melhor posicionamento no Google
- Meta tags otimizadas para compartilhamento em redes sociais
- Certificado SSL incluso (HTTPS)
- Compressão de imagens automática
- CDN para distribuição global

---

### 3.3 VPS Anual (Servidor Virtual Privado)

Infraestrutura dedicada exclusivamente para sua aplicação:

**Especificações do Servidor:**
- Processador: 2 vCPUs dedicadas
- Memória RAM: 4GB DDR4
- Armazenamento: 80GB SSD NVMe
- Transferência: Ilimitada
- Localização: Data center no Brasil (baixa latência)

**Recursos Inclusos:**
- Sistema operacional Ubuntu Server LTS
- Docker e Docker Compose pré-configurados
- Nginx como proxy reverso
- Certificado SSL Let's Encrypt (renovação automática)
- Firewall UFW configurado
- Monitoramento de uptime 24/7

**Garantias:**
- SLA de 99.9% de disponibilidade
- Backup automático diário (retenção de 7 dias)
- Proteção contra DDoS básica
- IP dedicado fixo
- Acesso SSH para manutenção

---

### 3.4 WhatsApp Business API

Integração profissional com WhatsApp para comunicação em escala:

**Recursos da Integração:**
- Envio de mensagens de texto automatizadas
- Suporte a templates de mensagem
- Envio de códigos de verificação (OTP)
- Notificações de status e confirmações
- Mensagens personalizadas com variáveis

**Tipos de Mensagem:**
- Códigos de acesso e verificação
- Confirmações de cadastro
- Lembretes de agendamentos
- Comunicados gerais
- Atualizações de status

**Capacidade:**
- Até 1.000 mensagens/mês inclusas
- Relatório de entrega e leitura
- Fila de mensagens com retry automático
- Rate limiting para evitar bloqueios

**Conformidade:**
- Opt-in obrigatório dos usuários
- Horário de envio configurável
- Templates aprovados pelo WhatsApp
- Política de privacidade inclusa

---

### 3.5 Banco de Dados Dedicado

Armazenamento seguro e performático para todos os dados:

**Tecnologia:**
- PostgreSQL 16 (última versão estável)
- Container Docker isolado
- Volume persistente com redundância

**Características:**
- Capacidade inicial: 10GB (expansível)
- Conexões simultâneas: até 100
- Queries otimizadas com índices
- Full-text search nativo
- Suporte a JSON/JSONB

**Segurança:**
- Criptografia em repouso
- Conexões SSL obrigatórias
- Usuários com privilégios mínimos
- Logs de acesso auditáveis
- Isolamento de rede

**Manutenção:**
- Backup automático diário
- Point-in-time recovery (últimas 24h)
- Vacuum automático para performance
- Monitoramento de uso e alertas
- Atualizações de segurança

---

## 4. Benefícios da Solução

| Benefício | Descrição |
|-----------|-----------|
| **Centralização** | Todas as informações em um único sistema acessível de qualquer lugar |
| **Automação** | Redução de trabalho manual com processos automatizados |
| **Comunicação Eficiente** | Alcance seus usuários instantaneamente via WhatsApp |
| **Profissionalismo** | Presença digital de alto nível com landing page dedicada |
| **Segurança** | Infraestrutura dedicada com backups e criptografia |
| **Escalabilidade** | Sistema preparado para crescer com sua demanda |
| **Economia** | Solução completa por um valor único anual |
| **Suporte** | Equipe técnica disponível para ajustes e melhorias |

---

## 5. Suporte e Manutenção

O pacote inclui suporte técnico durante toda a vigência do contrato:

**Incluso:**
- Correção de bugs e falhas do sistema
- Atualizações de segurança
- Monitoramento de disponibilidade
- Ajustes de configuração
- Suporte via WhatsApp em horário comercial
- Backup e recuperação de dados

**Tempo de Resposta:**
- Incidentes críticos: até 4 horas
- Incidentes moderados: até 24 horas
- Solicitações gerais: até 48 horas

---

## 6. Cronograma de Implantação

| Fase | Atividade | Prazo |
|------|-----------|-------|
| 1 | Kickoff e levantamento de requisitos | Semana 1 |
| 2 | Configuração de infraestrutura (VPS + BD) | Semana 1-2 |
| 3 | Personalização do sistema e landing page | Semana 2-3 |
| 4 | Integração WhatsApp Business | Semana 3 |
| 5 | Testes e homologação | Semana 4 |
| 6 | Go-live e treinamento | Semana 4 |

**Prazo total estimado:** 4 semanas após aprovação

---

## 7. Investimento

### Plano Anual Completo

| Item | Descrição |
|------|-----------|
| Sistema de Cadastro e Gerenciamento | Plataforma web completa com área admin e área do usuário |
| Integração WhatsApp Business | Envio automatizado de mensagens e códigos OTP |
| Landing Page Institucional | Página profissional responsiva e otimizada |
| VPS Dedicado (12 meses) | Servidor exclusivo com 2vCPU, 4GB RAM, 80GB SSD |
| Banco de Dados PostgreSQL | Instância dedicada com backup diário |
| Suporte Técnico | Atendimento durante toda vigência do contrato |

---

**Valor Total Anual: R$ 8.000,00**
*(oito mil reais)*

---

**Condições de Pagamento:**
- PIX ou transferência bancária
- Entrada de 50% na aprovação
- 50% restante na entrega (go-live)
- Ou parcelamento em até 4x sem juros

**Renovação:**
- Valor de renovação anual: R$ 6.000,00 (desconto de 25%)
- Inclui manutenção, hospedagem e suporte continuado

---

## 8. Validade da Proposta

Esta proposta é válida por **30 dias** a partir da data de emissão.

Após este período, os valores e condições podem ser revisados.

---

## 9. Próximos Passos

1. Aprovação desta proposta
2. Assinatura do contrato de prestação de serviços
3. Pagamento da entrada (50%)
4. Início do projeto

---

**Belo Horizonte, 30 de janeiro de 2026.**

---

**Angelo Pimentel**
*Odois Tecnologia*

contato@odois.com.br
WhatsApp: (31) 97542-5424

---

*Esta proposta é confidencial e destinada exclusivamente ao destinatário. A reprodução ou distribuição não autorizada é proibida.*
