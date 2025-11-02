# Call Center Frontend

Modern, responsive React + TypeScript frontend for call center management, optimized for S3 + CloudFront deployment.

## 🚀 Quick Start

```bash
npm install       # Install dependencies
npm run dev       # Development server
npm run build     # Build for production
```

## 📦 Tech Stack

- React 19 + TypeScript
- Vite (build tool)
- Tailwind CSS
- React Router
- TanStack Query
- Zustand (state)
- Axios

## 🔧 Configuration

Configure API endpoints in `.env`:

```env
VITE_API_BASE_URL=https://api.yourcallcenter.com
VITE_WS_BASE_URL=wss://api.yourcallcenter.com
```

## 📤 Deploy to S3

```bash
npm run build
aws s3 sync dist/ s3://your-bucket/ --delete
```

## ✨ Features

- Real-time dashboard
- Agent management
- Call monitoring
- Queue management
- CDR reports
- Contact/ticket management
- Live chat

Built with React + Vite + TypeScript
