# Vercel Deployment Guide

## 🚀 Quick Deploy to Vercel

The easiest way to deploy this Next.js application is using the [Vercel Platform](https://vercel.com) from the creators of Next.js.

### Prerequisites

- GitHub account (repository must be public or you have access)
- Vercel account (free tier is available)
- API keys ready:
  - `OPENAI_API_KEY` from OpenAI
  - `APIFOOTBALL_API_KEY` from API-Football
  - `TAVILY_API_KEY` (optional) from Tavily

## 📋 Step-by-Step Deployment

### 1. Connect GitHub Repository

1. Go to [https://vercel.com/new](https://vercel.com/new)
2. Click "Continue with GitHub"
3. Authorize Vercel to access your GitHub account
4. Search for and select `ai-football-rag` repository
5. Click "Import"

### 2. Configure Environment Variables

On the "Environment Variables" page, add the following:

```
OPENAI_API_KEY=your_openai_key_here
OPENAI_MODEL=gpt-4o-mini

APIFOOTBALL_API_KEY=your_api_football_key_here
APIFOOTBALL_BASE_URL=https://v3.football.api-sports.io
APIFOOTBALL_REQUESTS_PER_MINUTE=8

TAVILY_API_KEY=tvly-your-key-here  (optional)

SESSION_TTL_MS=7200000
```

**How to get API keys:**

- **OpenAI**: https://platform.openai.com/api-keys
- **API-Football**: https://www.api-football.com/ (free tier: 100 req/day)
- **Tavily** (optional): https://tavily.com/ (free tier: 1000 searches/month)

### 3. Deploy

1. Click "Deploy"
2. Wait for build to complete (usually 2-3 minutes)
3. Your app is live! 🎉

Vercel will provide you with a URL like: `https://ai-football-rag.vercel.app`

## 🔄 Auto-Deploy on Push

Once deployed, Vercel automatically:
- Deploys when you push to `main` branch
- Creates preview deployments for pull requests
- Runs builds in isolated environments
- Scales automatically based on traffic

## 🔗 Custom Domain (Optional)

To use your own domain:

1. Go to your Vercel project settings
2. Click "Domains"
3. Enter your domain name
4. Follow DNS configuration instructions

## 📊 Monitoring & Logs

In your Vercel dashboard:
- **Deployments**: See all deployment history
- **Logs**: Real-time logs during builds and runtime
- **Analytics**: Performance metrics
- **Bandwidth**: Usage statistics

## ⚠️ Important Notes

### Free Tier Limitations

- Free API tiers have rate limits (see `.env.local.example`)
- API-Football free: 100 requests/day
- OpenAI: pay-as-you-go (charges apply)
- Tavily: 1000 searches/month free

### Production Recommendations

1. **Session Storage**
   - Default: In-memory (works for single instance)
   - Recommended: Use Redis or database for multi-instance deployments
   
   Add to environment variables:
   ```
   REDIS_URL=your_redis_connection_string
   ```

2. **Error Tracking** (Optional)
   - Consider adding Sentry for error monitoring
   - Add `SENTRY_DSN` environment variable

3. **Analytics** (Optional)
   - Enable Vercel Analytics for performance insights

4. **Database** (Optional)
   - If implementing user accounts, use PostgreSQL or MongoDB
   - Vercel offers Postgres integration

## 🐛 Troubleshooting

### Build Fails

**Check:**
- All required environment variables are set
- Node.js version is 18+
- pnpm is available (it's pre-installed)
- No TypeScript errors: `pnpm type-check`

**View logs:**
- Vercel shows detailed build logs
- Check "Deployments" → Build logs for errors

### API Errors in Production

**Free tier rate limits:**
- API-Football: 100 req/day → Use caching (already implemented)
- OpenAI: Watch API usage and billing
- Check error logs in Vercel

**Workarounds:**
- Upgrade API-Football plan
- Implement Redis caching (already has basic caching)
- Reduce default date window in fixtures

### Timeouts

If reports take too long to generate:
- Vercel timeout: 10 seconds for free tier, 60 seconds for Pro
- Consider upgrading to Pro tier
- Optimize report generation (reduce signal count)

## 💡 Tips

### Local Testing Before Deploy

```bash
# Test production build locally
pnpm build
pnpm start

# Verify environment variables
cat .env.local
```

### Cost Optimization

1. **Use free API tiers initially**
   - Monitor actual usage first
   - Upgrade plans as needed

2. **Cache API responses**
   - Already implemented in `lib/api-football/cache.ts`
   - 1-hour cache reduces API calls

3. **Optimize AI model**
   - `gpt-4o-mini` is recommended
   - Cheaper than `gpt-4o`
   - More capable than `gpt-3.5-turbo`

### Monitoring Costs

- **OpenAI**: Check usage at https://platform.openai.com/usage
- **API-Football**: Check remaining requests in dashboard
- **Vercel**: Free tier has enough for hobby projects

## 🆘 Support

- **Vercel Docs**: https://vercel.com/docs
- **Next.js Docs**: https://nextjs.org/docs
- **Issue Tracker**: GitHub Issues in this repository

## ✅ Deployment Checklist

Before going live in production:

- [ ] All environment variables set
- [ ] Test with real API keys in staging
- [ ] Verify report generation works
- [ ] Check chat streaming works
- [ ] Test on mobile devices
- [ ] Monitor error logs for 24 hours
- [ ] Set up alerts for errors
- [ ] Document your API limits and costs

---

**Happy deploying!** 🚀
