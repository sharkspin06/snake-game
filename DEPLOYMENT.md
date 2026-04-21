# Deploying Snake Game to Vercel

## Prerequisites
- GitHub account
- Vercel account (free tier is fine)

## Deployment Steps

### Option 1: Deploy via Vercel CLI (Recommended)

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Deploy**
   ```bash
   vercel
   ```
   - Follow the prompts
   - Choose your project settings
   - Vercel will automatically detect it's a Vite project

4. **Deploy to Production**
   ```bash
   vercel --prod
   ```

### Option 2: Deploy via Vercel Dashboard

1. **Push your code to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin YOUR_GITHUB_REPO_URL
   git push -u origin main
   ```

2. **Go to Vercel Dashboard**
   - Visit https://vercel.com/
   - Click "Add New Project"
   - Import your GitHub repository

3. **Configure Build Settings**
   - Framework Preset: **Vite**
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

4. **Deploy**
   - Click "Deploy"
   - Wait for deployment to complete
   - Your site will be live!

## Important Files for Deployment

- `vercel.json` - Vercel configuration (already created)
- `package.json` - Dependencies and build scripts
- `vite.config.js` - Vite configuration
- `public/` - Static assets (images, GIFs, music)

## Custom Domain (Optional)

1. Go to your project in Vercel Dashboard
2. Click "Settings" → "Domains"
3. Add your custom domain
4. Follow DNS configuration instructions

## Environment Variables (If needed)

If you need environment variables:
1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add your variables
3. Redeploy

## Troubleshooting

### Build Fails
- Check that all dependencies are in `package.json`
- Ensure `npm run build` works locally first

### Assets Not Loading
- Make sure all files are in the `public/` folder
- Check file paths (use `/filename.ext` not `./filename.ext`)

### 404 Errors
- The `vercel.json` file handles SPA routing
- Make sure it's committed to your repository

## Post-Deployment Checklist

✅ Test the game on the live URL
✅ Check that all PNG heads load correctly
✅ Verify gameover.gif appears
✅ Test mobile controls on actual mobile device
✅ Check logo.gif watermark displays
✅ Test all game features (pause, restart, character selection)

## Your Deployment URL

After deployment, Vercel will provide you with:
- **Preview URL**: `your-project-name.vercel.app`
- **Production URL**: Same as preview (or your custom domain)

## Updates

To update your deployed site:
```bash
git add .
git commit -m "Update description"
git push
```

Vercel will automatically redeploy on every push to main branch!

---

**Need help?** Check Vercel docs: https://vercel.com/docs
