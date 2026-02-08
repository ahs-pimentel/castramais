import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/pool'
import { extrairToken, verificarToken } from '@/lib/tutor-auth'
import { notificarCadastroPet, notificarListaEspera } from '@/lib/notifications'
import { validarSinpatinhas, getMensagemErroSinpatinhas } from '@/lib/sanitize'
import { verificarDisponibilidadeVaga } from '@/lib/services/vagas'
import { v4 as uuidv4 } from 'uuid'
import { buscarAnimalPorRG, buscarTutorNotificacao } from '@/lib/repositories/animal-repository'
import { verificarLimitesAnimais } from '@/lib/repositories/tutor-repository'

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const token = extrairToken(authHeader)

    if (!token) {
      return NextResponse.json({ error: 'Token não fornecido' }, { status: 401 })
    }

    const payload = verificarToken(token)
    if (!payload) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
    }

    const body = await request.json()
    const {
      nome,
      especie,
      raca,
      sexo,
      peso,
      idadeAnos,
      idadeMeses,
      registroSinpatinhas,
      observacoes,
      campanhaId,
    } = body

    // Validações
    if (!nome?.trim()) {
      return NextResponse.json({ error: 'Nome do pet é obrigatório' }, { status: 400 })
    }
    if (!registroSinpatinhas?.trim()) {
      return NextResponse.json({ error: 'RG Animal (SinPatinhas) é obrigatório' }, { status: 400 })
    }

    // Validação do formato do código SinPatinhas
    if (!validarSinpatinhas(registroSinpatinhas)) {
      const mensagemErro = getMensagemErroSinpatinhas(registroSinpatinhas)
      return NextResponse.json({ error: mensagemErro || 'Código SinPatinhas inválido' }, { status: 400 })
    }
    if (!especie || !['cachorro', 'gato'].includes(especie)) {
      return NextResponse.json({ error: 'Espécie inválida' }, { status: 400 })
    }
    if (!sexo || !['macho', 'femea'].includes(sexo)) {
      return NextResponse.json({ error: 'Sexo inválido' }, { status: 400 })
    }
    if (!raca?.trim()) {
      return NextResponse.json({ error: 'Raça é obrigatória' }, { status: 400 })
    }

    // Verificar se RG já existe
    const existeAnimal = await buscarAnimalPorRG(registroSinpatinhas)
    if (existeAnimal) {
      return NextResponse.json(
        { error: 'Este RG Animal já está cadastrado no sistema' },
        { status: 409 }
      )
    }

    // Verificar limite de animais por tutor
    const limites = await verificarLimitesAnimais(payload.tutorId, campanhaId)
    if (!limites.ok) {
      return NextResponse.json({ error: limites.erro }, { status: 400 })
    }

    // Buscar dados do tutor para notificação e verificação de vagas
    const tutor = await buscarTutorNotificacao(payload.tutorId)

    // Verificar disponibilidade de vagas na campanha selecionada
    let statusFinal = 'pendente'
    let vagasInfo = null as Awaited<ReturnType<typeof verificarDisponibilidadeVaga>>['vagasInfo']

    if (campanhaId) {
      const resultado = await verificarDisponibilidadeVaga(campanhaId)
      vagasInfo = resultado.vagasInfo
      if (vagasInfo && !resultado.disponivel) {
        statusFinal = 'lista_espera'
      }
    }

    // Criar animal vinculado ao tutor logado
    const animalId = uuidv4()
    const result = await pool.query(
      `INSERT INTO animais (
        id, nome, especie, raca, sexo, peso, "idadeAnos", "idadeMeses",
        "registroSinpatinhas", observacoes, "tutorId", "campanhaId", status, "createdAt", "updatedAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW(), NOW())
      RETURNING *`,
      [
        animalId,
        nome.trim(),
        especie,
        raca.trim(),
        sexo,
        peso ? parseFloat(peso) : null,
        idadeAnos ? parseInt(idadeAnos) : null,
        idadeMeses ? parseInt(idadeMeses) : null,
        registroSinpatinhas.trim(),
        observacoes?.trim() || null,
        payload.tutorId,
        campanhaId || null,
        statusFinal,
      ]
    )

    // Enviar notificação apropriada via WhatsApp (async, não bloqueia resposta)
    if (tutor?.telefone) {
      const especieNotif = especie === 'cachorro' ? 'canino' : 'felino'

      if (statusFinal === 'lista_espera') {
        // Notificação de lista de espera
        const posicaoFila = (vagasInfo?.listaEspera || 0) + 1
        notificarListaEspera(
          tutor.telefone,
          tutor.email || null,
          tutor.nome,
          nome.trim(),
          especieNotif,
          posicaoFila
        ).catch(err => console.error('Erro ao enviar notificação de lista de espera:', err))
      } else {
        // Notificação de cadastro normal
        notificarCadastroPet(
          tutor.telefone,
          tutor.email || null,
          tutor.nome,
          nome.trim(),
          especieNotif
        ).catch(err => console.error('Erro ao enviar notificação de cadastro:', err))
      }
    }

    // Retornar com informação adicional sobre lista de espera
    return NextResponse.json({
      ...result.rows[0],
      listaEspera: statusFinal === 'lista_espera',
      posicaoListaEspera: statusFinal === 'lista_espera' ? (vagasInfo?.listaEspera || 0) + 1 : null
    }, { status: 201 })
  } catch (error) {
    console.error('Erro ao cadastrar animal:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
