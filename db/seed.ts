import { db } from "./index";
import { 
  users, 
  alunos, 
  responsaveis, 
  alunosResponsaveis, 
  materias, 
  temas, 
  aulas, 
  horariosDisponiveis 
} from "@shared/schema";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function seed() {
  try {
    console.log("Iniciando seed do banco de dados...");

    // Verifica se já existe um usuário (para evitar duplicação)
    const existingUsers = await db.select().from(users);
    if (existingUsers.length === 0) {
      // Criar usuário administrador
      const hashedPassword = await hashPassword("123456");
      await db.insert(users).values({
        username: "admin",
        password: hashedPassword,
        nome: "Maria Silva",
        email: "professor@edu.com",
        telefone: "(19) 99999-9999"
      });
      console.log("Usuário admin criado com sucesso!");
    } else {
      console.log("Usuários já existem, pulando criação de usuário admin");
    }

    // Verificar matérias existentes
    const existingMaterias = await db.select().from(materias);
    if (existingMaterias.length === 0) {
      // Criar matérias
      await db.insert(materias).values([
        { nome: "Matemática", cor: "#4f46e5" },
        { nome: "Português", cor: "#ec4899" },
        { nome: "Física", cor: "#8b5cf6" },
        { nome: "Química", cor: "#10b981" },
        { nome: "Biologia", cor: "#f59e0b" },
        { nome: "História", cor: "#ef4444" },
        { nome: "Geografia", cor: "#06b6d4" },
        { nome: "Inglês", cor: "#6366f1" }
      ]);
      console.log("Matérias criadas com sucesso!");
    } else {
      console.log("Matérias já existem, pulando criação");
    }

    // Verificar alunos existentes
    const existingAlunos = await db.select().from(alunos);
    if (existingAlunos.length === 0) {
      // Criar alunos
      await db.insert(alunos).values([
        { nome: "Maria Almeida", anoEscolar: "8_ano", email: "maria@example.com" },
        { nome: "João Ferraz", anoEscolar: "6_ano", email: "joao@example.com" },
        { nome: "Pedro Risola", anoEscolar: "9_ano", email: "pedro@example.com" },
        { nome: "Lourenço Ducatti", anoEscolar: "1_em", email: "lourenco@example.com" },
        { nome: "Gabi Selêncio", anoEscolar: "2_em", email: "gabi@example.com" },
        { nome: "Otávio Silva", anoEscolar: "7_ano", email: "otavio@example.com" },
        { nome: "Pietro Archilia", anoEscolar: "3_em", email: "pietro@example.com" },
        { nome: "Carol Santos", anoEscolar: "9_ano", email: "carol@example.com" },
        { nome: "Guilherme Pedrão", anoEscolar: "1_em", email: "gui@example.com" },
        { nome: "Antônio Oliveira", anoEscolar: "6_ano", email: "antonio@example.com" },
        { nome: "Fernanda Lima", anoEscolar: "8_ano", email: "fernanda@example.com" },
        { nome: "Betina Martins", anoEscolar: "7_ano", email: "betina@example.com" }
      ]);
      console.log("Alunos criados com sucesso!");
    } else {
      console.log("Alunos já existem, pulando criação");
    }

    // Verificar responsáveis existentes
    const existingResponsaveis = await db.select().from(responsaveis);
    if (existingResponsaveis.length === 0) {
      // Criar responsáveis
      await db.insert(responsaveis).values([
        { nome: "Daniella Risola", telefone: "(19) 98224-4747", whatsapp: "https://wa.me/5519982244747" },
        { nome: "Giovanela", telefone: "(19) 98186-7873", whatsapp: "https://wa.me/5519981867873" },
        { nome: "Karin", telefone: "(11) 97626-9474", whatsapp: "https://wa.me/5511976269474" },
        { nome: "Leandro", telefone: "(11) 97679-6336", whatsapp: "https://wa.me/5511976796336" },
        { nome: "Gisele", telefone: "(19) 99928-4241", whatsapp: "https://wa.me/5519999284241" },
        { nome: "Silvia Celêncio", telefone: "(19) 99602-8813", whatsapp: "https://wa.me/5519996028813" },
        { nome: "Maysa Inada O Ducatti", telefone: "(19) 99891-6701", whatsapp: "https://wa.me/5519998916701" },
        { nome: "Marcela Archilia", telefone: "(19) 98911-3534", whatsapp: "https://wa.me/5519989113534" },
        { nome: "Elisane", telefone: "(19) 98181-6080", whatsapp: "https://wa.me/5519981816080" },
        { nome: "Mariana Ferraz", telefone: "(19) 99130-8899", whatsapp: "https://wa.me/5519991308899" }
      ]);
      console.log("Responsáveis criados com sucesso!");
    } else {
      console.log("Responsáveis já existem, pulando criação");
    }

    // Associar alunos e responsáveis
    const allAlunos = await db.select().from(alunos);
    const allResponsaveis = await db.select().from(responsaveis);
    const existingRelacoes = await db.select().from(alunosResponsaveis);

    if (existingRelacoes.length === 0 && allAlunos.length > 0 && allResponsaveis.length > 0) {
      // Mapear alunos por nome
      const alunosPorNome = new Map();
      allAlunos.forEach(aluno => {
        alunosPorNome.set(aluno.nome.split(' ')[0], aluno.id);
      });

      // Mapear responsáveis por nome
      const responsaveisPorNome = new Map();
      allResponsaveis.forEach(resp => {
        responsaveisPorNome.set(resp.nome.split(' ')[0], resp.id);
      });

      // Relações conforme documentado
      const relacoes = [
        { aluno: "Maria", responsavel: "Giovanela" },
        { aluno: "João", responsavel: "Mariana" },
        { aluno: "Pedro", responsavel: "Daniella" },
        { aluno: "Lourenço", responsavel: "Maysa" },
        { aluno: "Gabi", responsavel: "Silvia" },
        { aluno: "Otávio", responsavel: "Gisele" },
        { aluno: "Pietro", responsavel: "Marcela" },
        { aluno: "Carol", responsavel: "Daniella" },
        { aluno: "Guilherme", responsavel: "Karin" },
        { aluno: "Guilherme", responsavel: "Leandro" },
        { aluno: "Antônio", responsavel: "Giovanela" },
        { aluno: "Fernanda", responsavel: "Giovanela" },
        { aluno: "Betina", responsavel: "Mariana" }
      ];

      // Inserir relações
      for (const relacao of relacoes) {
        const alunoId = alunosPorNome.get(relacao.aluno);
        const responsavelId = responsaveisPorNome.get(relacao.responsavel);
        
        if (alunoId && responsavelId) {
          await db.insert(alunosResponsaveis).values({
            alunoId,
            responsavelId
          });
        }
      }
      console.log("Relações entre alunos e responsáveis criadas com sucesso!");
    } else {
      console.log("Relações já existem ou dados insuficientes, pulando criação de relações");
    }

    // Verificar horários disponíveis existentes
    const existingHorarios = await db.select().from(horariosDisponiveis);
    if (existingHorarios.length === 0) {
      // Criar horários disponíveis
      await db.insert(horariosDisponiveis).values([
        { diaSemana: 1, horaInicio: "10:00", horaFim: "12:00" },
        { diaSemana: 2, horaInicio: "14:00", horaFim: "16:00" },
        { diaSemana: 3, horaInicio: "09:00", horaFim: "11:00" },
        { diaSemana: 4, horaInicio: "16:00", horaFim: "18:00" },
        { diaSemana: 5, horaInicio: "13:00", horaFim: "15:00" }
      ]);
      console.log("Horários disponíveis criados com sucesso!");
    } else {
      console.log("Horários disponíveis já existem, pulando criação");
    }

    // Verificar aulas existentes
    const existingAulas = await db.select().from(aulas);
    if (existingAulas.length === 0) {
      // Buscar IDs de matérias
      const todasMaterias = await db.select().from(materias);
      const materiasMap = new Map();
      todasMaterias.forEach(m => {
        materiasMap.set(m.nome, m.id);
      });

      // Criar aulas (exemplo com datas próximas)
      const hoje = new Date();
      const amanha = new Date();
      amanha.setDate(hoje.getDate() + 1);
      const depoisDeAmanha = new Date();
      depoisDeAmanha.setDate(hoje.getDate() + 2);
      const ontem = new Date();
      ontem.setDate(hoje.getDate() - 1);
      const anteontem = new Date();
      anteontem.setDate(hoje.getDate() - 2);

      // Obter alunos para associar às aulas
      if (allAlunos.length >= 5) {
        await db.insert(aulas).values([
          { 
            data: hoje, 
            duracao: 120, 
            alunoId: allAlunos[0].id, 
            materiaId: materiasMap.get("Matemática") || 1, 
            status: "confirmada",
            valor: 120.00
          },
          { 
            data: amanha, 
            duracao: 90, 
            alunoId: allAlunos[1].id, 
            materiaId: materiasMap.get("Português") || 2, 
            status: "agendada",
            valor: 90.00
          },
          { 
            data: depoisDeAmanha, 
            duracao: 60, 
            alunoId: allAlunos[2].id, 
            materiaId: materiasMap.get("Física") || 3, 
            status: "agendada",
            valor: 60.00
          },
          { 
            data: ontem, 
            duracao: 120, 
            alunoId: allAlunos[3].id, 
            materiaId: materiasMap.get("Química") || 4, 
            status: "realizada",
            valor: 120.00,
            conteudo: "Tabela periódica e elementos químicos"
          },
          { 
            data: anteontem, 
            duracao: 90, 
            alunoId: allAlunos[4].id, 
            materiaId: materiasMap.get("Biologia") || 5, 
            status: "realizada",
            valor: 90.00,
            conteudo: "Sistema digestivo e nutrição"
          }
        ]);
        console.log("Aulas criadas com sucesso!");
      } else {
        console.log("Não há alunos suficientes para criar aulas de exemplo");
      }
    } else {
      console.log("Aulas já existem, pulando criação");
    }

    // Verificar temas existentes
    const existingTemas = await db.select().from(temas);
    if (existingTemas.length === 0) {
      // Buscar IDs de matérias
      const todasMaterias = await db.select().from(materias);
      const materiasMap = new Map();
      todasMaterias.forEach(m => {
        materiasMap.set(m.nome, m.id);
      });

      // Criar temas gerais por série
      if (materiasMap.size > 0) {
        // Matemática 8º ano
        await db.insert(temas).values([
          { 
            nome: "Equações do 1º grau", 
            materiaId: materiasMap.get("Matemática") || 1, 
            anoEscolar: "8_ano",
            dificuldade: "medio",
            alunoId: null,
            estudado: false
          },
          { 
            nome: "Sistemas de equações", 
            materiaId: materiasMap.get("Matemática") || 1, 
            anoEscolar: "8_ano",
            dificuldade: "dificil",
            alunoId: null,
            estudado: false
          },
          { 
            nome: "Porcentagem e juros", 
            materiaId: materiasMap.get("Matemática") || 1, 
            anoEscolar: "8_ano",
            dificuldade: "medio",
            alunoId: null,
            estudado: false
          },
          // Física 1º EM
          { 
            nome: "Cinemática", 
            materiaId: materiasMap.get("Física") || 3, 
            anoEscolar: "1_em",
            dificuldade: "medio",
            alunoId: null,
            estudado: false
          },
          { 
            nome: "Leis de Newton", 
            materiaId: materiasMap.get("Física") || 3, 
            anoEscolar: "1_em",
            dificuldade: "medio",
            alunoId: null,
            estudado: false
          },
          // Química 2º EM
          { 
            nome: "Estequiometria", 
            materiaId: materiasMap.get("Química") || 4, 
            anoEscolar: "2_em",
            dificuldade: "dificil",
            alunoId: null,
            estudado: false
          },
          { 
            nome: "Termoquímica", 
            materiaId: materiasMap.get("Química") || 4, 
            anoEscolar: "2_em",
            dificuldade: "dificil",
            alunoId: null,
            estudado: false
          },
          // Português 6º ano
          { 
            nome: "Interpretação de textos", 
            materiaId: materiasMap.get("Português") || 2, 
            anoEscolar: "6_ano",
            dificuldade: "facil",
            alunoId: null,
            estudado: false
          },
          { 
            nome: "Classes gramaticais", 
            materiaId: materiasMap.get("Português") || 2, 
            anoEscolar: "6_ano",
            dificuldade: "medio",
            alunoId: null,
            estudado: false
          }
        ]);
        console.log("Temas gerais criados com sucesso!");

        // Associar alguns temas a alunos específicos
        const alunoPorAnoEscolar = new Map();
        allAlunos.forEach(aluno => {
          if (!alunoPorAnoEscolar.has(aluno.anoEscolar)) {
            alunoPorAnoEscolar.set(aluno.anoEscolar, aluno.id);
          }
        });

        if (alunoPorAnoEscolar.size > 0) {
          // Temas específicos para alunos
          await db.insert(temas).values([
            { 
              nome: "Divisão com números decimais", 
              materiaId: materiasMap.get("Matemática") || 1, 
              anoEscolar: "6_ano",
              dificuldade: "medio",
              alunoId: alunoPorAnoEscolar.get("6_ano"),
              estudado: true
            },
            { 
              nome: "Redação argumentativa", 
              materiaId: materiasMap.get("Português") || 2, 
              anoEscolar: "8_ano",
              dificuldade: "medio",
              alunoId: alunoPorAnoEscolar.get("8_ano"),
              estudado: true
            },
            { 
              nome: "Movimento circular", 
              materiaId: materiasMap.get("Física") || 3, 
              anoEscolar: "1_em",
              dificuldade: "dificil",
              alunoId: alunoPorAnoEscolar.get("1_em"),
              estudado: false
            }
          ]);
          console.log("Temas específicos para alunos criados com sucesso!");
        }
      } else {
        console.log("Não há matérias para associar aos temas");
      }
    } else {
      console.log("Temas já existem, pulando criação");
    }

    console.log("Seed concluído com sucesso!");
  } catch (error) {
    console.error("Erro durante o seed:", error);
  }
}

seed();
