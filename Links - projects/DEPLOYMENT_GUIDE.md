# Guide: Deploying TypeScript Projects to GitHub Pages

This guide summarizes the steps required to integrate a TypeScript/React project into your GitHub Pages website.

## Prerequisites
- A TypeScript/React project (using Vite, Create React App, or similar)
- Your GitHub Pages repository (`ace-etn1.github.io`)
- Node.js and npm installed

---

## Step-by-Step Process

### 1. **Configure Vite for GitHub Pages Subdirectories**

Edit `vite.config.ts` to use relative paths:

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: './', // CRITICAL: Use relative paths for GitHub Pages subdirectories
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  },
})
```

**Why:** GitHub Pages serves your project from a subdirectory, so absolute paths won't work. The `base: './'` ensures all assets use relative paths.

---

### 2. **Update .gitignore to Include dist Folder**

Edit `.gitignore` and **comment out or remove** the `dist` line:

```gitignore
# dist - commented out to allow dist folder to be committed for GitHub Pages
# dist-ssr
```

**Why:** GitHub Pages needs the built files in the repository. The `dist` folder contains the production-ready files that must be committed.

---

### 3. **Build Your Project**

Navigate to your project directory and build:

```bash
cd "Links - projects/YourProjectName"
npm run build
```

This will:
- Compile TypeScript (`tsc -b`)
- Bundle everything with Vite (`vite build`)
- Output production files to the `dist/` folder

**Important:** Always rebuild after making changes to source files!

---

### 4. **Add Link to Your Main Website**

Edit your main `links.html` (or wherever you want the link) to point to the built project:

```html
<a href="Links%20-%20projects/YourProjectName/dist/index.html">
    Your Project Name
</a>
```

**Note:** Use `%20` for spaces in URLs, or use `-` instead of spaces in folder names.

---

### 5. **Handle Relative Paths for Navigation**

If your project needs to link back to your main site, use relative paths:

From: `Links - projects/YourProjectName/dist/index.html`  
To: `links.html` (at root)

Use: `../../../links.html`

**Path breakdown:**
- `../` → goes up to `YourProjectName/`
- `../../` → goes up to `Links - projects/`
- `../../../` → goes up to root
- `../../../links.html` → root `links.html`

---

### 6. **Add Files to Git**

```bash
cd "path/to/ace-etn1.github.io"
git add "Links - projects/YourProjectName/"
```

This adds:
- Source files (`src/`)
- Configuration files (`package.json`, `tsconfig.json`, `vite.config.ts`, etc.)
- **Built files** (`dist/` folder) - This is important!

---

### 7. **Commit and Push**

```bash
git commit -m "Add YourProjectName TypeScript project"
git push origin master
```

---

## Workflow for Future Updates

When you make changes to your TypeScript project:

1. **Edit source files** in `src/`
2. **Rebuild:** `npm run build` (in your project directory)
3. **Verify:** Check that `dist/` folder has new files
4. **Add changes:**
   ```bash
   git add "Links - projects/YourProjectName/"
   ```
5. **Commit and push:**
   ```bash
   git commit -m "Update YourProjectName: description of changes"
   git push origin master
   ```

---

## Important Notes

### ✅ DO:
- Always rebuild after making source code changes
- Commit both source files AND the `dist/` folder
- Use relative paths (`base: './'` in vite.config.ts)
- Test locally with `npm run dev` before building

### ❌ DON'T:
- Don't ignore the `dist/` folder (it needs to be in Git)
- Don't use absolute paths in your project
- Don't forget to rebuild before pushing
- Don't commit `node_modules/` (should be in .gitignore)

---

## Troubleshooting

### Changes not showing on GitHub Pages?
1. **Hard refresh** your browser (Ctrl+F5)
2. **Check build output** - verify `dist/` has latest files
3. **Check file paths** - ensure relative paths are correct
4. **Wait a few minutes** - GitHub Pages can take time to update

### Path issues?
- Verify `base: './'` in `vite.config.ts`
- Check relative paths from your project's location
- Test paths locally before deploying

---

## Example Project Structure

```
ace-etn1.github.io/
├── links.html                    (main page)
├── Links - projects/
│   └── YourProjectName/
│       ├── src/                  (source files - TypeScript/React)
│       │   ├── components/
│       │   ├── App.tsx
│       │   └── main.tsx
│       ├── dist/                 (built files - MUST be committed)
│       │   ├── index.html
│       │   └── assets/
│       │       └── index-XXXXX.js
│       ├── package.json
│       ├── vite.config.ts        (with base: './')
│       └── .gitignore            (dist NOT ignored)
```

---

## Quick Reference Commands

```bash
# Build project
cd "Links - projects/YourProjectName"
npm run build

# Add to Git
cd "path/to/ace-etn1.github.io"
git add "Links - projects/YourProjectName/"

# Commit and push
git commit -m "Your commit message"
git push origin master
```

