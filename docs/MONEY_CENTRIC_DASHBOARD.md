# Money-Centric Dashboard Design

## Overview
The xiXoi dashboard has been redesigned around a "money-first" principle where budget and spend visibility is the primary focus. This design scales from 1 to 100+ campaigns while keeping users in complete control.

## Design Philosophy

### The Problem We Solved
Previous dashboard issues:
- Global "Reload Budget" confused users (budget should be per-campaign)
- Spend metrics disconnected from campaigns
- Couldn't tell which campaign was burning money
- AI insights floating without context
- No quick budget actions per campaign

### The Solution: 4-Section Layout

## Section 1: Global Spend Summary (Top)
**Purpose:** Instant situational awareness

**Metrics Displayed:**
- Today's Spend - Real-time daily spending
- This Month - Month-to-date total
- Active Campaigns - Count with paused status
- Total Remaining Budget - Aggregated across all campaigns

**Benefits:**
- One glance shows financial status
- No need to calculate mentally
- Alerts when budgets running low

## Section 2: Campaign Cards (Central Focus)
**Purpose:** Per-campaign budget control

### Left Side: Spend Metrics
- **Spend Today** - Current day's spending
- **Spend This Month** - Month-to-date for this campaign
- **Total Spent** - All-time spending
- **Remaining Budget** - How much left
- **Daily Budget** - Configured daily limit
- **End Date** - When campaign ends

### Right Side: Performance Preview
- **CTR** - Click-through rate
- **CPM** - Cost per thousand impressions
- **CPC** - Cost per click  
- **ROAS** - Return on ad spend

### Status Badges
- 🟢 **Active** - Running normally
- ⏸ **Paused** - Temporarily stopped
- ⚠️ **Needs Budget** - Budget running low (< 2 days remaining)
- ⚡ **High Spend Today** - Spending 20%+ over daily budget
- ⏹ **Ended** - Campaign completed

### Quick Budget Actions
Users can instantly add budget with one click:
- **+$20** - Quick micro-top-up
- **+$50** - Standard reload
- **+$100** - Larger campaigns
- **Custom** - Dropdown with $200, $500, $1,000

**Why Per-Campaign?**
- Users think "I want to spend more on THIS ad"
- Not "I want a global pot of money"
- Direct cause-and-effect relationship
- Faster decision-making

## Section 3: AI Recommendations (Inline Per Campaign)
**Purpose:** Contextual, actionable suggestions

### Recommendation Types

#### High Priority (Red Badge)
- **Budget Running Low** - Less than 2 days remaining
- **Low ROAS** - Below breakeven, needs attention
- **Excellent ROAS** - Scale opportunity

#### Medium Priority (Default Badge)
- **High Spend Velocity** - Spending faster than expected
- **CPM Rising** - Cost increasing, refresh creative
- **Strong CTR** - Good engagement, consider scaling

#### Low Priority (Gray Badge)
- **Under-Spending** - Not using full daily budget
- **Platform Suggestion** - Try different channel

**Benefits:**
- Recommendations tied to specific campaigns
- No generic global advice
- Immediate context of "why"
- Priority-based action

## Section 4: Account Performance Insights (Bottom)
**Purpose:** Executive summary

### Metrics Shown
- **Total Spend** - All campaigns combined
- **Total Revenue** - Tracked conversions
- **Conversions** - Total conversion count
- **Overall ROAS** - Account-wide return

### Highlighted Performers
- **Best Performer** - Campaign with highest ROAS (green)
- **Needs Attention** - Campaign with lowest ROAS (orange)

**Benefits:**
- Portfolio view of all campaigns
- Identify winners and losers quickly
- Data-driven scaling decisions

## Budget Model: Campaign-First

### Previous (Problematic)
```
Global Wallet → All campaigns draw from it
```
Issues:
- Hard to allocate
- No campaign-specific control
- Confusing tracking

### New (Clear)
```
Campaign Budget = Direct allocation
```
Benefits:
- Each campaign has its own budget
- Add budget directly to what needs it
- Clear remaining balance per campaign
- No mental math required

## Technical Implementation

### Database Schema
```sql
campaigns table:
- daily_budget (per-day limit)
- lifetime_budget (total allocation)
- total_spent (running total)
```

### Real-Time Calculations
- Remaining = lifetime_budget - total_spent
- Today's spend from campaign_spend_daily
- Month's spend from aggregated daily records

### Performance Metrics
- CTR, CPM, CPC, ROAS from campaign_performance table
- Rolling 7-day average for stability
- Per-platform breakdowns available in analytics

## Key Components

### `GlobalSpendSummary.tsx`
- Aggregates all campaign spending
- Queries campaign_spend_daily for today/month
- Counts active vs paused campaigns
- Calculates total remaining budget

### `EnhancedCampaignCard.tsx`
- Displays campaign with spend focus
- Status badges with smart coloring
- Quick budget action buttons (+$20, +$50, +$100)
- Performance metrics preview
- Pause/Resume/Edit actions

### `CampaignAIRecommendations.tsx`
- Analyzes campaign metrics
- Generates contextual suggestions
- Priority-based recommendations
- Inline display per campaign

### `AccountPerformanceInsights.tsx`
- Portfolio-level view
- Best/worst performer identification
- Overall ROAS calculation
- Executive summary format

## User Experience Flow

### First Visit
1. See 4-metric summary (all $0)
2. "Create Your First Campaign" CTA
3. After creation, see single campaign card
4. Add budget directly to that campaign

### Multiple Campaigns
1. Top summary shows aggregated spend
2. Scroll through campaign cards
3. Each card shows its own budget status
4. AI recommendations appear inline
5. Bottom section shows portfolio view

### Budget Management
1. See "Needs Budget" warning on card
2. Click +$50 for instant reload
3. OR click Custom → Choose amount
4. Campaign updates immediately
5. Summary refreshes automatically

## Design Principles Applied

### 1. Money First
Every view prioritizes spend visibility before performance metrics.

### 2. Contextual Actions
Buttons appear where they're needed (budget on cards, not globally).

### 3. Progressive Disclosure
See summary → drill into campaigns → view full analytics if needed.

### 4. Smart Defaults
Quick actions ($20/$50/$100) cover 90% of reload scenarios.

### 5. Status-Driven UI
Visual indicators (colors, badges, icons) communicate state instantly.

## Scaling Considerations

### Works for 1 Campaign
- Clear budget status
- Simple actions
- No complexity

### Works for 10 Campaigns
- Summary keeps overview manageable
- Per-campaign controls prevent confusion
- AI suggestions stay relevant

### Works for 100+ Campaigns
- Summary aggregates cleanly
- Search/filter can be added
- Portfolio view shows top/bottom performers
- Bulk actions possible in future

## Future Enhancements

### Phase 2
- Auto-top-up toggle per campaign
- Budget alerts via email/SMS
- Spend forecasting ("at this rate, budget runs out in X days")

### Phase 3
- Cross-campaign budget reallocation
- AI-powered budget suggestions
- ROI-based automatic scaling

### Phase 4
- Multi-user budget approval workflows
- Spending limits per user role
- Advanced portfolio optimization

## Summary

The money-centric dashboard solves the core UX problem: **users need to know where their money is going and control it easily**. By making budget per-campaign and surfacing spend metrics prominently, we create a system that scales while remaining intuitive.

**Key Takeaway:** Budget is not a global pool—it's allocated per campaign, giving users direct control and clear visibility.
