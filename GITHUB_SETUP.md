# OMR Manager - Keep-Alive Setup 🚀

To enable "Plan A" (GitHub Actions), you need to add your live URL as a secret.

## Steps

1.  **Go to OMR Manager Repo:**
    *   Settings -> Secrets and variables -> Actions.
2.  **Add Secret:**
    *   Name: `PRODUCTION_URL`
    *   Value: `https://your-omr-app-url.vercel.app`
3.  **Verify:**
    *   Go to "Actions" tab -> "OMR Manager Keep-Alive (Plan A)" -> Run workflow.

**Plan B (Vercel Cron)** is automatically enabled when you push these changes to Vercel. 
(Check Vercel Dashboard -> Project -> Settings -> Cron Jobs).
