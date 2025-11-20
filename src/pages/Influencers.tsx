import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useNavigate } from "react-router-dom";
import { DollarSign, Users, TrendingUp, Check, Zap, Gift } from "lucide-react";
import { Footer } from "@/components/Footer";
import { AppLayout } from "@/components/layout/AppLayout";
import { BannerDownload } from "@/components/BannerDownload";

export default function Influencers() {
  const navigate = useNavigate();

  return (
    <AppLayout title="Join the xiXoi™ Affiliate Program">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-background to-primary/5 py-24 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center space-y-6">
            <h1 className="text-4xl md:text-5xl lg:text-7xl font-bold font-heading">
              Join the xiXoi™ <span className="text-primary">Affiliate Program</span>
            </h1>
            <p className="text-lg md:text-xl lg:text-2xl text-muted-foreground max-w-3xl mx-auto">
              Earn 20% lifetime recurring commission on every customer you refer. No caps. No limits.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
              <Button size="lg" onClick={() => navigate('/auth')}>
                Start Earning Now
              </Button>
              <Button size="lg" variant="outline" onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}>
                Learn More
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-6 bg-card border-y border-border">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div className="space-y-2">
              <div className="text-3xl md:text-4xl font-bold text-primary">20%</div>
              <div className="text-base md:text-lg font-medium">Lifetime Commission</div>
              <div className="text-sm text-muted-foreground">On all plans, forever</div>
            </div>
            <div className="space-y-2">
              <div className="text-3xl md:text-4xl font-bold text-primary">$99-299</div>
              <div className="text-base md:text-lg font-medium">Monthly Plans</div>
              <div className="text-sm text-muted-foreground">Earn $19.80-$59.80/mo per referral</div>
            </div>
            <div className="space-y-2">
              <div className="text-3xl md:text-4xl font-bold text-primary">30 Days</div>
              <div className="text-base md:text-lg font-medium">Cookie Duration</div>
              <div className="text-sm text-muted-foreground">Get credit for all clicks</div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">How It Works</h2>
            <p className="text-lg md:text-xl text-muted-foreground">Simple, transparent, and profitable</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card>
              <CardHeader>
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <CardTitle>1. Sign Up & Get Your Link</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Create your free affiliate account and get your unique referral link instantly. No approval process needed.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Zap className="w-6 h-6 text-primary" />
                </div>
                <CardTitle>2. Share with Your Audience</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Share xiXoi™ with your followers on social media, blog, YouTube, or newsletter. We track everything automatically.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <DollarSign className="w-6 h-6 text-primary" />
                </div>
                <CardTitle>3. Earn Recurring Income</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Earn 20% commission every month your referrals stay subscribed. Request payouts anytime you reach $100.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Commission Structure */}
      <section className="py-20 px-6 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Commission Structure</h2>
            <p className="text-xl text-muted-foreground">Transparent pricing, generous rewards</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="border-2">
              <CardHeader>
                <CardTitle className="text-2xl">Pro Plan</CardTitle>
                <CardDescription>Most Popular</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="text-3xl font-bold">$99<span className="text-lg text-muted-foreground">/mo</span></div>
                  <div className="text-primary text-2xl font-bold">= $19.80/mo</div>
                  <div className="text-sm text-muted-foreground">Your commission (20%)</div>
                </div>
                <div className="pt-4 space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-primary" />
                    <span>20% lifetime recurring</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-primary" />
                    <span>$237.60/year per referral</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-primary">
              <CardHeader>
                <div className="flex items-center gap-2 mb-2">
                  <Gift className="w-5 h-5 text-primary" />
                  <span className="text-sm font-semibold text-primary">Highest Earning</span>
                </div>
                <CardTitle className="text-2xl">Elite Plan</CardTitle>
                <CardDescription>Advanced Features</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="text-3xl font-bold">$199<span className="text-lg text-muted-foreground">/mo</span></div>
                  <div className="text-primary text-2xl font-bold">= $39.80/mo</div>
                  <div className="text-sm text-muted-foreground">Your commission (20%)</div>
                </div>
                <div className="pt-4 space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-primary" />
                    <span>20% lifetime recurring</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-primary" />
                    <span>$477.60/year per referral</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2">
              <CardHeader>
                <CardTitle className="text-2xl">Agency Plan</CardTitle>
                <CardDescription>For Teams</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="text-3xl font-bold">$299<span className="text-lg text-muted-foreground">/mo</span></div>
                  <div className="text-primary text-2xl font-bold">= $59.80/mo</div>
                  <div className="text-sm text-muted-foreground">Your commission (20%)</div>
                </div>
                <div className="pt-4 space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-primary" />
                    <span>20% lifetime recurring</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-primary" />
                    <span>$717.60/year per referral</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="mt-12 text-center">
            <Card className="max-w-2xl mx-auto bg-primary/5 border-primary/20">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 justify-center mb-3">
                  <TrendingUp className="w-6 h-6 text-primary" />
                  <h3 className="text-xl font-bold">Example: 10 Active Referrals</h3>
                </div>
                <p className="text-3xl font-bold text-primary mb-2">$198-$598/month</p>
                <p className="text-muted-foreground">$2,376-$7,176/year passive income</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Why Partner with xiXoi™?</h2>
            <p className="text-xl text-muted-foreground">Built for affiliates who want to maximize earnings</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-primary" />
                  Lifetime Recurring Commission
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Unlike one-time payouts, you earn 20% every single month your referral stays subscribed. The longer they stay, the more you earn.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-primary" />
                  No Earnings Cap
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Refer 10 customers or 1,000 customers - there's no limit to how much you can earn. Scale your income infinitely.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-primary" />
                  High Conversion Product
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  xiXoi™ solves real problems for businesses. Our AI-powered ad creation platform converts visitors into paying customers.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-primary" />
                  30-Day Cookie Window
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Your referral link stays active for 30 days. If someone clicks your link and signs up within a month, you get credit.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-primary" />
                  Real-Time Dashboard
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Track your clicks, conversions, earnings, and payouts in real-time. Full transparency into your affiliate performance.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-primary" />
                  Fast Monthly Payouts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Request payouts anytime you reach $100. We process payments quickly via Stripe Connect to your bank account.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Marketing Resources */}
      <section className="py-20 px-6 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Marketing Resources</h2>
            <p className="text-xl text-muted-foreground">Ready-to-use promotional materials for affiliates</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            {/* Pre-Written Social Posts */}
            <Card>
              <CardHeader>
                <CardTitle>Social Media Posts</CardTitle>
                <CardDescription>Copy and paste these posts to your social channels</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm font-mono mb-2">
                    "Just discovered xiXoi™ - creates professional ads in 60 seconds using AI. No design skills needed. 
                    Perfect for small businesses and creators. Try it: [your-link]"
                  </p>
                  <Button size="sm" variant="outline" onClick={() => {
                    navigator.clipboard.writeText("Just discovered xiXoi™ - creates professional ads in 60 seconds using AI. No design skills needed. Perfect for small businesses and creators.");
                  }}>
                    Copy Post
                  </Button>
                </div>
                
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm font-mono mb-2">
                    "Stop wasting time on ad creation. xiXoi™ uses AI to generate Meta, TikTok, and Google ads automatically. 
                    Upload your product → AI creates the ads → Publish instantly. Get started: [your-link]"
                  </p>
                  <Button size="sm" variant="outline" onClick={() => {
                    navigator.clipboard.writeText("Stop wasting time on ad creation. xiXoi™ uses AI to generate Meta, TikTok, and Google ads automatically. Upload your product → AI creates the ads → Publish instantly.");
                  }}>
                    Copy Post
                  </Button>
                </div>

                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm font-mono mb-2">
                    "AI-powered advertising for every human. xiXoi™ automates your entire ad workflow - from creative generation 
                    to multi-platform publishing. No marketing degree required: [your-link]"
                  </p>
                  <Button size="sm" variant="outline" onClick={() => {
                    navigator.clipboard.writeText("AI-powered advertising for every human. xiXoi™ automates your entire ad workflow - from creative generation to multi-platform publishing. No marketing degree required.");
                  }}>
                    Copy Post
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Email Templates */}
            <Card>
              <CardHeader>
                <CardTitle>Email Templates</CardTitle>
                <CardDescription>Professional email copy ready to send</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-xs font-semibold mb-2">Subject: Create Professional Ads in 60 Seconds</p>
                  <p className="text-sm font-mono mb-2">
                    Hey [Name],<br/><br/>
                    I wanted to share xiXoi™ with you - it's an AI platform that creates professional ads in under a minute.<br/><br/>
                    Upload your product image → AI generates ad copy and variants → Publish to Meta, TikTok, Google instantly.<br/><br/>
                    No design skills. No marketing degree. Just results.<br/><br/>
                    Try it here: [your-link]
                  </p>
                  <Button size="sm" variant="outline" onClick={() => {
                    navigator.clipboard.writeText("Hey [Name],\n\nI wanted to share xiXoi™ with you - it's an AI platform that creates professional ads in under a minute.\n\nUpload your product image → AI generates ad copy and variants → Publish to Meta, TikTok, Google instantly.\n\nNo design skills. No marketing degree. Just results.\n\nTry it here: [your-link]");
                  }}>
                    Copy Email
                  </Button>
                </div>

                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-xs font-semibold mb-2">Subject: Stop Paying Agencies for Ad Creation</p>
                  <p className="text-sm font-mono mb-2">
                    Hi [Name],<br/><br/>
                    Paying $2,000-$5,000/month for ad creation? xiXoi™ does it for $49-$149/month using AI.<br/><br/>
                    • Generate unlimited ad variants<br/>
                    • Auto-optimize targeting<br/>
                    • Publish to 5 platforms instantly<br/><br/>
                    See it in action: [your-link]
                  </p>
                  <Button size="sm" variant="outline" onClick={() => {
                    navigator.clipboard.writeText("Hi [Name],\n\nPaying $2,000-$5,000/month for ad creation? xiXoi™ does it for $49-$149/month using AI.\n\n• Generate unlimited ad variants\n• Auto-optimize targeting\n• Publish to 5 platforms instantly\n\nSee it in action: [your-link]");
                  }}>
                    Copy Email
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Banner Graphics */}
          <Card>
            <CardHeader>
              <CardTitle>Banner Graphics & Assets</CardTitle>
              <CardDescription>AI-generated affiliate banners ready to download</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <BannerDownload 
                  size="1200x628"
                  title="1200x628 Social Banner"
                  description="Perfect for Facebook, LinkedIn, Twitter"
                />
                
                <BannerDownload 
                  size="1080x1080"
                  title="1080x1080 Instagram Square"
                  description="Instagram feed and carousel posts"
                />
                
                <BannerDownload 
                  size="1080x1920"
                  title="1080x1920 Story Format"
                  description="Instagram, TikTok, Facebook Stories"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 px-6">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Frequently Asked Questions</h2>
            <p className="text-xl text-muted-foreground">Everything you need to know about our affiliate program</p>
          </div>

          <Accordion type="single" collapsible className="w-full space-y-4">
            <AccordionItem value="item-1" className="bg-card border rounded-lg px-6">
              <AccordionTrigger className="text-left font-semibold">
                How much can I earn as an affiliate?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                You earn 20% recurring commission on all plans. For the Pro plan ($99/mo), that's $19.80/month per referral. 
                For Elite ($199/mo), that's $39.80/month. For Agency ($299/mo), that's $59.80/month. There's no cap on how many
                referrals you can make or how much you can earn. If you refer 100 customers on the Pro plan, that's $2,970/month 
                in recurring income ($35,640/year).
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-2" className="bg-card border rounded-lg px-6">
              <AccordionTrigger className="text-left font-semibold">
                How long do I earn commission for each referral?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Forever! As long as your referral remains a paying customer, you'll continue earning 20% commission every single month. 
                This is a lifetime recurring commission, not a one-time payment. If a customer stays for 2 years, you earn commission
                for all 24 months.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-3" className="bg-card border rounded-lg px-6">
              <AccordionTrigger className="text-left font-semibold">
                When and how do I get paid?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                You can request a payout anytime your balance reaches $100 or more. We process payouts via Stripe Connect, 
                which deposits directly into your bank account. Most payments are processed within 3-5 business days of your 
                payout request. You'll receive an email confirmation when your payout is processed.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-4" className="bg-card border rounded-lg px-6">
              <AccordionTrigger className="text-left font-semibold">
                How does the 30-day cookie work?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                When someone clicks your affiliate link, a cookie is stored in their browser for 30 days. If they sign up 
                for xiXoi™ anytime within those 30 days, you get credit for the referral and earn commission. This gives 
                your audience time to think about their purchase while still ensuring you get credit.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-5" className="bg-card border rounded-lg px-6">
              <AccordionTrigger className="text-left font-semibold">
                Do I need to be approved to join?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                No! Anyone can join the xiXoi™ affiliate program instantly. Simply sign up, get your unique referral link, 
                and start promoting. There's no application process, no approval wait time, and no minimum follower requirements.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-6" className="bg-card border rounded-lg px-6">
              <AccordionTrigger className="text-left font-semibold">
                What if my referral upgrades or downgrades their plan?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                You'll continue earning 20% commission based on their current plan. If they upgrade from Pro ($99/mo) to 
                Elite ($199/mo), your commission increases from $19.80/mo to $39.80/mo. If they downgrade, your commission 
                adjusts accordingly. You always earn 20% of whatever they're currently paying.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-7" className="bg-card border rounded-lg px-6">
              <AccordionTrigger className="text-left font-semibold">
                Can I see my referral stats and earnings?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Yes! Your affiliate dashboard shows real-time data including total referrals, active subscriptions, 
                total earnings, available balance, and payout history. You can track exactly how your affiliate business 
                is performing at any time.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-8" className="bg-card border rounded-lg px-6">
              <AccordionTrigger className="text-left font-semibold">
                What happens if a customer cancels?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                If a customer cancels their subscription, you'll stop earning commission from that customer going forward. 
                However, you keep all the commission you've already earned from them. There are no chargebacks or clawbacks. 
                If they resubscribe later, you'll start earning commission again.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-9" className="bg-card border rounded-lg px-6">
              <AccordionTrigger className="text-left font-semibold">
                Do you provide marketing materials?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Yes! Scroll up to the Marketing Resources section to find pre-written social media posts, email templates, 
                and promotional copy you can use immediately. Downloadable banner graphics and brand assets are coming soon. 
                You can also create your own content - many affiliates find success with video reviews, tutorials, 
                or blog posts about how xiXoi™ helps businesses create better ads.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-10" className="bg-card border rounded-lg px-6">
              <AccordionTrigger className="text-left font-semibold">
                Is there a minimum payout threshold?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Yes, the minimum payout is $100. Once your earnings reach $100, you can request a payout. This threshold 
                helps reduce transaction fees and processing costs. Most affiliates reach this threshold quickly with 
                just 2-4 referrals depending on the plan.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 bg-gradient-to-br from-primary/10 via-background to-primary/5">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Ready to Start Earning?
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join hundreds of affiliates earning passive income by promoting xiXoi™. 
            Get your unique referral link in 30 seconds.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" onClick={() => navigate('/auth')}>
              Create Your Affiliate Account
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate('/leaderboard')}>
              View Leaderboard
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-4">
            Already have an account? <button onClick={() => navigate('/affiliates')} className="text-primary hover:underline">View Dashboard</button>
          </p>
        </div>
      </section>
      <Footer />
    </AppLayout>
  );
}
