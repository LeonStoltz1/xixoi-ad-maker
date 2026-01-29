
# Plan: Further Optimizations for URL-to-Ad Flow

## Current State Summary

After reviewing the codebase, here's what's already implemented:
- Parallel AI image generation (Promise.all)
- Multi-step progress indicator
- Image source badges (AI vs Website)
- Retry button for failed generations
- Request queue with rate limiting
- Basic URL extraction (og:image, twitter:image, img tags)

---

## Additional Optimization Opportunities

### 1. URL Content Caching (Database-Level)

**Problem**: If a user re-processes the same URL, we re-fetch and re-extract every time.

**Solution**: Add a `url_extractions_cache` table to store extracted content for 24-48 hours.

| Column | Type | Purpose |
|--------|------|---------|
| url_hash | text (primary) | MD5 hash of URL |
| url | text | Original URL |
| images | jsonb | Extracted image URLs |
| content | text | Page title + description |
| created_at | timestamp | For cache expiry |

**Benefit**: Instant response for repeated URLs, reduced edge function calls.

---

### 2. Use Firecrawl for Robust Extraction

**Problem**: Basic regex extraction misses JavaScript-rendered content, SPAs, and complex sites.

**Solution**: Integrate Firecrawl connector for professional-grade web scraping.

| Feature | Current (regex) | With Firecrawl |
|---------|----------------|----------------|
| JavaScript-rendered pages | No | Yes |
| Anti-bot bypass | No | Yes |
| SPA support | No | Yes |
| Structured data extraction | Basic | Full JSON-LD, microdata |

**Trade-off**: Requires user to connect Firecrawl (has free tier).

---

### 3. Smarter AI Image Generation

**Problem**: AI generates generic images without variation directives.

**Solution**: Add style variety prompts for parallel generations:
- Image 1: "Modern, clean product photography style"
- Image 2: "Lifestyle context showing product in use"
- Image 3 (if fallback): "Bold, attention-grabbing ad creative style"

**Benefit**: More variety in generated options without additional API calls.

---

### 4. Progressive Image Loading with Blur Placeholders

**Problem**: Images appear suddenly, causing visual jank.

**Solution**: Add low-quality blur-up effect:
1. Show skeleton/placeholder immediately
2. Load image in background
3. Fade in when ready

**Implementation**: Use `loading="lazy"` + CSS blur transition.

---

### 5. Prefetch Targeting Data

**Problem**: After selecting image, user waits again for targeting + ad copy generation.

**Solution**: Start generating targeting suggestions in parallel with image generation, not after.

**Current Flow**:
```text
Extract URL → Wait → Generate Images → Wait → User Selects → Generate Targeting → Wait
```

**Optimized Flow**:
```text
Extract URL → [Generate Images + Generate Targeting in parallel] → User Selects → Ready
```

**Benefit**: Eliminates entire waiting step (~3-5 seconds saved).

---

### 6. Local Storage Draft Saving

**Problem**: If user navigates away or refreshes, all progress is lost.

**Solution**: Auto-save extraction state to localStorage:
- URL entered
- Extracted images
- Selected image
- Generated content

**Recovery**: On mount, check for saved draft and offer to restore.

---

### 7. Image Quality Scoring

**Problem**: All images shown equally, user must visually assess quality.

**Solution**: Add quality indicators:
- Image dimensions display (e.g., "1200×628" = good, "300×300" = small)
- Aspect ratio badge ("16:9 ✓" for ideal ad ratio)
- Recommended badge for best-fit images

**Implementation**: Parse image dimensions from metadata or onLoad event.

---

### 8. Cancel In-Flight Requests

**Problem**: If user clicks "Extract" twice or navigates away, orphaned requests continue.

**Solution**: Use AbortController to cancel previous requests when starting new ones.

```typescript
const abortController = useRef<AbortController | null>(null);

// On new extraction
abortController.current?.abort();
abortController.current = new AbortController();
```

---

## Implementation Priority

| Priority | Optimization | Impact | Effort |
|----------|--------------|--------|--------|
| 1 | Prefetch targeting in parallel | High (saves 3-5s) | Low |
| 2 | URL content caching | Medium (repeat users) | Medium |
| 3 | AI prompt variety | Medium (better options) | Low |
| 4 | Draft auto-save | Medium (UX safety net) | Low |
| 5 | Progressive image loading | Low (polish) | Low |
| 6 | Image quality scoring | Low (polish) | Medium |
| 7 | AbortController cleanup | Low (edge case) | Low |
| 8 | Firecrawl integration | High (if needed) | High |

---

## Recommended Immediate Actions

**Quick wins (can do now):**
1. Prefetch targeting in parallel with image generation
2. Add style variety to AI image prompts
3. Auto-save draft to localStorage

**Future enhancements:**
4. URL extraction caching table
5. Firecrawl integration for complex sites

---

## Technical Changes Summary

| File | Changes |
|------|---------|
| `src/components/campaign/URLImport.tsx` | Parallel targeting, draft saving, abort handling, quality badges |
| `supabase/functions/process-url-content/index.ts` | Check cache before fetching, store results |
| `supabase/functions/generate-image-from-description/index.ts` | Add style parameter for variety |
| New migration | Create `url_extractions_cache` table |
