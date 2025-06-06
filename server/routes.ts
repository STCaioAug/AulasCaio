import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { eq, and, desc, between, isNull, sql } from "drizzle-orm";
import { 
  alunos, 
  responsaveis, 
  alunosResponsaveis, 
  materias, 
  aulas, 
  temas, 
  horariosDisponiveis, 
  insertAlunoSchema, 
  insertResponsavelSchema, 
  insertMateriaSchema, 
  insertTemaSchema, 
  insertAulaSchema, 
  insertHorarioDisponivelSchema,
  users,
  insertUserSchema
} from "@shared/schema";
import { db } from "@db";
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isValid } from "date-fns";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup auth routes
  setupAuth(app);

  // API prefix
  const apiPrefix = "/api";

  // Alunos routes
  app.get(`${apiPrefix}/alunos`, async (req, res) => {
    try {
      const result = await db.query.alunos.findMany({
        orderBy: desc(alunos.nome),
        with: {
          responsaveis: {
            with: {
              responsavel: true
            }
          }
        }
      });
      
      return res.json(result);
    } catch (error) {
      console.error("Erro ao buscar alunos:", error);
      return res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  app.get(`${apiPrefix}/alunos/:id`, async (req, res) => {
    try {
      const { id } = req.params;
      const aluno = await db.query.alunos.findFirst({
        where: eq(alunos.id, parseInt(id)),
        with: {
          responsaveis: {
            with: {
              responsavel: true
            }
          },
          aulas: {
            orderBy: desc(aulas.data),
            with: {
              materia: true
            }
          },
          temas: {
            with: {
              materia: true
            }
          }
        }
      });

      if (!aluno) {
        return res.status(404).json({ error: "Aluno não encontrado" });
      }

      return res.json(aluno);
    } catch (error) {
      console.error("Erro ao buscar aluno:", error);
      return res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  app.post(`${apiPrefix}/alunos`, async (req, res) => {
    try {
      const validatedData = insertAlunoSchema.parse(req.body);
      const [newAluno] = await db.insert(alunos).values(validatedData).returning();
      
      // Criar usuário para o aluno automaticamente
      if (newAluno && newAluno.email) {
        // Gerar nome de usuário baseado no nome do aluno (converter espaços para underscores e remover caracteres especiais)
        const username = newAluno.nome
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '') // Remove acentos
          .toLowerCase()
          .replace(/\s+/g, '_') // Substitui espaços por underscores
          .replace(/[^a-z0-9_]/g, '') // Remove caracteres especiais
          + Math.floor(Math.random() * 100); // Adiciona número aleatório para evitar duplicatas
          
        // Senha padrão (primeiras 3 letras do nome + ano escolar + "2025")
        let namePart = newAluno.nome.substring(0, 3).toLowerCase();
        const defaultPassword = namePart + newAluno.anoEscolar.replace('_', '') + "2025";
        
        try {
          // Hash da senha
          const hashedPassword = await storage.hashPassword(defaultPassword);
          
          // Criar usuário
          const userData = {
            username,
            password: hashedPassword,
            nome: newAluno.nome,
            email: newAluno.email,
            telefone: newAluno.telefone || '',
            alunoId: newAluno.id,
            isAdmin: false
          };
          
          const [newUser] = await db.insert(users).values(userData).returning();
          console.log(`Usuário criado automaticamente para aluno ${newAluno.nome}: ${username}`);
          
          // Incluir informação de usuário na resposta
          return res.status(201).json({
            ...newAluno,
            user: {
              username,
              defaultPassword: defaultPassword // Retornar senha padrão para ser informada ao usuário
            }
          });
        } catch (err) {
          console.error("Erro ao criar usuário para aluno:", err);
          // Continuar mesmo se falhar a criação do usuário
        }
      }
      
      return res.status(201).json(newAluno);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      console.error("Erro ao criar aluno:", error);
      return res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  app.put(`${apiPrefix}/alunos/:id`, async (req, res) => {
    try {
      const { id } = req.params;
      const validatedData = insertAlunoSchema.parse(req.body);
      const [updatedAluno] = await db.update(alunos)
        .set(validatedData)
        .where(eq(alunos.id, parseInt(id)))
        .returning();
        
      if (!updatedAluno) {
        return res.status(404).json({ error: "Aluno não encontrado" });
      }
      
      return res.json(updatedAluno);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      console.error("Erro ao atualizar aluno:", error);
      return res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  app.delete(`${apiPrefix}/alunos/:id`, async (req, res) => {
    try {
      const { id } = req.params;
      await db.delete(alunos).where(eq(alunos.id, parseInt(id)));
      return res.status(204).end();
    } catch (error) {
      console.error("Erro ao deletar aluno:", error);
      return res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  // Responsáveis routes
  app.get(`${apiPrefix}/responsaveis`, async (req, res) => {
    try {
      const result = await db.query.responsaveis.findMany({
        orderBy: desc(responsaveis.nome),
        with: {
          alunos: {
            with: {
              aluno: true
            }
          }
        }
      });
      
      return res.json(result);
    } catch (error) {
      console.error("Erro ao buscar responsáveis:", error);
      return res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  app.post(`${apiPrefix}/responsaveis`, async (req, res) => {
    try {
      const validatedData = insertResponsavelSchema.parse(req.body);
      const [newResponsavel] = await db.insert(responsaveis).values(validatedData).returning();
      
      // Associar alunos ao responsável, se houver
      if (req.body.alunosIds && Array.isArray(req.body.alunosIds)) {
        const relations = req.body.alunosIds.map(alunoId => ({
          responsavelId: newResponsavel.id,
          alunoId: parseInt(alunoId)
        }));
        
        if (relations.length > 0) {
          await db.insert(alunosResponsaveis).values(relations);
        }
      }
      
      return res.status(201).json(newResponsavel);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      console.error("Erro ao criar responsável:", error);
      return res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  app.put(`${apiPrefix}/responsaveis/:id`, async (req, res) => {
    try {
      const { id } = req.params;
      const validatedData = insertResponsavelSchema.parse(req.body);
      const [updatedResponsavel] = await db.update(responsaveis)
        .set(validatedData)
        .where(eq(responsaveis.id, parseInt(id)))
        .returning();
        
      if (!updatedResponsavel) {
        return res.status(404).json({ error: "Responsável não encontrado" });
      }
      
      // Atualizar relações com alunos
      if (req.body.alunosIds && Array.isArray(req.body.alunosIds)) {
        // Remover relações existentes
        await db.delete(alunosResponsaveis)
          .where(eq(alunosResponsaveis.responsavelId, updatedResponsavel.id));
        
        // Adicionar novas relações
        const relations = req.body.alunosIds.map(alunoId => ({
          responsavelId: updatedResponsavel.id,
          alunoId: parseInt(alunoId)
        }));
        
        if (relations.length > 0) {
          await db.insert(alunosResponsaveis).values(relations);
        }
      }
      
      return res.json(updatedResponsavel);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      console.error("Erro ao atualizar responsável:", error);
      return res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  app.delete(`${apiPrefix}/responsaveis/:id`, async (req, res) => {
    try {
      const { id } = req.params;
      await db.delete(responsaveis).where(eq(responsaveis.id, parseInt(id)));
      return res.status(204).end();
    } catch (error) {
      console.error("Erro ao deletar responsável:", error);
      return res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  // Matérias routes
  app.get(`${apiPrefix}/materias`, async (req, res) => {
    try {
      const result = await db.query.materias.findMany({
        orderBy: desc(materias.nome)
      });
      
      return res.json(result);
    } catch (error) {
      console.error("Erro ao buscar matérias:", error);
      return res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  app.post(`${apiPrefix}/materias`, async (req, res) => {
    try {
      const validatedData = insertMateriaSchema.parse(req.body);
      const [newMateria] = await db.insert(materias).values(validatedData).returning();
      return res.status(201).json(newMateria);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      console.error("Erro ao criar matéria:", error);
      return res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  // Temas routes
  app.get(`${apiPrefix}/temas`, async (req, res) => {
    try {
      const { anoEscolar, materiaId, alunoId } = req.query;
      
      let query = db.select().from(temas);
      
      if (anoEscolar) {
        query = query.where(eq(temas.anoEscolar, anoEscolar as any));
      }
      
      if (materiaId) {
        query = query.where(eq(temas.materiaId, parseInt(materiaId as string)));
      }
      
      if (alunoId) {
        if (alunoId === 'null') {
          query = query.where(isNull(temas.alunoId));
        } else {
          query = query.where(eq(temas.alunoId, parseInt(alunoId as string)));
        }
      }
      
      const result = await query;
      return res.json(result);
    } catch (error) {
      console.error("Erro ao buscar temas:", error);
      return res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  app.post(`${apiPrefix}/temas`, async (req, res) => {
    try {
      const validatedData = insertTemaSchema.parse(req.body);
      const [newTema] = await db.insert(temas).values(validatedData).returning();
      return res.status(201).json(newTema);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      console.error("Erro ao criar tema:", error);
      return res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  app.put(`${apiPrefix}/temas/:id`, async (req, res) => {
    try {
      const { id } = req.params;
      const validatedData = insertTemaSchema.parse(req.body);
      const [updatedTema] = await db.update(temas)
        .set(validatedData)
        .where(eq(temas.id, parseInt(id)))
        .returning();
        
      if (!updatedTema) {
        return res.status(404).json({ error: "Tema não encontrado" });
      }
      
      return res.json(updatedTema);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      console.error("Erro ao atualizar tema:", error);
      return res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  // Aulas routes
  app.get(`${apiPrefix}/aulas`, async (req, res) => {
    try {
      const { inicio, fim, alunoId } = req.query;
      
      let query = db.select().from(aulas)
        .orderBy(aulas.data);
      
      if (inicio && fim) {
        const dataInicio = new Date(inicio as string);
        const dataFim = new Date(fim as string);
        
        if (isValid(dataInicio) && isValid(dataFim)) {
          query = query.where(
            and(
              sql`${aulas.data} >= ${dataInicio}`,
              sql`${aulas.data} <= ${dataFim}`
            )
          );
        }
      }
      
      if (alunoId) {
        query = query.where(eq(aulas.alunoId, parseInt(alunoId as string)));
      }
      
      const result = await query;
      
      // Buscar informações relacionadas
      const aulasCompletas = await Promise.all(
        result.map(async (aula) => {
          const aluno = await db.query.alunos.findFirst({
            where: eq(alunos.id, aula.alunoId)
          });
          
          const materia = await db.query.materias.findFirst({
            where: eq(materias.id, aula.materiaId)
          });
          
          return {
            ...aula,
            aluno,
            materia
          };
        })
      );
      
      return res.json(aulasCompletas);
    } catch (error) {
      console.error("Erro ao buscar aulas:", error);
      return res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  app.post(`${apiPrefix}/aulas`, async (req, res) => {
    try {
      const validatedData = insertAulaSchema.parse(req.body);
      const [newAula] = await db.insert(aulas).values({
        ...validatedData,
        data: new Date(validatedData.data),
      }).returning();
      
      return res.status(201).json(newAula);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      console.error("Erro ao criar aula:", error);
      return res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  app.put(`${apiPrefix}/aulas/:id`, async (req, res) => {
    try {
      const { id } = req.params;
      const validatedData = insertAulaSchema.parse(req.body);
      const [updatedAula] = await db.update(aulas)
        .set({
          ...validatedData,
          data: new Date(validatedData.data),
        })
        .where(eq(aulas.id, parseInt(id)))
        .returning();
        
      if (!updatedAula) {
        return res.status(404).json({ error: "Aula não encontrada" });
      }
      
      return res.json(updatedAula);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      console.error("Erro ao atualizar aula:", error);
      return res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  app.delete(`${apiPrefix}/aulas/:id`, async (req, res) => {
    try {
      const { id } = req.params;
      await db.delete(aulas).where(eq(aulas.id, parseInt(id)));
      return res.status(204).end();
    } catch (error) {
      console.error("Erro ao deletar aula:", error);
      return res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  // Horários Disponíveis routes
  app.get(`${apiPrefix}/horarios-disponiveis`, async (req, res) => {
    try {
      const result = await db.select().from(horariosDisponiveis)
        .orderBy(horariosDisponiveis.diaSemana, horariosDisponiveis.horaInicio);
      
      return res.json(result);
    } catch (error) {
      console.error("Erro ao buscar horários disponíveis:", error);
      return res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  app.post(`${apiPrefix}/horarios-disponiveis`, async (req, res) => {
    try {
      const validatedData = insertHorarioDisponivelSchema.parse(req.body);
      const [newHorario] = await db.insert(horariosDisponiveis).values(validatedData).returning();
      return res.status(201).json(newHorario);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      console.error("Erro ao criar horário disponível:", error);
      return res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  // Dashboard routes
  app.get(`${apiPrefix}/dashboard/indicadores`, async (req, res) => {
    try {
      const { periodo } = req.query;
      let dataInicio: Date, dataFim: Date;
      const hoje = new Date();
      
      // Definir período para filtro
      switch (periodo) {
        case 'dia':
          dataInicio = startOfDay(hoje);
          dataFim = endOfDay(hoje);
          break;
        case 'semana':
          dataInicio = startOfWeek(hoje, { weekStartsOn: 0 });
          dataFim = endOfWeek(hoje, { weekStartsOn: 0 });
          break;
        case 'mes':
        default:
          dataInicio = startOfMonth(hoje);
          dataFim = endOfMonth(hoje);
          break;
      }
      
      // Aulas confirmadas
      const aulasConfirmadas = await db.select({ count: sql<number>`count(*)` })
        .from(aulas)
        .where(
          and(
            eq(aulas.status, 'confirmada'),
            sql`${aulas.data} >= ${dataInicio}`,
            sql`${aulas.data} <= ${dataFim}`
          )
        );
      
      // Acumulado do mês (valor)
      const acumuladoMes = await db.select({ total: sql<string>`sum(${aulas.valor})` })
        .from(aulas)
        .where(
          and(
            sql`${aulas.data} >= ${dataInicio}`,
            sql`${aulas.data} <= ${dataFim}`,
            sql`${aulas.status} IN ('confirmada', 'realizada')`
          )
        );
      
      // Aulas agendadas vs aulas dadas
      const aulasAgendadas = await db.select({ count: sql<number>`count(*)` })
        .from(aulas)
        .where(
          and(
            sql`${aulas.status} IN ('agendada', 'confirmada', 'realizada')`,
            sql`${aulas.data} >= ${dataInicio}`,
            sql`${aulas.data} <= ${dataFim}`
          )
        );
      
      const aulasDadas = await db.select({ count: sql<number>`count(*)` })
        .from(aulas)
        .where(
          and(
            eq(aulas.status, 'realizada'),
            sql`${aulas.data} >= ${dataInicio}`,
            sql`${aulas.data} <= ${dataFim}`
          )
        );
      
      // Horas trabalhadas
      const horasTrabalhadas = await db.select({ 
        total: sql<number>`sum(${aulas.duracao}) / 60` 
      })
        .from(aulas)
        .where(
          and(
            sql`${aulas.status} IN ('confirmada', 'realizada')`,
            sql`${aulas.data} >= ${dataInicio}`,
            sql`${aulas.data} <= ${dataFim}`
          )
        );
      
      return res.json({
        aulasConfirmadas: aulasConfirmadas[0].count || 0,
        acumuladoMes: parseFloat(acumuladoMes[0].total || '0'),
        aulasAgendadas: aulasAgendadas[0].count || 0,
        aulasDadas: aulasDadas[0].count || 0,
        horasTrabalhadas: Math.round(horasTrabalhadas[0].total || 0)
      });
    } catch (error) {
      console.error("Erro ao buscar indicadores:", error);
      return res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  // Rotas para gerenciar usuários (somente para administradores)
  app.get(`${apiPrefix}/usuarios`, async (req, res) => {
    try {
      // Verificar se o usuário atual é administrador
      if (!req.isAuthenticated() || req.user.username !== "STCaio") {
        return res.status(403).json({ error: "Acesso não autorizado" });
      }
      
      // Buscar todos os usuários
      const usuarios = await db.select().from(users);
      
      // Remover a senha dos dados retornados por segurança
      const usuariosSemSenha = usuarios.map(({ password, ...resto }) => resto);
      
      return res.json(usuariosSemSenha);
    } catch (error) {
      console.error("Erro ao buscar usuários:", error);
      return res.status(500).json({ error: "Erro interno do servidor" });
    }
  });
  
  app.post(`${apiPrefix}/usuarios`, async (req, res) => {
    try {
      // Verificar se o usuário atual é administrador
      if (!req.isAuthenticated() || req.user.username !== "STCaio") {
        return res.status(403).json({ error: "Acesso não autorizado" });
      }
      
      // Validar os dados
      const validatedData = insertUserSchema.parse(req.body);
      
      // Verificar se o nome de usuário já existe
      const userExists = await db.select()
        .from(users)
        .where(eq(users.username, validatedData.username))
        .limit(1);
      
      if (userExists.length > 0) {
        return res.status(400).json({ error: "Nome de usuário já existe" });
      }
      
      // Gerar hash da senha
      const hashedPassword = await storage.hashPassword(validatedData.password);
      
      // Criar o usuário
      const [newUser] = await db.insert(users)
        .values({
          ...validatedData,
          password: hashedPassword
        })
        .returning();
        
      // Remover a senha dos dados retornados
      const { password, ...userWithoutPassword } = newUser;
      
      return res.status(201).json(userWithoutPassword);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      console.error("Erro ao criar usuário:", error);
      return res.status(500).json({ error: "Erro interno do servidor" });
    }
  });
  
  app.put(`${apiPrefix}/usuarios/:id`, async (req, res) => {
    try {
      // Verificar se o usuário atual é administrador
      if (!req.isAuthenticated() || req.user.username !== "STCaio") {
        return res.status(403).json({ error: "Acesso não autorizado" });
      }
      
      const { id } = req.params;
      
      // Validar os dados
      const validatedData = insertUserSchema.parse(req.body);
      
      // Verificar se o usuário existe
      const userExists = await db.select()
        .from(users)
        .where(eq(users.id, parseInt(id)))
        .limit(1);
      
      if (userExists.length === 0) {
        return res.status(404).json({ error: "Usuário não encontrado" });
      }
      
      // Verificar se o novo nome de usuário já existe (se for diferente do atual)
      if (validatedData.username !== userExists[0].username) {
        const usernameExists = await db.select()
          .from(users)
          .where(eq(users.username, validatedData.username))
          .limit(1);
          
        if (usernameExists.length > 0) {
          return res.status(400).json({ error: "Nome de usuário já existe" });
        }
      }
      
      // Prepara os dados para atualização
      let dataToUpdate: any = {
        ...validatedData
      };
      
      // Se a senha foi fornecida, gerar novo hash
      if (validatedData.password) {
        dataToUpdate.password = await storage.hashPassword(validatedData.password);
      } else {
        // Se não foi fornecida senha, remover do objeto para não atualizar
        delete dataToUpdate.password;
      }
      
      // Atualizar o usuário
      const [updatedUser] = await db.update(users)
        .set(dataToUpdate)
        .where(eq(users.id, parseInt(id)))
        .returning();
        
      // Remover a senha dos dados retornados
      const { password, ...userWithoutPassword } = updatedUser;
      
      return res.json(userWithoutPassword);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      console.error("Erro ao atualizar usuário:", error);
      return res.status(500).json({ error: "Erro interno do servidor" });
    }
  });
  
  // Rota para buscar usuário pelo ID do aluno
  app.get(`${apiPrefix}/users/by-aluno/:alunoId`, async (req, res) => {
    try {
      const { alunoId } = req.params;
      
      // Buscar o aluno primeiro
      const aluno = await db.query.alunos.findFirst({
        where: eq(alunos.id, parseInt(alunoId))
      });
      
      if (!aluno) {
        return res.status(404).json({ error: "Aluno não encontrado" });
      }
      
      // Buscar o usuário associado ao aluno
      const usuario = await db.query.users.findFirst({
        where: eq(users.alunoId, parseInt(alunoId))
      });
      
      // Retornar os dados do aluno e do usuário (se existir)
      if (usuario) {
        // Remover senha antes de enviar na resposta
        const { password, ...usuarioSemSenha } = usuario;
        
        return res.json({
          ...aluno,
          usuario: usuarioSemSenha
        });
      }
      
      // Retornar apenas os dados do aluno se não houver usuário associado
      return res.json(aluno);
      
    } catch (error) {
      console.error("Erro ao buscar usuário por ID de aluno:", error);
      return res.status(500).json({ error: "Erro interno do servidor" });
    }
  });
  
  // Rota para redefinir senha de usuário
  app.put(`${apiPrefix}/users/:id/reset-password`, async (req, res) => {
    try {
      const { id } = req.params;
      const { password } = req.body;
      
      if (!password) {
        return res.status(400).json({ error: "Senha não fornecida" });
      }
      
      // Verificar se o usuário existe
      const userExists = await db.select()
        .from(users)
        .where(eq(users.id, parseInt(id)))
        .limit(1);
      
      if (userExists.length === 0) {
        return res.status(404).json({ error: "Usuário não encontrado" });
      }
      
      // Gerar hash da nova senha
      const hashedPassword = await storage.hashPassword(password);
      
      // Atualizar senha do usuário
      await db.update(users)
        .set({ password: hashedPassword })
        .where(eq(users.id, parseInt(id)));
      
      return res.status(200).json({ success: true, message: "Senha redefinida com sucesso" });
      
    } catch (error) {
      console.error("Erro ao redefinir senha de usuário:", error);
      return res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  app.delete(`${apiPrefix}/usuarios/:id`, async (req, res) => {
    try {
      // Verificar se o usuário atual é administrador
      if (!req.isAuthenticated() || req.user.username !== "STCaio") {
        return res.status(403).json({ error: "Acesso não autorizado" });
      }
      
      const { id } = req.params;
      
      // Verificar se o usuário existe
      const userExists = await db.select()
        .from(users)
        .where(eq(users.id, parseInt(id)))
        .limit(1);
      
      if (userExists.length === 0) {
        return res.status(404).json({ error: "Usuário não encontrado" });
      }
      
      // Não permitir excluir o usuário administrador STCaio
      if (userExists[0].username === "STCaio") {
        return res.status(403).json({ error: "Não é permitido excluir o usuário administrador principal" });
      }
      
      // Excluir o usuário
      await db.delete(users).where(eq(users.id, parseInt(id)));
      
      return res.status(204).end();
    } catch (error) {
      console.error("Erro ao excluir usuário:", error);
      return res.status(500).json({ error: "Erro interno do servidor" });
    }
  });
  
  // Rota para buscar usuário por ID de aluno
  app.get(`${apiPrefix}/users/by-aluno/:alunoId`, async (req, res) => {
    try {
      const { alunoId } = req.params;

      // Verificar se o aluno existe
      const aluno = await db.query.alunos.findFirst({
        where: eq(alunos.id, parseInt(alunoId))
      });

      if (!aluno) {
        return res.status(404).json({ error: "Aluno não encontrado" });
      }

      // Buscar usuário pelo ID de aluno
      const usuario = await db.query.users.findFirst({
        where: eq(users.alunoId, parseInt(alunoId))
      });

      if (!usuario) {
        // Retornar apenas os dados do aluno se não houver usuário vinculado
        return res.json(aluno);
      }

      // Remover a senha antes de retornar
      const { password, ...usuarioSemSenha } = usuario;

      // Retornar aluno com usuário associado
      return res.json({
        ...aluno,
        usuario: usuarioSemSenha
      });

    } catch (error) {
      console.error("Erro ao buscar usuário por ID de aluno:", error);
      return res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  // ===============================
  // APIs para o portal do aluno
  // ===============================
  
  // API para buscar dados do aluno logado
  app.get(`${apiPrefix}/alunos/usuario`, async (req, res) => {
    try {
      // Verificar se o usuário está autenticado
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Não autorizado" });
      }
      
      // Verificar se o usuário tem um aluno associado
      if (!req.user.alunoId) {
        return res.status(404).json({ error: "Usuário não possui um aluno associado" });
      }
      
      // Buscar os dados do aluno com todos os relacionamentos
      const aluno = await db.query.alunos.findFirst({
        where: eq(alunos.id, req.user.alunoId),
        with: {
          aulas: {
            with: {
              materia: true
            },
            orderBy: [desc(aulas.data)]
          },
          temas: {
            with: {
              materia: true
            }
          },
          responsaveis: {
            with: {
              responsavel: true
            }
          }
        }
      });
      
      if (!aluno) {
        return res.status(404).json({ error: "Aluno não encontrado" });
      }
      
      return res.json(aluno);
    } catch (error) {
      console.error("Erro ao buscar dados do aluno logado:", error);
      return res.status(500).json({ error: "Erro interno do servidor" });
    }
  });
  
  // API para buscar aulas do aluno logado
  app.get(`${apiPrefix}/aulas/aluno`, async (req, res) => {
    try {
      // Verificar se o usuário está autenticado
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Não autorizado" });
      }
      
      // Verificar se o usuário tem um aluno associado
      if (!req.user.alunoId) {
        return res.status(404).json({ error: "Usuário não possui um aluno associado" });
      }
      
      // Buscar todas as aulas do aluno
      const aulasAluno = await db.query.aulas.findMany({
        where: eq(aulas.alunoId, req.user.alunoId),
        with: {
          materia: true
        },
        orderBy: [desc(aulas.data)]
      });
      
      return res.json(aulasAluno);
    } catch (error) {
      console.error("Erro ao buscar aulas do aluno:", error);
      return res.status(500).json({ error: "Erro interno do servidor" });
    }
  });
  
  // API para buscar aulas agendadas do aluno logado
  app.get(`${apiPrefix}/aulas/aluno/agendadas`, async (req, res) => {
    try {
      // Verificar se o usuário está autenticado
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Não autorizado" });
      }
      
      // Verificar se o usuário tem um aluno associado
      if (!req.user.alunoId) {
        return res.status(404).json({ error: "Usuário não possui um aluno associado" });
      }
      
      // Buscar aulas agendadas ou confirmadas do aluno
      const aulasAgendadas = await db.query.aulas.findMany({
        where: and(
          eq(aulas.alunoId, req.user.alunoId),
          inArray(aulas.status, ["agendada", "confirmada"])
        ),
        with: {
          materia: true
        },
        orderBy: [desc(aulas.data)]
      });
      
      return res.json(aulasAgendadas);
    } catch (error) {
      console.error("Erro ao buscar aulas agendadas do aluno:", error);
      return res.status(500).json({ error: "Erro interno do servidor" });
    }
  });
  
  // API para buscar horários disponíveis para agendamento
  app.get(`${apiPrefix}/horarios-disponiveis`, async (req, res) => {
    try {
      // Verificar se o usuário está autenticado
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Não autorizado" });
      }
      
      // Buscar horários disponíveis no banco de dados
      const horariosDisponiveis = await db.query.horariosDisponiveis.findMany({
        where: eq(horariosDisponiveis.disponivel, true),
        orderBy: [
          asc(horariosDisponiveis.diaSemana),
          asc(horariosDisponiveis.horaInicio)
        ]
      });
      
      // Caso não existam horários cadastrados, criar alguns para demonstração
      if (horariosDisponiveis.length === 0) {
        // Dados de exemplo para horários disponíveis
        const horariosExemplo = [
          { diaSemana: 1, horaInicio: "14:00", horaFim: "15:00", disponivel: true },
          { diaSemana: 1, horaInicio: "16:00", horaFim: "17:00", disponivel: true },
          { diaSemana: 2, horaInicio: "09:00", horaFim: "10:00", disponivel: true },
          { diaSemana: 2, horaInicio: "15:00", horaFim: "16:00", disponivel: true },
          { diaSemana: 3, horaInicio: "14:00", horaFim: "15:00", disponivel: true },
          { diaSemana: 4, horaInicio: "10:00", horaFim: "11:00", disponivel: true },
          { diaSemana: 4, horaInicio: "16:00", horaFim: "17:00", disponivel: true },
          { diaSemana: 5, horaInicio: "13:00", horaFim: "14:00", disponivel: true },
          { diaSemana: 5, horaInicio: "15:00", horaFim: "16:00", disponivel: true },
          { diaSemana: 6, horaInicio: "09:00", horaFim: "10:00", disponivel: true },
        ];
        
        // Inserir os horários de exemplo no banco de dados
        await db.insert(horariosDisponiveis).values(horariosExemplo);
        
        // Buscar os horários recém inseridos
        const novosHorarios = await db.query.horariosDisponiveis.findMany({
          where: eq(horariosDisponiveis.disponivel, true),
          orderBy: [
            asc(horariosDisponiveis.diaSemana),
            asc(horariosDisponiveis.horaInicio)
          ]
        });
        
        return res.json(novosHorarios);
      }
      
      return res.json(horariosDisponiveis);
    } catch (error) {
      console.error("Erro ao buscar horários disponíveis:", error);
      return res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  // Criar servidor HTTP
  const httpServer = createServer(app);

  return httpServer;
}
