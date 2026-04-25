# Quick Start - Deploy to Google Cloud

## 1. Install Google Cloud SDK
Download: https://cloud.google.com/sdk/docs/install
Restart terminal after installation.

## 2. Setup (One-time)
```bash
# Login
gcloud auth login

# Set your AI Seekho project ID
gcloud config set project YOUR_PROJECT_ID

# Create App Engine app (choose asia-south1 for India)
gcloud app create --region=asia-south1
```

## 3. Deploy
```bash
# Windows
deploy.bat

# Or manually:
npm run build
gcloud app deploy
```

## 4. Access Your App
Your app will be at: `https://YOUR_PROJECT_ID.appspot.com`

## Quick Commands
```bash
# View logs
gcloud app logs tail -s default

# Open app in browser
gcloud app browse

# Update app after changes
npm run build
gcloud app deploy
```

## Important for AI Seekho Competition
- Make sure billing is enabled with your free credits
- Choose region closest to you (asia-south1 for India)
- App Engine F1 instance is free tier eligible
- Monitor your credit usage in Google Cloud Console

## Need Help?
See DEPLOYMENT.md for detailed instructions and troubleshooting.
