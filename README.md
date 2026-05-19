# Moshe AI - Vercel version

## Upload to Vercel

1. Upload these files to a GitHub repository:
   - `index.html`
   - the `api` folder
   - `package.json`
   - `.env.example`

2. In Vercel, import the GitHub repository.

3. In Vercel → Project → Settings → Environment Variables, add:
   - `GEMINI_API_KEY` = your Gemini API key
   - optional: `GEMINI_MODEL` = `gemini-2.5-flash`

4. Deploy again after adding the environment variable.

## Important

There is no `vercel.json` file in this version. Vercel automatically detects:
- `index.html` as the website
- files inside `/api` as serverless functions

This avoids the “Invalid vercel.json file provided” build error.
