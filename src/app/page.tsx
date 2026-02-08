'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Heart, MapPin, Phone, Calendar, Dog, Cat, AlertTriangle, CheckCircle, Clock, Users, Loader2 } from 'lucide-react'

interface Campanha {
  id: string
  nome: string
  cidade: string
  uf: string
  dataDescricao: string | null
  ativa: boolean
}

export default function LandingPage() {
  const [campanhas, setCampanhas] = useState<Campanha[]>([])
  const [loadingCampanhas, setLoadingCampanhas] = useState(true)

  useEffect(() => {
    fetch('/api/campanhas')
      .then(res => res.ok ? res.json() : [])
      .then((data: Campanha[]) => {
        setCampanhas(data)
        setLoadingCampanhas(false)
      })
      .catch(() => {
        setCampanhas([])
        setLoadingCampanhas(false)
      })
  }, [])

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-cream to-cream-light">
        <div className="max-w-6xl mx-auto px-4 py-8">
          {/* Header */}
          <header className="flex justify-between items-center mb-12">
            <img src="/LOGO.svg" alt="Castra+ MG" className="h-12 md:h-14 w-auto" />
            <Link
              href="/tutor"
              className="px-6 py-3 bg-primary text-white font-medium rounded-xl hover:bg-primary-hover transition-colors"
            >
              Área do Tutor
            </Link>
          </header>

          {/* Hero Content */}
          <div className="text-center py-12">
            <h1 className="text-4xl md:text-5xl font-bold text-secondary mb-6">
              A castração é um gesto de <span className="text-primary">amor!</span>
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
              O Castra+MG é um programa de castração gratuita para cães e gatos,
              parte da Agenda Nacional de Proteção, Defesa, Bem-Estar e Direitos dos Animais.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/tutor/cadastro"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-primary text-white font-semibold rounded-2xl hover:bg-primary-hover transition-colors shadow-lg shadow-primary/30"
              >
                <Heart className="w-5 h-5" />
                Cadastrar meu Pet
              </Link>
              <a
                href="https://wa.me/5531975425424"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-green-500 text-white font-semibold rounded-2xl hover:bg-green-600 transition-colors"
              >
                <Phone className="w-5 h-5" />
                WhatsApp
              </a>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-8">
            {[
              { icon: Dog, label: 'Cães', value: '500+' },
              { icon: Cat, label: 'Gatos', value: '300+' },
              { icon: MapPin, label: 'Cidades', value: '15+' },
              { icon: Users, label: 'Famílias', value: '800+' },
            ].map((stat) => (
              <div key={stat.label} className="bg-white rounded-2xl p-6 text-center shadow-sm">
                <stat.icon className="w-8 h-8 text-primary mx-auto mb-2" />
                <div className="text-2xl font-bold text-secondary">{stat.value}</div>
                <div className="text-gray-500">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Próximas Campanhas */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <span className="inline-block px-4 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium mb-4">
              Agenda
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-secondary mb-4">
              Próximas Campanhas
            </h2>
            <p className="text-gray-600 max-w-xl mx-auto">
              Confira as próximas cidades que receberão o mutirão de castração gratuita
            </p>
          </div>

          {loadingCampanhas ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
          ) : campanhas.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">Nenhuma campanha ativa no momento. Fique atento para novas datas!</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {campanhas.map((campanha) => (
                <div
                  key={campanha.id}
                  className="bg-cream-light border-2 border-cream-dark rounded-2xl p-6 hover:border-primary transition-colors"
                >
                  <div className="flex items-center gap-2 text-primary mb-3">
                    <MapPin className="w-5 h-5" />
                    <span className="font-semibold">{campanha.uf || 'MG'}</span>
                  </div>
                  <h3 className="text-xl font-bold text-secondary mb-2">{campanha.cidade}</h3>
                  {campanha.dataDescricao && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <Calendar className="w-4 h-4" />
                      <span>{campanha.dataDescricao}</span>
                    </div>
                  )}
                  <p className="text-sm text-gray-500 mt-2">{campanha.nome}</p>
                </div>
              ))}
            </div>
          )}

          <div className="text-center mt-8">
            <a
              href="https://wa.me/5531975425424"
              className="inline-flex items-center gap-2 text-primary font-medium hover:underline"
            >
              <Phone className="w-4 h-4" />
              Entre em contato para mais informações: (31) 97542-5424
            </a>
          </div>
        </div>
      </section>

      {/* Orientações */}
      <section className="py-16 bg-cream-light">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <span className="inline-block px-4 py-1 bg-secondary/10 text-secondary rounded-full text-sm font-medium mb-4">
              Importante
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-secondary mb-4">
              Orientações Pré-Cirúrgicas
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-12">
            {/* Caninos */}
            <div className="bg-white rounded-2xl p-8 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                  <Dog className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold text-secondary">Caninos</h3>
              </div>
              <ul className="space-y-3">
                {[
                  'Jejum ALIMENTAR de 6 horas',
                  'Jejum de ÁGUA de 6 horas',
                  'Obrigatório estar de coleira ou peitoral com guia',
                  'Caixa de transporte opcional',
                  'Levar toalha ou cobertor',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-600">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Felinos */}
            <div className="bg-white rounded-2xl p-8 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-secondary/10 rounded-xl flex items-center justify-center">
                  <Cat className="w-6 h-6 text-secondary" />
                </div>
                <h3 className="text-xl font-bold text-secondary">Felinos</h3>
              </div>
              <ul className="space-y-3">
                {[
                  'Jejum ALIMENTAR de 4 horas',
                  'Manter o animal em cômodo fechado na noite anterior',
                  'Evitar risco de fuga',
                  'Obrigatório estar em caixa de transporte ou similar',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-600">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Restrições */}
          <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-500" />
              </div>
              <h3 className="text-xl font-bold text-red-700">Animais que NÃO poderão ser castrados</h3>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              {[
                'Braquicefálicos (Pug, Bulldogue, Shih-tzu)',
                'Uso de medicação controlada (Alopurinol, etc)',
                'Doenças crônicas (renais, cardíacas, respiratórias)',
                'Cadelas em amamentação ou menos de 45 dias do parto',
                'Animais muito magros ou desnutridos',
                'Adoecidos há menos de 15 dias ou em tratamento',
                'Cães filhotes abaixo de 6 meses',
                'Cães idosos acima de 10 anos',
              ].map((item) => (
                <div key={item} className="flex items-start gap-2">
                  <span className="text-red-500 font-bold">•</span>
                  <span className="text-red-700">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Sobre o Atendimento */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <span className="inline-block px-4 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium mb-4">
              Informações
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-secondary mb-4">
              Sobre o Atendimento
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Clock, title: 'Cadastro', desc: 'Realize o cadastro quando chegar no local' },
              { icon: Users, title: 'Responsável', desc: 'Deve ser maior de idade e permanecer até a liberação' },
              { icon: AlertTriangle, title: 'Acompanhantes', desc: 'Evite levar crianças e idosos' },
            ].map((item) => (
              <div key={item.title} className="bg-cream-light rounded-2xl p-6">
                <item.icon className="w-8 h-8 text-primary mb-4" />
                <h3 className="font-bold text-secondary mb-2">{item.title}</h3>
                <p className="text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 bg-green-50 border-2 border-green-200 rounded-2xl p-6 text-center">
            <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-3" />
            <p className="text-green-700 font-medium">
              Os animais já saem da cirurgia medicados e recebem gratuitamente a roupa pós-cirúrgica ou colar cervical.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-16 bg-secondary">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Aguardamos você!
          </h2>
          <p className="text-xl text-white/80 mb-8">
            Cadastre seu pet e participe da próxima campanha de castração gratuita
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/tutor/cadastro"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-primary text-white font-semibold rounded-2xl hover:bg-primary-hover transition-colors"
            >
              <Heart className="w-5 h-5" />
              Cadastrar meu Pet
            </Link>
            <a
              href="https://wa.me/5531975425424"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-secondary font-semibold rounded-2xl hover:bg-gray-100 transition-colors"
            >
              <Phone className="w-5 h-5" />
              (31) 97542-5424
            </a>
          </div>
        </div>
      </section>

      {/* Parceiros e Apoio Institucional */}
      <section className="py-12 bg-cream-light">
        <div className="max-w-6xl mx-auto px-4">
          <p className="text-center text-sm font-medium text-gray-500 uppercase tracking-wider mb-8">
            Apoio Institucional
          </p>
          <div className="flex flex-wrap items-center justify-center gap-10 md:gap-16">
            <img
              src="/logos/ministerio-meio-ambiente.png"
              alt="Ministério do Meio Ambiente e Mudança do Clima - Governo do Brasil"
              className="h-14 md:h-20 w-auto object-contain"
            />
            <img
              src="/logos/vida-animal-livre.png"
              alt="Vida Animal Livre"
              className="h-16 md:h-24 w-auto object-contain"
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-secondary-hover py-8">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <img src="/LOGO.svg" alt="Castra+ MG" className="h-10 w-auto brightness-0 invert" />
            <div className="text-center">
              <p className="text-white/60 text-sm">
                Programa da Agenda Nacional de Proteção, Defesa, Bem-Estar e Direitos dos Animais.<br />
                Integrante do Programa Nacional de Manejo Populacional Ético de Cães e Gatos.
              </p>
              <div className="flex items-center justify-center gap-4 mt-3">
                <a
                  href="/termos-de-uso.html"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white/60 text-xs hover:text-white transition-colors"
                >
                  Termos de Uso
                </a>
                <span className="text-white/40">•</span>
                <a
                  href="/politica-privacidade.html"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white/60 text-xs hover:text-white transition-colors"
                >
                  Política de Privacidade
                </a>
                <span className="text-white/40">•</span>
                <Link href="/login" className="text-white/40 text-xs hover:text-white/60 transition-colors">
                  Acesso administrativo
                </Link>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
