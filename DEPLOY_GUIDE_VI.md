# 🚀 Hướng Dẫn Deploy Lên Vercel

Dự án của bạn đã được push lên GitHub và sẵn sàng deploy lên Vercel!

## 📍 GitHub Repository
```
https://github.com/NumberZeros/ai-football-rag
```

## 🎯 Các Bước Deploy

### Bước 1: Truy cập Vercel và Kết Nối GitHub

1. Vào https://vercel.com/new
2. Click "Continue with GitHub"
3. Đăng nhập GitHub nếu chưa đăng nhập
4. Authorize Vercel truy cập GitHub
5. Tìm kiếm và chọn `ai-football-rag` repository
6. Click "Import"

### Bước 2: Cấu Hình Environment Variables

Trên trang "Environment Variables", thêm các biến sau:

#### Required (Bắt Buộc)

```
OPENAI_API_KEY=sk-proj-...
OPENAI_MODEL=gpt-4o-mini

APIFOOTBALL_API_KEY=...
APIFOOTBALL_BASE_URL=https://v3.football.api-sports.io
APIFOOTBALL_REQUESTS_PER_MINUTE=8

SESSION_TTL_MS=7200000
```

#### Optional (Tùy Chọn)

```
TAVILY_API_KEY=tvly-...
```

### Bước 3: Deploy

1. Click "Deploy"
2. Chờ build hoàn thành (2-3 phút)
3. Your app is live! 🎉

---

## 🔑 Cách Lấy API Keys

### OpenAI API Key

1. Vào https://platform.openai.com/api-keys
2. Click "Create new secret key"
3. Copy key và lưu an toàn
4. **Lưu ý**: Có phí khi sử dụng (pay-as-you-go)

### API-Football Key

1. Vào https://www.api-football.com/
2. Đăng ký hoặc đăng nhập
3. Chọn "Get Started" (Free tier)
4. Copy API key
5. **Lưu ý**: Free tier có 100 request/day

### Tavily API Key (Optional)

1. Vào https://tavily.com/
2. Sign up miễn phí
3. Vào dashboard lấy API key
4. **Lưu ý**: 1000 searches/tháng miễn phí

---

## 🛠️ Vercel Configuration

File `vercel.json` đã được cấu hình tự động với:

```json
{
  "buildCommand": "pnpm build",
  "devCommand": "pnpm dev",
  "installCommand": "pnpm install",
  "framework": "nextjs",
  "nodeVersion": "18.x"
}
```

## 🔄 Auto-Deploy Setup

Sau khi deploy lần đầu:

- ✅ **Auto-Deploy**: Mỗi push lên `main` tự động deploy
- ✅ **Preview Deployments**: PR tạo preview URLs
- ✅ **Automatic Scaling**: Tự động scale theo traffic
- ✅ **SSL/HTTPS**: Automatic SSL certificates

## 📊 Monitoring & Management

Trong Vercel Dashboard:

- **Deployments**: Xem tất cả deployment history
- **Logs**: Real-time logs khi build và runtime
- **Analytics**: Performance metrics, traffic
- **Domains**: Setup custom domain (nếu cần)
- **Settings**: Cấu hình project

## 💡 Quick Links

| Mục | Link |
|-----|------|
| Vercel App | https://vercel.com/dashboard |
| GitHub Repo | https://github.com/NumberZeros/ai-football-rag |
| Deployment Guide | [docs/VERCEL_DEPLOYMENT.md](VERCEL_DEPLOYMENT.md) |
| Local Dev | `pnpm dev` |

## ⚠️ Lưu Ý Quan Trọng

### Free Tier Limitations

- API-Football: 100 request/day (đã cache 1 giờ)
- OpenAI: Tính phí theo usage (không free)
- Vercel: Free tier đủ cho hobby projects

### Session Storage

Hiện tại dùng in-memory storage (OK cho 1-2 người).

Nếu có nhiều users, upgrade lên Redis:

```env
REDIS_URL=redis://...
```

### Cost Estimation

| Service | Free Tier | Estimated Cost (Monthly) |
|---------|-----------|--------------------------|
| OpenAI | ❌ | $5-50 (tùy usage) |
| API-Football | ✅ 100/day | $20+ nếu upgrade |
| Tavily | ✅ 1000/month | $25+ nếu upgrade |
| Vercel | ✅ | Free ($20+ Pro tier) |

## 🚀 Sau Deploy

### Kiểm Tra

1. Vào Vercel deployment URL
2. Test generate report
3. Test chat streaming
4. Check API calls trong logs

### Optimization

Nếu chậm:
- Upgrade API-Football plan
- Increase API rate limit
- Add more caching
- Optimize LLM prompts

### Troubleshooting

| Vấn Đề | Giải Pháp |
|--------|-----------|
| Build fails | Check logs → check env vars → test locally |
| Timeout | Vercel free: 10s; Pro: 60s → upgrade hoặc optimize |
| API limits | Cache responses → reduce calls → upgrade plan |
| Session lost | Current: in-memory; Add Redis for production |

---

## 📝 Next Steps

1. ✅ Code pushed to GitHub
2. ✅ Vercel config ready
3. 👉 **Go to vercel.com/new and deploy!**
4. 👉 Add environment variables
5. 👉 Click Deploy
6. 👉 Test the app
7. 👉 Celebrate! 🎉

---

**Happy deploying!** 🚀

Nếu có issue, check [docs/VERCEL_DEPLOYMENT.md](VERCEL_DEPLOYMENT.md) hoặc GitHub issues.
