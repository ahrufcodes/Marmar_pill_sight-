# 🔍 MARMAR PillSight - Next.js Version

## 🚀 Overview
A modern Next.js implementation of the MARMAR PillSight AI-powered medication discovery system. This application helps users find medications through natural voice and text conversations using MongoDB vector search and Google Cloud AI services.

## ✨ Features
- 🗣️ **Voice Input**: Real-time speech recognition and audio file upload
- 🔍 **Smart Search**: AI-powered medication matching with similarity scores
- 🤖 **Google Cloud AI**: Speech-to-Text and Text-to-Speech integration
- 📊 **Database Analytics**: Real-time statistics and insights
- 🎯 **Vector Search**: MongoDB Atlas vector similarity search
- 📱 **Responsive Design**: Modern, accessible interface
- 🔄 **Offline Mode**: Fallback functionality when services are unavailable

## 🛠️ Tech Stack
- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Node.js
- **Database**: MongoDB Atlas with Vector Search
- **AI Services**: Google Cloud Speech-to-Text, Text-to-Speech
- **UI Components**: shadcn/ui, Radix UI
- **Icons**: Lucide React

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- MongoDB Atlas account
- Google Cloud Platform account with AI services enabled

### Installation
\`\`\`bash
# Clone the repository
git clone <repository-url>
cd marmar-pillsight-nextjs

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your credentials

# Run the development server
npm run dev
\`\`\`

### Environment Setup
1. **MongoDB Atlas**: Create a cluster and get your connection string
2. **Google Cloud**: Set up Speech-to-Text and Text-to-Speech APIs
3. **Service Account**: Download your Google Cloud service account key

## 📁 Project Structure
\`\`\`
├── app/
│   ├── api/                 # API routes
│   │   ├── search/         # Medication search endpoint
│   │   ├── speech-to-text/ # Voice processing
│   │   ├── text-to-speech/ # Audio generation
│   │   └── system-status/  # Health checks
│   ├── globals.css         # Global styles
│   ├── layout.tsx          # Root layout
│   └── page.tsx            # Main application
├── components/
│   ├── voice-recorder.tsx  # Voice input component
│   ├── medication-results.tsx # Search results display
│   ├── database-stats.tsx  # Analytics dashboard
│   └── system-status.tsx   # Status indicators
└── lib/
    └── embeddings.ts       # Text embedding utilities
\`\`\`

## 🔧 Configuration

### MongoDB Setup
1. Create a MongoDB Atlas cluster
2. Set up vector search indexes for medication data
3. Import your pharmaceutical dataset
4. Configure connection string in environment variables

### Google Cloud Setup
1. Enable Speech-to-Text and Text-to-Speech APIs
2. Create a service account with appropriate permissions
3. Download the service account key JSON file
4. Set the path in your environment variables

## 🎯 Key Features

### Voice Processing
- Real-time microphone recording
- Audio file upload support
- Google Cloud Speech-to-Text integration
- Fallback mock transcription for development

### Medication Search
- Vector similarity search using embeddings
- Real-time results with confidence scores
- Comprehensive medication information display
- Search history and popular queries

### System Monitoring
- Real-time status indicators
- Database connection monitoring
- AI service availability checks
- Graceful fallback to demo data

## 🚀 Deployment

### Vercel (Recommended)
\`\`\`bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables in Vercel dashboard
\`\`\`

### Docker
\`\`\`bash
# Build image
docker build -t marmar-pillsight .

# Run container
docker run -p 3000:3000 marmar-pillsight
\`\`\`

## 🔒 Security Considerations
- Environment variables for sensitive credentials
- Input validation and sanitization
- Rate limiting on API endpoints
- Secure file upload handling
- CORS configuration for production

## 🧪 Testing
\`\`\`bash
# Run tests
npm test

# Run linting
npm run lint

# Type checking
npm run type-check
\`\`\`

## 📈 Performance Optimizations
- Server-side rendering with Next.js
- API route caching
- Image optimization
- Code splitting and lazy loading
- MongoDB connection pooling

## 🤝 Contributing
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License
MIT License - see LICENSE file for details

## 🆘 Support
- Check the troubleshooting guide
- Review API documentation
- Submit issues on GitHub
- Contact the development team

## 🔮 Future Enhancements
- Mobile app integration
- Multi-language support
- Advanced AI conversation features
- Healthcare provider integrations
- Prescription management
- Drug interaction warnings
