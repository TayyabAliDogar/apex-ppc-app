# Deploy Apex PPC to Google Cloud Run

## Quick Deployment Guide

### Option 1: Using Cloud Shell (No Installation Required) ✓ RECOMMENDED

1. **Open Google Cloud Console**
   - Go to: https://console.cloud.google.com
   - Select your AI Seekho project from the dropdown

2. **Open Cloud Shell**
   - Click the Cloud Shell icon (>_) in the top-right corner
   - Wait for the terminal to load

3. **Upload Your Project**
   - In Cloud Shell, click the "More" menu (⋮) → "Upload"
   - Select your entire project folder (or zip it first and upload the zip)
   - Or use this command to clone if you have a git repo:
     ```bash
     git clone YOUR_REPO_URL
     cd vibe-ppc-app
     ```

4. **Build and Deploy**
   ```bash
   # Make sure you're in the project directory
   cd vibe-ppc-app
   
   # Build the frontend
   npm install
   npm run build
   
   # Deploy to Cloud Run
   gcloud run deploy apex-ppc \
     --source . \
     --platform managed \
     --region asia-south1 \
     --allow-unauthenticated \
     --memory 512Mi \
     --cpu 1
   ```

5. **Access Your App**
   - Cloud Run will provide a URL like: `https://apex-ppc-xxxxx-as.a.run.app`
   - Your app is now live!

---

### Option 2: Using Local gcloud CLI

If you have gcloud installed locally:

```bash
# 1. Login
gcloud auth login

# 2. Set project
gcloud config set project YOUR_PROJECT_ID

# 3. Build the app
npm run build

# 4. Deploy to Cloud Run
gcloud run deploy apex-ppc \
  --source . \
  --platform managed \
  --region asia-south1 \
  --allow-unauthenticated \
  --memory 512Mi \
  --cpu 1
```

---

## What Happens During Deployment?

1. **Build Process:**
   - Cloud Run detects the Dockerfile
   - Builds a container image with your app
   - Pushes it to Google Container Registry

2. **Deployment:**
   - Creates a Cloud Run service
   - Allocates resources (512MB RAM, 1 CPU)
   - Makes it publicly accessible
   - Provides an HTTPS URL

3. **Cost:**
   - Uses your AI Seekho credits
   - Free tier: 2 million requests/month
   - Pay only when app is running

---

## Updating Your App

After making changes:

```bash
# Rebuild
npm run build

# Redeploy
gcloud run deploy apex-ppc \
  --source . \
  --platform managed \
  --region asia-south1
```

---

## Troubleshooting

**Build fails?**
- Make sure `npm run build` works locally first
- Check that `dist/` folder exists

**Deployment fails?**
- Verify you're in the correct project
- Check you have Cloud Run API enabled
- Ensure billing is enabled with your credits

**App doesn't load?**
- Check logs: `gcloud run logs read --service apex-ppc`
- Verify the service is running: `gcloud run services list`

---

## Important Notes

- **Port:** Cloud Run automatically sets PORT=8080 (already configured in server.js)
- **Region:** asia-south1 (Mumbai) is closest to India
- **Memory:** 512Mi is sufficient for this app
- **Public Access:** --allow-unauthenticated makes it accessible to everyone

---

## Next Steps After Deployment

1. **Custom Domain** (optional):
   ```bash
   gcloud run domain-mappings create \
     --service apex-ppc \
     --domain your-domain.com
   ```

2. **Environment Variables** (if needed):
   ```bash
   gcloud run services update apex-ppc \
     --set-env-vars "KEY=VALUE"
   ```

3. **Monitor Usage:**
   - Check Cloud Console → Cloud Run → apex-ppc
   - View metrics, logs, and costs
