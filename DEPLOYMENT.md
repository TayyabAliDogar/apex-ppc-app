# Vibe PPC - Google Cloud Deployment Guide

## Prerequisites
1. Google Cloud account with AI Seekho credits activated
2. Google Cloud SDK installed
3. Project built locally

## Deployment Steps

### 1. Install Google Cloud SDK
Download from: https://cloud.google.com/sdk/docs/install
After installation, restart your terminal.

### 2. Initialize Google Cloud
```bash
# Login to your Google account
gcloud auth login

# Set your project ID (replace YOUR_PROJECT_ID with your actual project ID from AI Seekho)
gcloud config set project YOUR_PROJECT_ID

# Initialize App Engine (choose your region, e.g., asia-south1 for India)
gcloud app create --region=asia-south1
```

### 3. Build Your Application
```bash
npm run build
```

### 4. Deploy to Google Cloud
```bash
gcloud app deploy
```

When prompted:
- Confirm the deployment by typing `Y`
- Wait for deployment to complete (5-10 minutes)

### 5. View Your Application
```bash
# Open your deployed app in browser
gcloud app browse
```

Your app will be available at: `https://YOUR_PROJECT_ID.appspot.com`

## Important Notes

### Environment Variables
If you need to add environment variables (like Gemini API key):
```bash
gcloud app deploy --set-env-vars VITE_GEMINI_API_KEY=your_api_key_here
```

### View Logs
```bash
gcloud app logs tail -s default
```

### Update Your App
After making changes:
```bash
npm run build
gcloud app deploy
```

### Cost Management
- App Engine F1 instance is free tier eligible
- Auto-scaling is configured to minimize costs
- Monitor usage in Google Cloud Console

## Troubleshooting

### Build fails
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Deployment fails
```bash
# Check your app.yaml configuration
# Ensure all files are present
# Check gcloud logs for errors
```

### App doesn't load
- Check logs: `gcloud app logs tail -s default`
- Verify build completed: check `dist/` folder exists
- Ensure PORT environment variable is used in server.js

## Support
For AI Seekho competition support, contact your competition organizers.
For Google Cloud issues, check: https://cloud.google.com/appengine/docs
