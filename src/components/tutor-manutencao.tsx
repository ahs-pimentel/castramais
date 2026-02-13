import { Wrench, MessageCircle } from 'lucide-react'

export function TutorManutencao() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6">
      {/* Logo */}
      <img
        src="/LOGO.svg"
        alt="Castra+ MG"
        className="h-20 w-auto mb-8"
      />

      {/* Ícone */}
      <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mb-6">
        <Wrench className="w-10 h-10 text-orange-500" />
      </div>

      {/* Texto */}
      <h1 className="text-2xl font-bold text-gray-900 text-center mb-3">
        Estamos em atualização
      </h1>
      <p className="text-gray-500 text-center max-w-sm mb-2">
        Estamos melhorando o portal do tutor para oferecer uma experiência ainda melhor para você.
      </p>
      <p className="text-gray-500 text-center max-w-sm mb-8">
        Em breve estaremos de volta!
      </p>

      {/* Botão WhatsApp */}
      <a
        href="https://wa.me/553121812062"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-3 bg-green-500 hover:bg-green-600 text-white font-semibold py-4 px-8 rounded-2xl transition-all shadow-lg hover:shadow-xl"
      >
        <MessageCircle className="w-6 h-6" />
        Fale conosco pelo WhatsApp
      </a>

      {/* Rodapé */}
      <p className="text-xs text-gray-400 mt-12">
        Agradecemos pela compreensão
      </p>
    </div>
  )
}
