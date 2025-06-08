import { Client } from 'pg';
import { scrypt, randomBytes } from 'crypto';
import { promisify } from 'util';

const scryptAsync = promisify(scrypt);

async function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const buf = await scryptAsync(password, salt, 64);
  return `${buf.toString("hex")}.${salt}`;
}

async function seedSupabase() {
  const client = new Client({ connectionString: process.env.SUPABASE_DATABASE_URL });
  
  try {
    await client.connect();
    console.log('Conectado ao Supabase para seed');

    // Verificar se já existe dados
    const existingUsers = await client.query('SELECT * FROM users');
    if (existingUsers.rows.length > 0) {
      console.log('Dados já existem no Supabase, limpando...');
      await client.query('TRUNCATE users, alunos_responsaveis, aulas, temas, alunos, responsaveis, materias, horarios_disponiveis RESTART IDENTITY CASCADE');
    }

    // Criar usuário administrador
    const hashedPassword = await hashPassword("Deus2025");
    await client.query(`
      INSERT INTO users (username, password, nome, email, telefone, is_admin)
      VALUES ($1, $2, $3, $4, $5, $6)
    `, ["STCaio", hashedPassword, "Caio A", "professor@eleve.com", "(19) 99999-9999", true]);
    console.log('✓ Usuário administrador criado');

    // Criar matérias
    await client.query(`
      INSERT INTO materias (nome, cor) VALUES
      ('Matemática', '#4f46e5'),
      ('Português', '#ec4899'),
      ('Física', '#8b5cf6'),
      ('Química', '#10b981'),
      ('Biologia', '#f59e0b'),
      ('História', '#ef4444'),
      ('Geografia', '#06b6d4'),
      ('Inglês', '#6366f1')
    `);
    console.log('✓ Matérias criadas');

    // Criar alunos baseados nos dados reais
    await client.query(`
      INSERT INTO alunos (nome, ano_escolar, email) VALUES
      ('Daniella Risola', '8_ano', 'daniella@example.com'),
      ('Giovanela', '9_ano', 'giovanela@example.com'),
      ('Karin', '1_em', 'karin@example.com'),
      ('Leandro', '2_em', 'leandro@example.com'),
      ('Gisele', '7_ano', 'gisele@example.com'),
      ('Silvia Celêncio', '3_em', 'silvia@example.com'),
      ('Maysa Inada O Ducatti', '6_ano', 'maysa@example.com'),
      ('Marcela Archilia', '8_ano', 'marcela@example.com'),
      ('Elisane', '9_ano', 'elisane@example.com'),
      ('Mariana Ferraz', '1_em', 'mariana@example.com')
    `);
    console.log('✓ Alunos criados');

    // Criar responsáveis com dados reais
    await client.query(`
      INSERT INTO responsaveis (nome, telefone, whatsapp) VALUES
      ('Daniella Risola', '+55 19 98224-4747', 'https://wa.me/5519982244747'),
      ('Giovanela', '+55 19 98186-7873', 'https://wa.me/5519981867873'),
      ('Karin', '+55 11 97626-9474', 'https://wa.me/5511976269474'),
      ('Leandro', '+55 11 97679-6336', 'https://wa.me/5511976796336'),
      ('Gisele', '+55 19 99928-4241', 'https://wa.me/5519999284241'),
      ('Silvia Celêncio', '+55 19 99602-8813', 'https://wa.me/5519996028813'),
      ('Maysa Inada O Ducatti', '+55 19 99891-6701', 'https://wa.me/5519998916701'),
      ('Marcela Archilia', '+55 19 98911-3534', 'https://wa.me/5519989113534'),
      ('Elisane', '+55 19 98181-6080', 'https://wa.me/5519981816080'),
      ('Mariana Ferraz', '+55 19 99130-8899', 'https://wa.me/5519991308899')
    `);
    console.log('✓ Responsáveis criados');

    // Associar alunos e responsáveis (1:1 conforme dados fornecidos)
    await client.query(`
      INSERT INTO alunos_responsaveis (aluno_id, responsavel_id)
      SELECT a.id, r.id 
      FROM alunos a, responsaveis r 
      WHERE a.nome = r.nome
    `);
    console.log('✓ Relações aluno-responsável criadas');

    // Criar horários disponíveis
    await client.query(`
      INSERT INTO horarios_disponiveis (dia_semana, hora_inicio, hora_fim) VALUES
      (1, '10:00', '12:00'),
      (2, '14:00', '16:00'),
      (3, '09:00', '11:00'),
      (4, '16:00', '18:00'),
      (5, '13:00', '15:00')
    `);
    console.log('✓ Horários disponíveis criados');

    // Criar algumas aulas de exemplo
    const materias = await client.query('SELECT * FROM materias');
    const alunos = await client.query('SELECT * FROM alunos');
    
    if (alunos.rows.length >= 5 && materias.rows.length > 0) {
      const hoje = new Date();
      const amanha = new Date();
      amanha.setDate(hoje.getDate() + 1);
      const ontem = new Date();
      ontem.setDate(hoje.getDate() - 1);

      await client.query(`
        INSERT INTO aulas (data, duracao, aluno_id, materia_id, status, valor, conteudo) VALUES
        ($1, 120, $2, $3, 'confirmada', 120.00, NULL),
        ($4, 90, $5, $6, 'agendada', 90.00, NULL),
        ($7, 120, $8, $9, 'realizada', 120.00, 'Equações do primeiro grau')
      `, [
        hoje, alunos.rows[0].id, materias.rows[0].id,
        amanha, alunos.rows[1].id, materias.rows[1].id,
        ontem, alunos.rows[2].id, materias.rows[0].id
      ]);
      console.log('✓ Aulas de exemplo criadas');
    }

    // Criar temas gerais
    if (materias.rows.length > 0) {
      await client.query(`
        INSERT INTO temas (nome, materia_id, ano_escolar, dificuldade, estudado) VALUES
        ('Equações do 1º grau', $1, '8_ano', 'medio', false),
        ('Sistemas de equações', $1, '8_ano', 'dificil', false),
        ('Cinemática', $2, '1_em', 'medio', false),
        ('Leis de Newton', $2, '1_em', 'medio', false),
        ('Interpretação de textos', $3, '6_ano', 'facil', false)
      `, [materias.rows[0].id, materias.rows[2].id, materias.rows[1].id]);
      console.log('✓ Temas criados');
    }

    console.log('🎉 Seed completo! Todos os dados foram importados para o Supabase');

  } catch (error) {
    console.error('Erro no seed:', error);
  } finally {
    await client.end();
  }
}

seedSupabase();