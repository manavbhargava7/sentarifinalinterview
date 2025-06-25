# Sentari - Transcript to Empathy Pipeline

Complete 13-step pipeline that transforms diary transcripts into empathic AI responses and maintains long-term user profiles.

## Features
- ✅ 13-step workflow with detailed logging
- 🧠 Mock GPT & embedding models 
- 👤 Profile tracking across entries
- 🎯 Empathic responses ≤55 chars
- 🔄 Carry-in detection & emotion flip analysis
- 🌐 Modern web UI

## Quick Start

```bash
# Install dependencies
npm install

# Run simulations
npm run simulate:first    # New user scenario
npm run simulate:hundred  # 100th entry scenario

# Start web server
npm start                 # Visit http://localhost:3000

# Development
npm run dev              # Development mode
npm test                 # Run tests
npm run lint             # Check code quality
```

## Architecture
- **Pipeline**: 13 sequential steps with logging
- **Storage**: In-memory Maps (no external DB required)
- **AI Services**: Mocked (mark [MOCK] in logs)
- **UI**: Single-page React-style interface

## Assumptions
- Embedding dimensions: 384 (MiniLM)
- Cosine similarity threshold: 0.86
- Response length target: ≤55 chars
- Mock latency: 100-500ms per step

Built for Sentari technical interview.