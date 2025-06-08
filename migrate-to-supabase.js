import { Client } from 'pg';

async function migrateToSupabase() {
  const client = new Client({ connectionString: process.env.SUPABASE_DATABASE_URL });
  
  try {
    await client.connect();
    console.log('Conectado ao Supabase');

    // Create ENUM types
    await client.query(`
      DO $$ BEGIN
        CREATE TYPE "public"."ano_escolar" AS ENUM('1_ef', '2_ef', '3_ef', '4_ef', '5_ef', '6_ano', '7_ano', '8_ano', '9_ano', '1_em', '2_em', '3_em', 'superior');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await client.query(`
      DO $$ BEGIN
        CREATE TYPE "public"."escola" AS ENUM('EEP', 'CLQ', 'Liceu', 'Objetivo', 'Mackenzie', 'Bandeirantes', 'Anglo', 'Poliedro', 'Outra');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await client.query(`
      DO $$ BEGIN
        CREATE TYPE "public"."nivel_dificuldade" AS ENUM('facil', 'medio', 'dificil');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await client.query(`
      DO $$ BEGIN
        CREATE TYPE "public"."status_aula" AS ENUM('agendada', 'confirmada', 'cancelada', 'realizada');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Create tables
    await client.query(`
      CREATE TABLE IF NOT EXISTS "materias" (
        "id" serial PRIMARY KEY NOT NULL,
        "nome" text NOT NULL,
        "cor" text NOT NULL,
        CONSTRAINT "materias_nome_unique" UNIQUE("nome")
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS "alunos" (
        "id" serial PRIMARY KEY NOT NULL,
        "nome" text NOT NULL,
        "ano_escolar" "ano_escolar" NOT NULL,
        "escola" "escola" DEFAULT 'Outra',
        "telefone" text,
        "email" text,
        "observacoes" text,
        "created_at" timestamp DEFAULT now() NOT NULL
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS "responsaveis" (
        "id" serial PRIMARY KEY NOT NULL,
        "nome" text NOT NULL,
        "telefone" text NOT NULL,
        "whatsapp" text NOT NULL,
        "created_at" timestamp DEFAULT now() NOT NULL
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS "alunos_responsaveis" (
        "id" serial PRIMARY KEY NOT NULL,
        "aluno_id" integer NOT NULL,
        "responsavel_id" integer NOT NULL
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS "users" (
        "id" serial PRIMARY KEY NOT NULL,
        "username" text NOT NULL,
        "password" text NOT NULL,
        "nome" text NOT NULL,
        "email" text NOT NULL,
        "telefone" text,
        "aluno_id" integer,
        "is_admin" boolean DEFAULT false NOT NULL,
        "created_at" timestamp DEFAULT now() NOT NULL,
        CONSTRAINT "users_username_unique" UNIQUE("username"),
        CONSTRAINT "users_email_unique" UNIQUE("email")
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS "aulas" (
        "id" serial PRIMARY KEY NOT NULL,
        "data" timestamp NOT NULL,
        "duracao" integer NOT NULL,
        "aluno_id" integer NOT NULL,
        "materia_id" integer NOT NULL,
        "status" "status_aula" DEFAULT 'agendada',
        "valor" numeric(10, 2) NOT NULL,
        "observacoes" text,
        "conteudo" text
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS "temas" (
        "id" serial PRIMARY KEY NOT NULL,
        "nome" text NOT NULL,
        "materia_id" integer NOT NULL,
        "ano_escolar" "ano_escolar" NOT NULL,
        "dificuldade" "nivel_dificuldade" DEFAULT 'medio',
        "aluno_id" integer,
        "estudado" boolean DEFAULT false
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS "horarios_disponiveis" (
        "id" serial PRIMARY KEY NOT NULL,
        "dia_semana" integer NOT NULL,
        "hora_inicio" text NOT NULL,
        "hora_fim" text NOT NULL
      );
    `);

    // Add foreign keys
    await client.query(`
      DO $$ BEGIN
        ALTER TABLE "alunos_responsaveis" ADD CONSTRAINT "alunos_responsaveis_aluno_id_alunos_id_fk" FOREIGN KEY ("aluno_id") REFERENCES "public"."alunos"("id") ON DELETE no action ON UPDATE no action;
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await client.query(`
      DO $$ BEGIN
        ALTER TABLE "alunos_responsaveis" ADD CONSTRAINT "alunos_responsaveis_responsavel_id_responsaveis_id_fk" FOREIGN KEY ("responsavel_id") REFERENCES "public"."responsaveis"("id") ON DELETE no action ON UPDATE no action;
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await client.query(`
      DO $$ BEGIN
        ALTER TABLE "aulas" ADD CONSTRAINT "aulas_aluno_id_alunos_id_fk" FOREIGN KEY ("aluno_id") REFERENCES "public"."alunos"("id") ON DELETE no action ON UPDATE no action;
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await client.query(`
      DO $$ BEGIN
        ALTER TABLE "aulas" ADD CONSTRAINT "aulas_materia_id_materias_id_fk" FOREIGN KEY ("materia_id") REFERENCES "public"."materias"("id") ON DELETE no action ON UPDATE no action;
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await client.query(`
      DO $$ BEGIN
        ALTER TABLE "temas" ADD CONSTRAINT "temas_materia_id_materias_id_fk" FOREIGN KEY ("materia_id") REFERENCES "public"."materias"("id") ON DELETE no action ON UPDATE no action;
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await client.query(`
      DO $$ BEGIN
        ALTER TABLE "temas" ADD CONSTRAINT "temas_aluno_id_alunos_id_fk" FOREIGN KEY ("aluno_id") REFERENCES "public"."alunos"("id") ON DELETE no action ON UPDATE no action;
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await client.query(`
      DO $$ BEGIN
        ALTER TABLE "users" ADD CONSTRAINT "users_aluno_id_alunos_id_fk" FOREIGN KEY ("aluno_id") REFERENCES "public"."alunos"("id") ON DELETE no action ON UPDATE no action;
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    console.log('✓ Schema migrado com sucesso para Supabase');

  } catch (error) {
    console.error('Erro na migração:', error);
  } finally {
    await client.end();
  }
}

migrateToSupabase();