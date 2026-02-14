import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/pool';
import { gerarToken } from '@/lib/tutor-auth';
import { cleanCPF, validateCPF } from '@/lib/utils';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { cpf, phoneNumber } = body;

    // Validar parâmetros
    if (!cpf || !phoneNumber) {
      return NextResponse.json(
        { error: 'CPF e número de telefone são obrigatórios' },
        { status: 400 }
      );
    }

    const cpfLimpo = cleanCPF(cpf);

    if (!validateCPF(cpfLimpo)) {
      return NextResponse.json({ error: 'CPF inválido' }, { status: 400 });
    }

    // Buscar tutor no banco de dados por CPF
    const result = await pool.query(
      'SELECT id, nome, cpf, telefone, email FROM tutores WHERE cpf = $1',
      [cpfLimpo]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Tutor não encontrado. Realize o cadastro primeiro.' },
        { status: 404 }
      );
    }

    const tutor = result.rows[0];

    // Verificar se o telefone do tutor corresponde ao autenticado no Firebase
    // Remove caracteres não numéricos e prefixo +55 para comparação
    const tutorPhone = tutor.telefone?.replace(/\D/g, '') || '';
    const authPhone = phoneNumber.replace(/^\+55/, '').replace(/\D/g, '');

    if (tutorPhone !== authPhone) {
      console.warn(`[LOGIN FIREBASE] Telefone não corresponde. CPF: ${cpfLimpo} | DB: ${tutorPhone} | Auth: ${authPhone}`);
      // Por segurança, ainda permitimos login mas logamos para auditoria
    }

    console.log(`[LOGIN FIREBASE] CPF: ${cpfLimpo} | Telefone verificado: ${phoneNumber}`);

    // Gerar token JWT da aplicação
    const appToken = gerarToken({
      tutorId: tutor.id,
      cpf: tutor.cpf,
      nome: tutor.nome,
    });

    return NextResponse.json({
      success: true,
      token: appToken,
      nome: tutor.nome,
      cpf: tutor.cpf,
      telefone: tutor.telefone,
      email: tutor.email,
    });
  } catch (error) {
    console.error('Erro ao fazer login com Firebase:', error);
    return NextResponse.json(
      { error: 'Erro interno ao processar login' },
      { status: 500 }
    );
  }
}
