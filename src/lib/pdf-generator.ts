// Gerador de PDF para registros de animais

import jsPDF from 'jspdf'
import 'jspdf-autotable'

// Declaração de tipos para autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: AutoTableOptions) => jsPDF
    lastAutoTable: { finalY: number }
  }
}

interface AutoTableOptions {
  head?: string[][]
  body?: (string | number)[][]
  startY?: number
  theme?: 'striped' | 'grid' | 'plain'
  headStyles?: {
    fillColor?: number[]
    textColor?: number[]
    fontStyle?: string
    fontSize?: number
  }
  bodyStyles?: {
    fontSize?: number
  }
  alternateRowStyles?: {
    fillColor?: number[]
  }
  margin?: { left?: number; right?: number }
  columnStyles?: Record<number, { cellWidth?: number | 'auto' | 'wrap' }>
}

interface Animal {
  id: string
  nome: string
  especie: string
  raca: string
  sexo: string
  peso?: number
  idadeAnos?: number
  idadeMeses?: number
  registroSinpatinhas: string
  status: string
  dataAgendamento?: string
  dataRealizacao?: string
  tutor?: {
    nome: string
    cpf: string
    telefone: string
    cidade: string
    bairro: string
  }
}

interface Tutor {
  id: string
  nome: string
  cpf: string
  telefone: string
  email?: string
  endereco: string
  cidade: string
  bairro: string
  createdAt: string
  animais?: Animal[]
}

interface Entidade {
  id: string
  nome: string
  cnpj?: string
  responsavel: string
  telefone: string
  email: string
  cidade: string
  bairro?: string
  ativo: boolean
  createdAt: string
}

// Cores da marca Castra+MG
const CORES = {
  laranja: [233, 78, 53] as [number, number, number],     // #E94E35
  azulMarinho: [43, 45, 94] as [number, number, number], // #2B2D5E
}

function formatarData(data: string | undefined): string {
  if (!data) return '-'
  return new Date(data).toLocaleDateString('pt-BR')
}

function formatarCPF(cpf: string): string {
  return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
}

function formatarTelefone(tel: string): string {
  const limpo = tel.replace(/\D/g, '')
  if (limpo.length === 11) {
    return `(${limpo.slice(0, 2)}) ${limpo.slice(2, 7)}-${limpo.slice(7)}`
  }
  return tel
}

function traduzirStatus(status: string): string {
  const map: Record<string, string> = {
    pendente: 'Pendente',
    agendado: 'Agendado',
    castrado: 'Castrado',
    realizado: 'Realizado',
    cancelado: 'Cancelado',
  }
  return map[status] || status
}

function adicionarCabecalho(doc: jsPDF, titulo: string) {
  // Logo/Título
  doc.setFontSize(22)
  doc.setTextColor(...CORES.laranja)
  doc.text('Castra', 14, 20)
  doc.setTextColor(...CORES.azulMarinho)
  doc.text('+MG', 45, 20)

  // Título do relatório
  doc.setFontSize(16)
  doc.setTextColor(60, 60, 60)
  doc.text(titulo, 14, 32)

  // Data de geração
  doc.setFontSize(10)
  doc.setTextColor(120, 120, 120)
  const dataGeracao = new Date().toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
  doc.text(`Gerado em: ${dataGeracao}`, 14, 40)

  // Linha separadora
  doc.setDrawColor(...CORES.laranja)
  doc.setLineWidth(0.5)
  doc.line(14, 44, 196, 44)
}

function adicionarRodape(doc: jsPDF) {
  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(9)
    doc.setTextColor(150, 150, 150)
    doc.text(
      `Página ${i} de ${pageCount} - Castra+MG - Sistema de Gestão de Castrações`,
      105,
      290,
      { align: 'center' }
    )
  }
}

// Gerar PDF de lista de animais
export function gerarPDFAnimais(animais: Animal[], filtros?: string): void {
  const doc = new jsPDF()

  adicionarCabecalho(doc, 'Relatório de Animais Cadastrados')

  if (filtros) {
    doc.setFontSize(10)
    doc.setTextColor(80, 80, 80)
    doc.text(`Filtros aplicados: ${filtros}`, 14, 52)
  }

  const startY = filtros ? 58 : 52

  // Tabela de animais
  const headers = [['Nome', 'Espécie', 'Raça', 'Sexo', 'RG Animal', 'Status', 'Tutor']]
  const data = animais.map((a) => [
    a.nome,
    a.especie === 'cachorro' ? 'Cão' : 'Gato',
    a.raca,
    a.sexo === 'macho' ? 'M' : 'F',
    a.registroSinpatinhas,
    traduzirStatus(a.status),
    a.tutor?.nome || '-',
  ])

  doc.autoTable({
    head: headers,
    body: data,
    startY,
    theme: 'striped',
    headStyles: {
      fillColor: CORES.azulMarinho,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 10,
    },
    bodyStyles: {
      fontSize: 9,
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245],
    },
    margin: { left: 14, right: 14 },
    columnStyles: {
      0: { cellWidth: 30 },
      1: { cellWidth: 22 },
      2: { cellWidth: 30 },
      3: { cellWidth: 15 },
      4: { cellWidth: 30 },
      5: { cellWidth: 25 },
      6: { cellWidth: 'auto' },
    },
  })

  // Resumo
  const finalY = doc.lastAutoTable.finalY + 10
  doc.setFontSize(11)
  doc.setTextColor(...CORES.azulMarinho)
  doc.text(`Total de registros: ${animais.length}`, 14, finalY)

  const porStatus = animais.reduce((acc, a) => {
    acc[a.status] = (acc[a.status] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  let statusY = finalY + 6
  Object.entries(porStatus).forEach(([status, count]) => {
    doc.setFontSize(10)
    doc.setTextColor(80, 80, 80)
    doc.text(`• ${traduzirStatus(status)}: ${count}`, 20, statusY)
    statusY += 5
  })

  adicionarRodape(doc)

  doc.save(`animais-castramais-${new Date().toISOString().split('T')[0]}.pdf`)
}

// Gerar PDF de lista de tutores
export function gerarPDFTutores(tutores: Tutor[]): void {
  const doc = new jsPDF()

  adicionarCabecalho(doc, 'Relatório de Tutores Cadastrados')

  const headers = [['Nome', 'CPF', 'Telefone', 'Cidade', 'Bairro', 'Cadastro']]
  const data = tutores.map((t) => [
    t.nome,
    formatarCPF(t.cpf),
    formatarTelefone(t.telefone),
    t.cidade,
    t.bairro,
    formatarData(t.createdAt),
  ])

  doc.autoTable({
    head: headers,
    body: data,
    startY: 52,
    theme: 'striped',
    headStyles: {
      fillColor: CORES.azulMarinho,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 10,
    },
    bodyStyles: {
      fontSize: 9,
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245],
    },
    margin: { left: 14, right: 14 },
  })

  const finalY = doc.lastAutoTable.finalY + 10
  doc.setFontSize(11)
  doc.setTextColor(...CORES.azulMarinho)
  doc.text(`Total de tutores: ${tutores.length}`, 14, finalY)

  adicionarRodape(doc)

  doc.save(`tutores-castramais-${new Date().toISOString().split('T')[0]}.pdf`)
}

// Gerar PDF de lista de entidades
export function gerarPDFEntidades(entidades: Entidade[]): void {
  const doc = new jsPDF()

  adicionarCabecalho(doc, 'Relatório de Entidades Cadastradas')

  const headers = [['Nome', 'Responsável', 'Telefone', 'Email', 'Cidade', 'Status']]
  const data = entidades.map((e) => [
    e.nome,
    e.responsavel,
    formatarTelefone(e.telefone),
    e.email,
    e.cidade,
    e.ativo ? 'Ativa' : 'Inativa',
  ])

  doc.autoTable({
    head: headers,
    body: data,
    startY: 52,
    theme: 'striped',
    headStyles: {
      fillColor: CORES.azulMarinho,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 10,
    },
    bodyStyles: {
      fontSize: 9,
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245],
    },
    margin: { left: 14, right: 14 },
  })

  const finalY = doc.lastAutoTable.finalY + 10
  doc.setFontSize(11)
  doc.setTextColor(...CORES.azulMarinho)
  doc.text(`Total de entidades: ${entidades.length}`, 14, finalY)

  const ativas = entidades.filter((e) => e.ativo).length
  doc.setFontSize(10)
  doc.setTextColor(80, 80, 80)
  doc.text(`• Ativas: ${ativas}`, 20, finalY + 6)
  doc.text(`• Inativas: ${entidades.length - ativas}`, 20, finalY + 11)

  adicionarRodape(doc)

  doc.save(`entidades-castramais-${new Date().toISOString().split('T')[0]}.pdf`)
}

// Gerar ficha individual do animal
export function gerarFichaAnimal(animal: Animal): void {
  const doc = new jsPDF()

  adicionarCabecalho(doc, 'Ficha do Animal')

  let y = 55

  // Dados do animal
  doc.setFontSize(14)
  doc.setTextColor(...CORES.azulMarinho)
  doc.text('Dados do Animal', 14, y)
  y += 8

  doc.setFontSize(11)
  doc.setTextColor(60, 60, 60)

  const dadosAnimal = [
    ['Nome:', animal.nome],
    ['RG Animal (SinPatinhas):', animal.registroSinpatinhas],
    ['Espécie:', animal.especie === 'cachorro' ? 'Canino' : 'Felino'],
    ['Raça:', animal.raca],
    ['Sexo:', animal.sexo === 'macho' ? 'Macho' : 'Fêmea'],
    ['Peso:', animal.peso ? `${animal.peso} kg` : 'Não informado'],
    ['Idade:', formatarIdade(animal.idadeAnos, animal.idadeMeses)],
    ['Status:', traduzirStatus(animal.status)],
  ]

  dadosAnimal.forEach(([label, value]) => {
    doc.setFont('helvetica', 'bold')
    doc.text(label, 14, y)
    doc.setFont('helvetica', 'normal')
    doc.text(value, 70, y)
    y += 6
  })

  // Dados do tutor
  if (animal.tutor) {
    y += 10
    doc.setFontSize(14)
    doc.setTextColor(...CORES.azulMarinho)
    doc.text('Dados do Tutor', 14, y)
    y += 8

    doc.setFontSize(11)
    doc.setTextColor(60, 60, 60)

    const dadosTutor = [
      ['Nome:', animal.tutor.nome],
      ['CPF:', formatarCPF(animal.tutor.cpf)],
      ['Telefone:', formatarTelefone(animal.tutor.telefone)],
      ['Cidade:', animal.tutor.cidade],
      ['Bairro:', animal.tutor.bairro],
    ]

    dadosTutor.forEach(([label, value]) => {
      doc.setFont('helvetica', 'bold')
      doc.text(label, 14, y)
      doc.setFont('helvetica', 'normal')
      doc.text(value, 70, y)
      y += 6
    })
  }

  // Dados do agendamento
  if (animal.status === 'agendado' && animal.dataAgendamento) {
    y += 10
    doc.setFontSize(14)
    doc.setTextColor(...CORES.laranja)
    doc.text('Agendamento', 14, y)
    y += 8

    doc.setFontSize(11)
    doc.setTextColor(60, 60, 60)
    doc.setFont('helvetica', 'bold')
    doc.text('Data:', 14, y)
    doc.setFont('helvetica', 'normal')
    doc.text(formatarData(animal.dataAgendamento), 70, y)
  }

  // Realização
  if ((animal.status === 'castrado' || animal.status === 'realizado') && animal.dataRealizacao) {
    y += 10
    doc.setFontSize(14)
    doc.setTextColor(34, 197, 94) // green
    doc.text('Castração Realizada', 14, y)
    y += 8

    doc.setFontSize(11)
    doc.setTextColor(60, 60, 60)
    doc.setFont('helvetica', 'bold')
    doc.text('Data:', 14, y)
    doc.setFont('helvetica', 'normal')
    doc.text(formatarData(animal.dataRealizacao), 70, y)
  }

  adicionarRodape(doc)

  doc.save(`ficha-${animal.nome.toLowerCase().replace(/\s+/g, '-')}-${animal.registroSinpatinhas}.pdf`)
}

function formatarIdade(anos?: number, meses?: number): string {
  const partes = []
  if (anos && anos > 0) {
    partes.push(`${anos} ano${anos > 1 ? 's' : ''}`)
  }
  if (meses && meses > 0) {
    partes.push(`${meses} ${meses > 1 ? 'meses' : 'mês'}`)
  }
  return partes.length > 0 ? partes.join(' e ') : 'Não informada'
}
