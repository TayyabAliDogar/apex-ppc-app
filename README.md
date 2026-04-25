# Apex PPC - Peak Performance Analytics

> Transform PPC complexity into actionable clarity in under 5 minutes daily

A powerful, AI-driven analytics platform for Amazon PPC advertisers. Apex PPC helps you identify wasted spend, optimize campaigns, and maximize ROAS with intelligent insights and automated recommendations.

## ✨ Features

### 📊 Financial Dashboard
- Real-time ROAS, ACoS, and TACoS tracking
- 90-day performance overview with interactive charts
- Spend vs Sales analytics with trend visualization
- Campaign breakdown and performance metrics

### 🎯 AI-Powered Insights
- **Bleeding Keyword Detection**: Automatically identify keywords draining your budget
- **Smart Bid Recommendations**: AI-suggested bid adjustments based on performance
- **Wasted Spend Analysis**: Pinpoint exactly where your money is going
- **Performance Alerts**: Get notified about underperforming campaigns

### 📝 Listing Optimization
- AI-powered Amazon listing editor
- Competitor analysis with real ASIN data
- SEO score calculation
- Automated title, bullet points, and description generation
- Copy-paste ready content for Amazon Seller Central

### 📈 Performance Hub
- Campaign intelligence dashboard
- TACoS calculator with historical tracking
- Budget pacing monitor
- Multi-campaign comparison tools

### 🎨 Modern UI/UX
- Beautiful dark and light themes
- Smooth animations and transitions
- Responsive design for all devices
- Intuitive navigation and workflows

## 🚀 Tech Stack

**Frontend:**
- React 19 with Hooks
- Vite for blazing-fast builds
- Tailwind CSS for styling
- Framer Motion for animations
- Recharts for data visualization
- Lucide React for icons

**Backend:**
- Express.js server
- Node.js runtime
- Amazon product scraping API

**Data & Storage:**
- IndexedDB with Dexie.js
- Local-first architecture
- Automatic backup system
- Excel/CSV export capabilities

**AI Integration:**
- Google Gemini 2.5 Flash
- Intelligent caching system
- Rate limiting and quota management

## 📋 Prerequisites

- Node.js 18+ and npm
- Modern web browser (Chrome, Firefox, Safari, Edge)
- Google Gemini API key (get one at [aistudio.google.com](https://aistudio.google.com))

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd vibe-ppc-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables** (optional)
   ```bash
   # Create .env file
   VITE_GEMINI_API_KEY=your_api_key_here
   ```

4. **Start the development server**
   ```bash
   # Frontend only
   npm run dev

   # Frontend + Backend (recommended)
   npm run dev:all

   # With network access (for mobile testing)
   npm run dev:all:network
   ```

5. **Open your browser**
   - Navigate to `http://localhost:5173` (or the port shown in terminal)
   - The app will automatically reload on code changes

## 🎯 Quick Start Guide

### 1. Upload Your Amazon Report
- Go to **Upload** section
- Download your bulk report from Amazon Advertising Console
- Drag and drop the CSV file or click to browse
- Wait for processing (usually 5-10 seconds)

### 2. View Your Dashboard
- Navigate to **Dashboard** to see your metrics
- Switch between 7d, 30d, 90d, or All Time views
- Explore interactive charts and visualizations

### 3. Get AI Insights
- Visit **AI Insights** section
- Review bleeding keywords automatically detected
- See bid recommendations and wasted spend analysis
- Export insights for your team

### 4. Optimize Your Listings
- Go to **Listing Editor**
- Enter your product ASIN
- Add competitor ASINs for analysis
- Click **AI Refine** to generate optimized content
- Copy and paste to Amazon Seller Central

### 5. Configure Settings
- Navigate to **Settings**
- Add your Gemini API key for AI features
- Export backups regularly
- Manage your data and preferences

## ⚙️ Configuration

### API Keys

**Google Gemini API:**
1. Visit [Google AI Studio](https://aistudio.google.com)
2. Create a new API key
3. Add it in Settings → API Configuration
4. Or set `VITE_GEMINI_API_KEY` in `.env` file

### Data Management

**Automatic Backups:**
- Data is stored locally in your browser
- Use "Export Backup" in sidebar for Excel backups
- Backups include all campaigns, insights, and settings

**Storage Limits:**
- Browser storage: ~50MB typical, up to 1GB+ with persistent storage
- Automatic compression for large datasets
- Storage warnings when approaching limits

## 🌐 Deployment

### Deploy to Google Cloud Platform

1. **Install Google Cloud SDK**
   ```bash
   # Download from: https://cloud.google.com/sdk/docs/install
   ```

2. **Initialize and deploy**
   ```bash
   # Login
   gcloud auth login

   # Set project
   gcloud config set project YOUR_PROJECT_ID

   # Create App Engine app
   gcloud app create --region=asia-south1

   # Build and deploy
   npm run build
   gcloud app deploy
   ```

3. **Access your app**
   - Your app will be live at: `https://YOUR_PROJECT_ID.appspot.com`

### Deploy to Other Platforms

**Vercel:**
```bash
npm install -g vercel
vercel
```

**Netlify:**
```bash
npm run build
# Drag and drop the 'dist' folder to Netlify
```

## 📁 Project Structure

```
vibe-ppc-app/
├── src/
│   ├── components/          # React components
│   │   ├── dashboard/       # Dashboard views
│   │   ├── charts/          # Chart components
│   │   ├── layout/          # Layout components (Header, Sidebar)
│   │   └── ui/              # Reusable UI components
│   ├── lib/                 # Utilities and helpers
│   │   ├── db.js            # Database (Dexie/IndexedDB)
│   │   ├── gemini.js        # AI integration
│   │   ├── export.js        # Data export utilities
│   │   └── animations.js    # Animation configs
│   ├── store/               # State management (Zustand)
│   ├── contexts/            # React contexts (Theme)
│   └── index.css            # Global styles
├── server.js                # Express backend server
├── app.yaml                 # Google Cloud config
├── deploy.bat               # Windows deployment script
└── package.json             # Dependencies and scripts
```

## 🔧 Available Scripts

```bash
# Development
npm run dev              # Start frontend only
npm run dev:all          # Start frontend + backend
npm run dev:network      # Start with network access
npm run server           # Start backend only

# Production
npm run build            # Build for production
npm run preview          # Preview production build
npm start                # Start production server

# Deployment
npm run gcp-build        # Build for Google Cloud
npm run tunnel           # Create public URL with ngrok

# Code Quality
npm run lint             # Run ESLint
```

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is private and proprietary. All rights reserved.

## 🐛 Known Issues

- Large CSV files (>10MB) may take longer to process
- Amazon scraping may be rate-limited - use responsibly
- AI features require active internet connection

## 🔮 Roadmap

- [ ] Multi-marketplace support (UK, DE, FR, etc.)
- [ ] Automated campaign rules and scheduling
- [ ] Team collaboration features
- [ ] Mobile app (iOS/Android)
- [ ] Advanced forecasting with ML models
- [ ] Integration with Amazon Advertising API

## 💡 Tips & Best Practices

1. **Regular Backups**: Export your data weekly
2. **API Quota**: Monitor your Gemini API usage in Settings
3. **Performance**: Clear old data periodically for better performance
4. **Security**: Never share your API keys publicly
5. **Updates**: Keep your browser updated for best performance

## 📞 Support

For issues, questions, or feature requests:
- Open an issue on GitHub
- Check existing issues for solutions
- Review the documentation

## 🙏 Acknowledgments

- Built with React and Vite
- Powered by Google Gemini AI
- Icons by Lucide
- Charts by Recharts
- Animations by Framer Motion

---

**Made with ❤️ for Amazon PPC advertisers**

*Transform your advertising data into actionable insights*
