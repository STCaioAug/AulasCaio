# Export to GitHub Repository

## Step-by-Step Instructions

### 1. Download Your Project Files
Download all the project files to your local computer. You'll need:

**Essential Files:**
- `package.json` - Dependencies and scripts
- `package-lock.json` - Lock file for exact versions
- `tsconfig.json` - TypeScript configuration
- `vite.config.ts` - Build configuration
- `tailwind.config.ts` - Styling configuration
- `postcss.config.js` - CSS processing
- `drizzle.config.ts` - Database configuration
- `components.json` - UI components config
- `.gitignore` - Files to ignore in Git
- `README.md` - Project documentation

**Source Code Folders:**
- `client/` - Frontend React application
- `server/` - Backend Express server
- `shared/` - Shared schemas and types
- `db/` - Database setup and seeding

**Optional Files:**
- `render.yaml` - Render deployment config
- `attached_assets/` - Project assets (logos, images)

### 2. Create GitHub Repository

1. Go to [GitHub.com](https://github.com)
2. Click "New repository" (green button)
3. Choose a repository name (e.g., `tutoring-management-system`)
4. Add description: "Sistema completo para gestão de aulas particulares"
5. Set to Public or Private as needed
6. **Don't** initialize with README (you already have one)
7. Click "Create repository"

### 3. Upload to GitHub

**Option A: Using GitHub Web Interface**
1. On your new repository page, click "uploading an existing file"
2. Drag and drop all your project files/folders
3. Write commit message: "Initial commit - Tutoring Management System"
4. Click "Commit changes"

**Option B: Using Git Commands** (if you have Git installed)
```bash
# Navigate to your project folder
cd your-project-folder

# Initialize Git repository
git init

# Add all files
git add .

# Create first commit
git commit -m "Initial commit - Tutoring Management System"

# Connect to GitHub repository
git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPO-NAME.git

# Push to GitHub
git push -u origin main
```

### 4. Environment Variables Setup

For deployment, you'll need these environment variables:
- `DATABASE_URL` - Your PostgreSQL connection string
- `SESSION_SECRET` - Random secure string for sessions
- `NODE_ENV` - Set to "production" for deployment

### 5. Deployment Options

**Render.com (Recommended)**
1. Connect your GitHub repository
2. Create new Web Service
3. Set build command: `npm install && npm run build`
4. Set start command: `npm start`
5. Add environment variables
6. Deploy

**Vercel**
1. Import your GitHub repository
2. Framework preset: Other
3. Build command: `npm run build`
4. Start command: `npm start`
5. Add environment variables

### 6. Post-Deployment Setup

After deployment, run database migrations:
```bash
npm run db:push
npm run db:seed
```

## Ready to Use!

Your tutoring management system will be accessible online with:
- Student management
- Class scheduling
- Interactive calendar
- Reports and analytics
- WhatsApp integration
- PDF/PNG exports

Default login credentials:
- Username: STCaio
- Password: Deus2025