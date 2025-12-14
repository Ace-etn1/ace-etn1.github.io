# Build Instructions for Christmas Tree Project

## Step 1: Install Node.js

1. Download Node.js from: https://nodejs.org/
2. Install the LTS version (recommended)
3. Restart your terminal/command prompt after installation

## Step 2: Verify Installation

Open a new terminal and run:
```bash
node --version
npm --version
```

Both commands should show version numbers.

## Step 3: Build the Project

Navigate to this folder in terminal:
```bash
cd "Links - projects\jj's-interactive-christmas-tree"
```

Install dependencies:
```bash
npm install
```

Build the project:
```bash
npm run build
```

This will create a `dist` folder with the built files.

## Step 4: Deploy

After building, the `dist` folder contains the production-ready files. You can:
- Copy the contents of `dist` to the project root, OR
- Update the link in `links.html` to point to the `dist` folder

## Note about API Key

If the project requires a GEMINI_API_KEY, you'll need to:
1. Create a `.env.local` file in this directory
2. Add: `GEMINI_API_KEY=your_api_key_here`
3. The build process will use this key

