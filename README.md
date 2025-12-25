# ⚽ AI Football Match Report Generator

> AI-powered pre-match analysis system for football commentators and analysts

[![Next.js](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)

An intelligent match analysis tool that generates comprehensive pre-match reports using AI, real-time football data, and web search. Perfect for commentators, analysts, and football enthusiasts who need quick, accurate match insights.

## ✨ Features

- 🎯 **Comprehensive Analysis** - 11 analysis signals across 5 categories (Game Context, Team Form, Key Players, Tactical Battle, Psychology)
- ⚡ **Real-time Data** - Live fixtures, statistics, lineups, injuries, and standings from API-Football
- 💬 **Interactive Chat** - Follow-up Q&A with ChatGPT-style streaming responses
- 🔍 **Web Search Integration** - Optional Tavily integration for latest news and context
- 🎨 **Smooth Animations** - Polished UX with Framer Motion animations
- 📊 **Progress Tracking** - Real-time SSE-based generation progress
- 🌙 **Dark Mode** - Built-in dark mode support

## 🚀 Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/) 18+ with [pnpm](https://pnpm.io/)
- [API-Football](https://www.api-football.com/) API key (free tier available)
- [OpenAI](https://platform.openai.com/) API key

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/ai-football-rag.git
   cd ai-football-rag
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Configure environment variables**
   
   Create a \`.env.local\` file in the root directory:
   ```env
   # API-Football Configuration (Required)
   APIFOOTBALL_API_KEY=your_api_football_key_here
   APIFOOTBALL_BASE_URL=https://v3.football.api-sports.io
   APIFOOTBALL_REQUESTS_PER_MINUTE=8

   # OpenAI Configuration (Required)
   OPENAI_API_KEY=your_openai_key_here
   OPENAI_MODEL=gpt-4o-mini

   # Tavily Web Search (Optional - 1000 free searches/month)
   # TAVILY_API_KEY=tvly-your-key-here

   # Session Configuration
   SESSION_TTL_MS=7200000
   ```

4. **Run the development server**
   ```bash
   pnpm dev
   ```

5. **Open your browser**
   
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📖 Usage

1. **Browse Fixtures** - View upcoming matches filtered by top leagues
2. **Generate Report** - Click "Generate Report" for any match
3. **Track Progress** - Watch real-time progress as the AI analyzes
4. **Read Analysis** - Review comprehensive match insights
5. **Ask Questions** - Use the chat interface for follow-up queries

## 🏗️ Architecture

### Report Structure

The system generates reports based on 11 analysis signals across 5 categories:

| Category | Signals |
|----------|---------|
| **Game Context** | Home/Away advantage, Competition importance, Match conditions |
| **Team Context** | Recent form (5 games), Tactical trends |
| **Key Players** | Confirmed lineups, Injury reports |
| **Tactical Battle** | Managerial approach, Key matchups |
| **Psychological** | Motivation factors, H2H history |

### Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **AI/LLM**: [LangChain](https://js.langchain.com/) + [OpenAI](https://platform.openai.com/)
- **Data Source**: [API-Football](https://www.api-football.com/)
- **Search**: [Tavily](https://tavily.com/) (optional)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)

## 📚 Documentation

- [Animation & Streaming Guide](docs/ANIMATIONS.md) - Implementation details for UI animations
- [Web Search Setup](docs/TAVILY_SETUP.md) - Configure Tavily web search integration
- [Requirements Document](requirement.md) - Full project specifications
- [Report Blueprint](lib/report/blueprint.ts) - Report structure definition
- [Generation Pipeline](lib/orchestrator/generator.ts) - Analysis orchestration logic

## 🚢 Deployment

### Vercel (Recommended)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/ai-football-rag)

1. Push your code to GitHub
2. Import project in [Vercel](https://vercel.com/new)
3. Add environment variables
4. Deploy

### Other Platforms

The app can be deployed on any platform that supports Next.js:
- [Netlify](https://www.netlify.com/)
- [Railway](https://railway.app/)
- [AWS Amplify](https://aws.amazon.com/amplify/)
- Self-hosted with Docker

> **Production Note**: Consider using Redis or a database for session storage instead of the default in-memory storage.

## 🛠️ Development

### Project Structure

\`\`\`
├── app/                    # Next.js app router
│   ├── api/               # API routes
│   └── report/            # Report pages
├── components/            # React components
├── lib/
│   ├── api-football/     # API-Football client & proxy
│   ├── llm/              # LangChain chains & prompts
│   ├── orchestrator/     # Report generation logic
│   ├── report/           # Report structure
│   ├── search/           # Web search integration
│   └── session/          # Session management
└── docs/                  # Documentation
\`\`\`

### Scripts

\`\`\`bash
pnpm dev          # Start development server
pnpm build        # Build for production
pnpm start        # Start production server
pnpm lint         # Run ESLint
\`\`\`

## 🤝 Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [API-Football](https://www.api-football.com/) for comprehensive football data
- [OpenAI](https://openai.com/) for powerful language models
- [Tavily](https://tavily.com/) for web search capabilities
- [Vercel](https://vercel.com/) for hosting and deployment

## 📧 Contact

- Report Issues: [GitHub Issues](https://github.com/yourusername/ai-football-rag/issues)
- Discussions: [GitHub Discussions](https://github.com/yourusername/ai-football-rag/discussions)

---

<div align="center">
  <p>Built with ❤️ for the football community</p>
  <p>⭐ Star this repo if you find it useful!</p>
</div>
