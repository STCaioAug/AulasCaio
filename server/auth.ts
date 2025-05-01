import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser, alunos, users } from "@shared/schema";
import { db } from "@db";
import { eq } from "drizzle-orm";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "default_session_secret",
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    },
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      const user = await storage.getUserByUsername(username);
      if (!user || !(await comparePasswords(password, user.password))) {
        return done(null, false);
      } else {
        return done(null, user);
      }
    }),
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    const user = await storage.getUser(id);
    done(null, user);
  });

  app.post("/api/register", async (req, res, next) => {
    try {
      // Verificar se o nome de usuário já existe
      const existingUser = await storage.getUserByUsername(req.body.username);
      if (existingUser) {
        return res.status(400).json({ error: "Nome de usuário já existe" });
      }

      // Se foi passado um alunoId, verificar se ele existe e se já possui um usuário associado
      let alunoExistente = null;
      if (req.body.alunoId) {
        // Verificar se o aluno existe
        const aluno = await db.query.alunos.findFirst({
          where: eq(alunos.id, parseInt(req.body.alunoId))
        });
        if (!aluno) {
          return res.status(404).json({ error: "Aluno não encontrado" });
        }

        // Verificar se o aluno já possui um usuário associado
        const usuarioExistente = await db.query.users.findFirst({
          where: eq(users.alunoId, parseInt(req.body.alunoId))
        });
        if (usuarioExistente) {
          return res.status(400).json({ error: "Este aluno já possui um usuário associado" });
        }

        alunoExistente = aluno;
      }

      // Criar o novo usuário com a senha hash
      const userData = {
        ...req.body,
        password: await hashPassword(req.body.password),
        isAdmin: false, // Por padrão, novos usuários não são administradores
        lastLogin: new Date() // Definir a data de criação como último login
      };

      // Criar o usuário no banco de dados
      const user = await storage.createUser(userData);

      // Fazer login automático com o novo usuário
      req.login(user, (err) => {
        if (err) return next(err);
        
        // Remover a senha antes de retornar
        const { password, ...userSemSenha } = user;
        res.status(201).json(userSemSenha);
      });
    } catch (error) {
      console.error("Erro ao registrar usuário:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  app.post("/api/login", passport.authenticate("local"), (req, res) => {
    res.status(200).json(req.user);
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    res.json(req.user);
  });
}
