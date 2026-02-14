import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/pool';
import { gerarToken } from '@/lib/tutor-auth';
import { verifyFirebaseToken } from '@/lib/firebase-admin';
import { cleanCPF, validateCPF } from '@/lib/utils';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { cpf, firebaseToken } = body;

    // Validar parâmetros
    if (!cpf || !firebaseToken) {
      return NextResponse.json(
        { error: 'CPF e token Firebase são obrigatórios' },
        { status: 400 }
      );
    }

    const cpfLimpo = cleanCPF(cpf);

    if (!validateCPF(cpfLimpo)) {
      return NextResponse.json({ error: 'CPF inválido' }, { status: 400 });
    }

    // Verificar token Firebase
    try {
      const decodedToken = await verifyFirebaseToken(firebaseToken);
      
      // O token Firebase contém o número de telefone verificado
      const phoneNumber = decodedToken.phone_number;
      
      if (!phoneNumber) {
        return NextResponse.json(
          { error: 'Token Firebase não contém número de telefone' },
          { status: 400 }
        );
      }

      console.log(`[LOGIN FIREBASE] CPF: ${cpfLimpo} | Telefone verificado: ${phoneNumber}`);
    } catch (error) {
      console.error('Erro ao verificar token Firebase:', error);
      return NextResponse.json(
        { error: 'Token Firebase inválido ou expirado' },
        { status: 401 }
      );
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
