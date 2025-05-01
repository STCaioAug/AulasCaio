import { pgTable, text, serial, integer, boolean, timestamp, pgEnum, decimal } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";
import { z } from "zod";

// Usuários
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  nome: text("nome").notNull(),
  email: text("email").notNull().unique(),
  telefone: text("telefone"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users, {
  nome: (schema) => schema.min(3, "Nome deve ter pelo menos 3 caracteres"),
  username: (schema) => schema.min(3, "Usuário deve ter pelo menos 3 caracteres"),
  password: (schema) => schema.min(6, "Senha deve ter pelo menos 6 caracteres"),
  email: (schema) => schema.email("Email inválido")
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Enum para séries escolares
export const anoEscolarEnum = pgEnum("ano_escolar", [
  "6_ano", "7_ano", "8_ano", "9_ano", "1_em", "2_em", "3_em", "superior"
]);

// Enum para status de aulas
export const statusAulaEnum = pgEnum("status_aula", [
  "agendada", "confirmada", "cancelada", "realizada"
]);

// Enum para dificuldade
export const nivelDificuldadeEnum = pgEnum("nivel_dificuldade", [
  "facil", "medio", "dificil"
]);

// Alunos
export const alunos = pgTable("alunos", {
  id: serial("id").primaryKey(),
  nome: text("nome").notNull(),
  anoEscolar: anoEscolarEnum("ano_escolar").notNull(),
  telefone: text("telefone"),
  email: text("email"),
  observacoes: text("observacoes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const alunosRelations = relations(alunos, ({ many }) => ({
  responsaveis: many(alunosResponsaveis),
  aulas: many(aulas),
  temas: many(temas),
}));

export const insertAlunoSchema = createInsertSchema(alunos, {
  nome: (schema) => schema.min(3, "Nome deve ter pelo menos 3 caracteres"),
  anoEscolar: (schema) => schema
});

export type InsertAluno = z.infer<typeof insertAlunoSchema>;
export type Aluno = typeof alunos.$inferSelect;

// Responsáveis
export const responsaveis = pgTable("responsaveis", {
  id: serial("id").primaryKey(),
  nome: text("nome").notNull(),
  telefone: text("telefone").notNull(),
  whatsapp: text("whatsapp").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const responsaveisRelations = relations(responsaveis, ({ many }) => ({
  alunos: many(alunosResponsaveis),
}));

export const insertResponsavelSchema = createInsertSchema(responsaveis, {
  nome: (schema) => schema.min(3, "Nome deve ter pelo menos 3 caracteres"),
  telefone: (schema) => schema.min(10, "Telefone inválido"),
  whatsapp: (schema) => schema.min(10, "Whatsapp inválido")
});

export type InsertResponsavel = z.infer<typeof insertResponsavelSchema>;
export type Responsavel = typeof responsaveis.$inferSelect;

// Relação Alunos-Responsáveis
export const alunosResponsaveis = pgTable("alunos_responsaveis", {
  id: serial("id").primaryKey(),
  alunoId: integer("aluno_id").notNull().references(() => alunos.id),
  responsavelId: integer("responsavel_id").notNull().references(() => responsaveis.id),
});

export const alunosResponsaveisRelations = relations(alunosResponsaveis, ({ one }) => ({
  aluno: one(alunos, { fields: [alunosResponsaveis.alunoId], references: [alunos.id] }),
  responsavel: one(responsaveis, { fields: [alunosResponsaveis.responsavelId], references: [responsaveis.id] }),
}));

// Matérias
export const materias = pgTable("materias", {
  id: serial("id").primaryKey(),
  nome: text("nome").notNull().unique(),
  cor: text("cor").notNull(),
});

export const materiasRelations = relations(materias, ({ many }) => ({
  temas: many(temas),
  aulas: many(aulas),
}));

export const insertMateriaSchema = createInsertSchema(materias, {
  nome: (schema) => schema.min(3, "Nome deve ter pelo menos 3 caracteres"),
});

export type InsertMateria = z.infer<typeof insertMateriaSchema>;
export type Materia = typeof materias.$inferSelect;

// Temas
export const temas = pgTable("temas", {
  id: serial("id").primaryKey(),
  nome: text("nome").notNull(),
  materiaId: integer("materia_id").notNull().references(() => materias.id),
  anoEscolar: anoEscolarEnum("ano_escolar").notNull(),
  dificuldade: nivelDificuldadeEnum("dificuldade").default("medio"),
  alunoId: integer("aluno_id").references(() => alunos.id),
  estudado: boolean("estudado").default(false),
});

export const temasRelations = relations(temas, ({ one }) => ({
  materia: one(materias, { fields: [temas.materiaId], references: [materias.id] }),
  aluno: one(alunos, { fields: [temas.alunoId], references: [alunos.id] }),
}));

export const insertTemaSchema = createInsertSchema(temas, {
  nome: (schema) => schema.min(3, "Nome deve ter pelo menos 3 caracteres"),
});

export type InsertTema = z.infer<typeof insertTemaSchema>;
export type Tema = typeof temas.$inferSelect;

// Aulas
export const aulas = pgTable("aulas", {
  id: serial("id").primaryKey(),
  data: timestamp("data").notNull(),
  duracao: integer("duracao").notNull(), // em minutos
  alunoId: integer("aluno_id").notNull().references(() => alunos.id),
  materiaId: integer("materia_id").notNull().references(() => materias.id),
  status: statusAulaEnum("status").default("agendada"),
  valor: decimal("valor", { precision: 10, scale: 2 }).notNull(),
  observacoes: text("observacoes"),
  conteudo: text("conteudo"),
});

export const aulasRelations = relations(aulas, ({ one }) => ({
  aluno: one(alunos, { fields: [aulas.alunoId], references: [alunos.id] }),
  materia: one(materias, { fields: [aulas.materiaId], references: [materias.id] }),
}));

export const insertAulaSchema = createInsertSchema(aulas, {
  data: (schema) => schema,
  duracao: (schema) => schema.min(15, "Duração mínima de 15 minutos"),
  valor: (schema) => schema.min(0, "Valor não pode ser negativo"),
});

export type InsertAula = z.infer<typeof insertAulaSchema>;
export type Aula = typeof aulas.$inferSelect;

// Horários Disponíveis
export const horariosDisponiveis = pgTable("horarios_disponiveis", {
  id: serial("id").primaryKey(),
  diaSemana: integer("dia_semana").notNull(), // 0 = Domingo, 1 = Segunda, ...
  horaInicio: text("hora_inicio").notNull(), // formato HH:MM
  horaFim: text("hora_fim").notNull(), // formato HH:MM
});

export const insertHorarioDisponivelSchema = createInsertSchema(horariosDisponiveis);

export type InsertHorarioDisponivel = z.infer<typeof insertHorarioDisponivelSchema>;
export type HorarioDisponivel = typeof horariosDisponiveis.$inferSelect;
