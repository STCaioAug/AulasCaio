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
  insertHorarioDisponivelSchema 
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

  // Criar servidor HTTP
  const httpServer = createServer(app);

  return httpServer;
}
