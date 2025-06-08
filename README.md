# Sistema de Gestão de Aulas Particulares

Sistema completo para gerenciamento de aulas particulares, alunos, responsáveis e relatórios.

## 🚀 Deploy no Render

### Configuração do Banco Supabase

1. Acesse [Supabase Dashboard](https://supabase.com/dashboard/projects)
2. Crie um novo projeto
3. Vá em "Connect" no topo da tela
4. Copie a URI da "Connection string" > "Transaction pooler"
5. Substitua `[YOUR-PASSWORD]` pela senha do banco

### Deploy no Render

1. Conecte seu repositório no [Render](https://render.com)
2. Crie um novo "Web Service"
3. Configure as seguintes variáveis de ambiente:
   - `DATABASE_URL`: URL do Supabase
   - `NODE_ENV`: `production`
   - `SESSION_SECRET`: uma string aleatória segura

4. Configure os comandos:
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`

5. Após o deploy, execute as migrações:
   ```bash
   npm run db:push
   npm run db:seed
   ```

## 🛠️ Desenvolvimento Local

### Pré-requisitos
- Node.js 20+
- PostgreSQL

### Instalação
```bash
npm install
```

### Configuração
1. Configure a variável `DATABASE_URL` no ambiente
2. Execute as migrações:
   ```bash
   npm run db:push
   npm run db:seed
   ```

### Executar
```bash
npm run dev
```

## 📊 Funcionalidades

- ✅ Gestão de alunos e responsáveis
- ✅ Agendamento de aulas
- ✅ Calendário interativo
- ✅ Relatórios e gráficos
- ✅ Sistema de autenticação
- ✅ WhatsApp integrado
- ✅ Export PDF/PNG

## 🗄️ Estrutura do Banco

- **Alunos**: Informações dos estudantes
- **Responsáveis**: Contatos e WhatsApp
- **Aulas**: Agendamentos e histórico
- **Matérias**: Disciplinas disponíveis
- **Temas**: Conteúdos por matéria/ano
- **Usuários**: Sistema de login

## 👥 Usuário Padrão

- **Username**: STCaio
- **Password**: Deus2025# Aulas_Caio_Final
# Aulas_Caio_Final
# Aulas-Final
