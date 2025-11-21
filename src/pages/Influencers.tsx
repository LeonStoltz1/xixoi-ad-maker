import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { DollarSign, Users, TrendingUp, Check, Zap, Gift, Video, FileText, Mail } from "lucide-react";
import { Footer } from "@/components/Footer";
import { AppLayout } from "@/components/layout/AppLayout";
import { BannerDownload } from "@/components/BannerDownload";
import { BannerGallery } from "@/components/BannerGallery";
import { EarningsCalculator } from "@/components/EarningsCalculator";
import { toast } from "sonner";

export default function Influencers() {
  const navigate = useNavigate();

  const copyToClipboard = (text: string, successMessage: string) => {
    navigator.clipboard.writeText(text);
    toast.success(successMessage);
  };

  return (
    <AppLayout title="xiXoi™ Affiliate Program">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary via-primary/90 to-primary/70 py-24 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6 text-white">
              <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                50% Recurring for 12 Months
              </Badge>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold font-heading leading-tight">
                Earn 50% Commissions for 12 Months
              </h1>
              <p className="text-lg md:text-xl text-white/90">
                Help small businesses create better ads with xiXoi™ — get paid for every upgrade.
              </p>
              <p className="text-base text-white/80">
                Promote the world's simplest AI ad-creation tool and earn recurring revenue for an entire year for every user you refer.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 pt-6">
                <Button size="lg" variant="secondary" onClick={() => navigate('/auth')}>
                  Become a xiXoi Affiliate
                </Button>
                <Button size="lg" variant="outline" className="bg-white/10 border-white/30 text-white hover:bg-white/20" onClick={() => document.getElementById('calculator')?.scrollIntoView({ behavior: 'smooth' })}>
                  View Earnings Calculator
                </Button>
              </div>
              <p className="text-sm text-white/70 pt-4">
                Trusted by creators, agencies & thousands of small businesses
              </p>
            </div>
            <div className="hidden lg:block">
              <div className="relative">
                <div className="absolute inset-0 bg-white/10 rounded-2xl blur-3xl"></div>
                <Card className="relative border-white/20 bg-white/10 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="text-white">Product that converts instantly</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-white/90">
                    <div className="flex items-center gap-2">
                      <Check className="w-5 h-5 text-white" />
                      <span>60-second ad creation</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="w-5 h-5 text-white" />
                      <span>AI writes copy automatically</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="w-5 h-5 text-white" />
                      <span>One-click publishing to Meta/TikTok/Google</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="w-5 h-5 text-white" />
                      <span>2-10× industry conversion rate</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-6 bg-card border-y border-border">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div className="space-y-2">
              <div className="text-3xl md:text-4xl font-bold text-primary">50%</div>
              <div className="text-base md:text-lg font-medium">Commission Rate</div>
              <div className="text-sm text-muted-foreground">Recurring for 12 months</div>
            </div>
            <div className="space-y-2">
              <div className="text-3xl md:text-4xl font-bold text-primary">$294</div>
              <div className="text-base md:text-lg font-medium">Avg Per Referral</div>
              <div className="text-sm text-muted-foreground">Per year lifetime value</div>
            </div>
            <div className="space-y-2">
              <div className="text-3xl md:text-4xl font-bold text-primary">30 Days</div>
              <div className="text-base md:text-lg font-medium">Attribution Window</div>
              <div className="text-sm text-muted-foreground">Cookie tracks all clicks</div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Become an Affiliate */}
      <section className="py-20 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Why Become a xiXoi Affiliate?</h2>
            <p className="text-lg md:text-xl text-muted-foreground">A product that instantly converts</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card>
              <CardHeader>
                <Zap className="w-10 h-10 text-primary mb-3" />
                <CardTitle>Insanely High Conversion</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Small businesses struggle with: writing ad copy, choosing images, knowing how to target, and publishing correctly.
                </p>
                <p className="text-muted-foreground font-semibold">
                  xiXoi solves this in 60 seconds. Your leads convert at 2–10× the industry average.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <DollarSign className="w-10 h-10 text-primary mb-3" />
                <CardTitle>Big Recurring Commissions</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Earn 50% of every subscription payment for an entire year. That's $24.50-$49.50 per user per month.
                </p>
                <p className="text-muted-foreground font-semibold">
                  Average lifetime value: $294 per referral per year.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Users className="w-10 h-10 text-primary mb-3" />
                <CardTitle>Perfect for Creators</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Free tier lets users create ads and fall in love with the product. When they want to publish, they have to upgrade.
                </p>
                <p className="text-muted-foreground font-semibold">
                  Your commission starts the moment they pay.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Commission Plan */}
      <section className="py-20 px-6 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">50% Recurring Commissions for 12 Months</h2>
            <p className="text-xl text-muted-foreground">Earn half of every subscription your referral pays</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            <Card className="border-2">
              <CardHeader>
                <CardTitle className="text-2xl">Quick-Start</CardTitle>
                <CardDescription>Entry Tier</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="text-3xl font-bold">$49<span className="text-lg text-muted-foreground">/mo</span></div>
                  <div className="text-primary text-2xl font-bold">= $24.50/mo</div>
                  <div className="text-sm text-muted-foreground">Your commission (50%)</div>
                </div>
                <div className="pt-4 space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-primary" />
                    <span>50% for 12 months</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-primary" />
                    <span>$294/year per referral</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-primary">
              <CardHeader>
                <div className="flex items-center gap-2 mb-2">
                  <Gift className="w-5 h-5 text-primary" />
                  <span className="text-sm font-semibold text-primary">Most Popular</span>
                </div>
                <CardTitle className="text-2xl">Publish Pro</CardTitle>
                <CardDescription>Unlimited Publishing</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="text-3xl font-bold">$99<span className="text-lg text-muted-foreground">/mo</span></div>
                  <div className="text-primary text-2xl font-bold">= $49.50/mo</div>
                  <div className="text-sm text-muted-foreground">Your commission (50%)</div>
                </div>
                <div className="pt-4 space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-primary" />
                    <span>50% for 12 months</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-primary" />
                    <span>$594/year per referral</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2">
              <CardHeader>
                <CardTitle className="text-2xl">Per-Ad Purchases</CardTitle>
                <CardDescription>One-Time</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="text-3xl font-bold">$29<span className="text-lg text-muted-foreground">/ad</span></div>
                  <div className="text-primary text-2xl font-bold">= $14.50</div>
                  <div className="text-sm text-muted-foreground">Your commission (50%)</div>
                </div>
                <div className="pt-4 space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-primary" />
                    <span>Instant commission</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-primary" />
                    <span>No subscription required</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="text-center">
            <Card className="max-w-2xl mx-auto bg-primary/5 border-primary/20 inline-block">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 justify-center mb-3">
                  <TrendingUp className="w-6 h-6 text-primary" />
                  <h3 className="text-xl font-bold">Average Per Year Per Referral</h3>
                </div>
                <p className="text-3xl font-bold text-primary mb-2">$294-$594</p>
                <p className="text-muted-foreground">That's $24.50-$49.50/month in recurring income</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Earnings Calculator */}
      <section id="calculator" className="py-20 px-6">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">How Much Could You Earn?</h2>
            <p className="text-xl text-muted-foreground">Calculate your potential monthly and yearly earnings</p>
          </div>
          <EarningsCalculator />
        </div>
      </section>

      {/* Who This Program Is For */}
      <section className="py-20 px-6 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Who This Program Is For</h2>
            <p className="text-xl text-muted-foreground">Perfect for creators, marketers, and business influencers</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
            {[
              "Creators",
              "UGC Ad Creators",
              "Marketing YouTubers",
              "Freelancers",
              "Agencies",
              "Social Media Managers",
              "Indie SaaS Reviewers",
              "Business Podcasters"
            ].map((audience) => (
              <Card key={audience} className="text-center">
                <CardContent className="pt-6">
                  <p className="font-semibold">{audience}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">How It Works</h2>
            <p className="text-lg md:text-xl text-muted-foreground">3 Simple Steps to Start Earning</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="text-center">
              <CardHeader>
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-primary">1</span>
                </div>
                <CardTitle>Apply for the Program</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Sign up takes 30 seconds. Get approved instantly and receive your unique affiliate link.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-primary">2</span>
                </div>
                <CardTitle>Get Your Link + Content Kit</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Access TikTok scripts, banners, email templates, and video demos. Everything you need to promote.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-primary">3</span>
                </div>
                <CardTitle>Earn 50% for 12 Months</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Share your link, track conversions in real-time, and receive automatic monthly payouts.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* What You Get */}
      <section className="py-20 px-6 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Your Complete Affiliate Toolkit</h2>
            <p className="text-xl text-muted-foreground">Everything you need to succeed</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <TrendingUp className="w-10 h-10 text-primary mb-3" />
                <CardTitle>Affiliate Dashboard</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">Real-time tracking of:</p>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-primary" />
                    <span>Clicks on your link</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-primary" />
                    <span>Free signups</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-primary" />
                    <span>Paid upgrades</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-primary" />
                    <span>Monthly earnings</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-primary" />
                    <span>Leaderboard position</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <FileText className="w-10 h-10 text-primary mb-3" />
                <CardTitle>Content Kit</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">Ready-to-use materials:</p>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-primary" />
                    <span>TikTok scripts (4 variations)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-primary" />
                    <span>Social media hooks</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-primary" />
                    <span>Email templates</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-primary" />
                    <span>Product demo videos</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-primary" />
                    <span>Before/after examples</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <DollarSign className="w-10 h-10 text-primary mb-3" />
                <CardTitle>Monthly Payouts</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Earn $100+ in a month? Automatic payout via Stripe, PayPal, or bank transfer.
                </p>
                <p className="text-muted-foreground">
                  Below $100? You can request a manual payout anytime (Stripe processing fees apply).
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Zap className="w-10 h-10 text-primary mb-3" />
                <CardTitle>30-Day Attribution</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  When someone clicks your link, they're tracked for 30 days.
                </p>
                <p className="text-muted-foreground">
                  If they sign up anytime in the next month, you get full credit and commission.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* TikTok Scripts */}
      <section className="py-20 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Video className="w-8 h-8 text-primary" />
              <h2 className="text-4xl font-bold">TikTok Scripts for Affiliates</h2>
            </div>
            <p className="text-xl text-muted-foreground">Copy-paste viral scripts ready to use</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Script 1 */}
            <Card>
              <CardHeader>
                <CardTitle>Script 1: "The Tool No One Knows About"</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-muted rounded-lg space-y-3">
                  <p className="text-sm font-semibold">Hook:</p>
                  <p className="text-sm">"You're leaving money on the table if you aren't using this…"</p>
                  
                  <p className="text-sm font-semibold mt-4">Body:</p>
                  <p className="text-sm">"I found this AI tool called xiXoi that creates full ads for small businesses in 60 seconds… Copy, image, targeting — everything. I became an affiliate and they're paying 50% recurring commissions for 12 months for every paid user. Easy money."</p>
                  
                  <p className="text-sm font-semibold mt-4">CTA:</p>
                  <p className="text-sm">"Click my link, get the free version, and see it yourself."</p>
                </div>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => copyToClipboard(
                    "You're leaving money on the table if you aren't using this… I found this AI tool called xiXoi that creates full ads for small businesses in 60 seconds… Copy, image, targeting — everything. I became an affiliate and they're paying 50% recurring commissions for 12 months for every paid user. Easy money. Click my link, get the free version, and see it yourself.",
                    "Script 1 copied!"
                  )}
                >
                  Copy Script
                </Button>
              </CardContent>
            </Card>

            {/* Script 2 */}
            <Card>
              <CardHeader>
                <CardTitle>Script 2: "Watch Me Make Money"</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-muted rounded-lg space-y-3">
                  <p className="text-sm font-semibold">Hook:</p>
                  <p className="text-sm">"Watch me make passive income using AI…"</p>
                  
                  <p className="text-sm font-semibold mt-4">Body:</p>
                  <p className="text-sm">"I promote xiXoi — it's an AI ad creator. Every time someone signs up, I get paid 50% for 12 months. I don't need clients. Just post videos, tutorial, or reviews."</p>
                  
                  <p className="text-sm font-semibold mt-4">CTA:</p>
                  <p className="text-sm">"Use my link. Test the tool for free."</p>
                </div>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => copyToClipboard(
                    "Watch me make passive income using AI… I promote xiXoi — it's an AI ad creator. Every time someone signs up, I get paid 50% for 12 months. I don't need clients. Just post videos, tutorial, or reviews. Use my link. Test the tool for free.",
                    "Script 2 copied!"
                  )}
                >
                  Copy Script
                </Button>
              </CardContent>
            </Card>

            {/* Script 3 */}
            <Card>
              <CardHeader>
                <CardTitle>Script 3: Faceless Tutorial Style</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-muted rounded-lg space-y-3">
                  <p className="text-sm font-semibold">Format:</p>
                  <p className="text-sm">Screen recording of xiXoi generating ad</p>
                  
                  <p className="text-sm font-semibold mt-4">Voiceover:</p>
                  <p className="text-sm">"Businesses pay $200+ for ads like this. xiXoi generates them in 60 seconds. I promote it as an affiliate and they pay 50% recurring."</p>
                  
                  <p className="text-sm font-semibold mt-4">CTA:</p>
                  <p className="text-sm">"Link in bio to join free."</p>
                </div>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => copyToClipboard(
                    "Businesses pay $200+ for ads like this. xiXoi generates them in 60 seconds. I promote it as an affiliate and they pay 50% recurring. Link in bio to join free.",
                    "Script 3 copied!"
                  )}
                >
                  Copy Script
                </Button>
              </CardContent>
            </Card>

            {/* Script 4 */}
            <Card>
              <CardHeader>
                <CardTitle>Script 4: "Agency Hack"</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-muted rounded-lg space-y-3">
                  <p className="text-sm font-semibold">Hook:</p>
                  <p className="text-sm">"I replaced my ad agency with this…"</p>
                  
                  <p className="text-sm font-semibold mt-4">Body:</p>
                  <p className="text-sm">Shows xiXoi generating an ad.</p>
                  <p className="text-sm">"I became an affiliate because the tool sells itself."</p>
                </div>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => copyToClipboard(
                    "I replaced my ad agency with this… [Show xiXoi generating an ad] I became an affiliate because the tool sells itself.",
                    "Script 4 copied!"
                  )}
                >
                  Copy Script
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Banner Gallery & Download */}
      <section className="py-20 px-6 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">AI-Generated Banner Graphics</h2>
            <p className="text-xl text-muted-foreground">Download professional banners in all sizes</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <BannerDownload
              size="1200x628"
              title="Social Banner"
              description="1200×628px - Perfect for Facebook, LinkedIn, Twitter"
            />
            <BannerDownload
              size="1080x1080"
              title="Instagram Square"
              description="1080×1080px - Instagram posts and carousel"
            />
            <BannerDownload
              size="1080x1920"
              title="Story Format"
              description="1080×1920px - Instagram/Facebook Stories, Reels"
            />
          </div>

          <BannerGallery />
        </div>
      </section>

      {/* Partner Program Tiers */}
      <section className="py-20 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Partner Program Tiers</h2>
            <p className="text-xl text-muted-foreground">Level up your earnings</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <Card>
              <CardHeader>
                <Badge variant="secondary" className="mb-2 w-fit">Open to Everyone</Badge>
                <CardTitle className="text-2xl">Affiliate Partner</CardTitle>
                <CardDescription>Standard affiliate benefits</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-primary" />
                  <span>50% recurring for 12 months</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-primary" />
                  <span>Dashboard & analytics</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-primary" />
                  <span>Content kit access</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-primary" />
                  <span>Early access to new features</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-primary">
              <CardHeader>
                <Badge variant="default" className="mb-2 w-fit">Application Only</Badge>
                <CardTitle className="text-2xl">Pro Partner</CardTitle>
                <CardDescription>For high-volume affiliates</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-primary" />
                  <span>50% recurring for <strong>24 months</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-primary" />
                  <span>Custom landing pages</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-primary" />
                  <span>Featured spotlight on xiXoi</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-primary" />
                  <span>Bonus commission opportunities</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-primary" />
                  <span>Dedicated partner manager</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 px-6 bg-muted/30">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Frequently Asked Questions</h2>
          </div>

          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="following">
              <AccordionTrigger>Do I need a following to join?</AccordionTrigger>
              <AccordionContent>
                No — even small creators convert. If you have an audience interested in business, marketing, AI tools, or entrepreneurship, you're a good fit. Many of our top affiliates started with under 1,000 followers.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="payment">
              <AccordionTrigger>When do I get paid?</AccordionTrigger>
              <AccordionContent>
                Monthly automatic payouts for earnings of $100+. If you earn less than $100 in a month, you can request a manual payout (Stripe processing fees apply) or wait until you hit the $100 threshold.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="recurring">
              <AccordionTrigger>Do I really get recurring revenue?</AccordionTrigger>
              <AccordionContent>
                Yes — you earn 50% commission every month for 12 months for each referral that stays subscribed. If someone you refer stays on the $99/mo plan for a full year, you earn $594 total from that one referral.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="international">
              <AccordionTrigger>Can I promote internationally?</AccordionTrigger>
              <AccordionContent>
                Yes — xiXoi is a global platform. Affiliates worldwide can participate and earn commissions. Payouts are processed via Stripe Connect in your local currency where supported.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="faceless">
              <AccordionTrigger>What if I don't show my face on camera?</AccordionTrigger>
              <AccordionContent>
                We provide faceless TikTok scripts, screen recording tutorials, and written content templates. Many successful affiliates never appear on camera — they use product demos, voiceovers, and text-based content.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="competition">
              <AccordionTrigger>Is there a limit on how many affiliates can promote xiXoi?</AccordionTrigger>
              <AccordionContent>
                No limits. The more affiliates we have, the more users discover xiXoi. Your unique referral link tracks all your conversions, so you always get credit for your work regardless of how many other affiliates exist.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="tracking">
              <AccordionTrigger>How does tracking work?</AccordionTrigger>
              <AccordionContent>
                When someone clicks your affiliate link, a 30-day cookie is stored. If they sign up and upgrade within 30 days, you get full commission credit. You can track clicks, signups, and conversions in real-time on your dashboard.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="materials">
              <AccordionTrigger>What marketing materials do I get?</AccordionTrigger>
              <AccordionContent>
                You get: TikTok scripts (4 variations), social media post templates, email templates, video scripts, AI-generated banner graphics in 3 sizes, product demo videos, before/after examples, and case studies. Everything you need to start promoting immediately.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 px-6 bg-gradient-to-br from-primary via-primary/90 to-primary/70">
        <div className="container mx-auto max-w-4xl text-center space-y-8">
          <h2 className="text-4xl md:text-5xl font-bold text-white">
            Start Earning 50% Recurring Commissions Today
          </h2>
          <p className="text-xl text-white/90">
            Become a xiXoi™ Affiliate — takes 30 seconds
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
            <Button size="lg" variant="secondary" onClick={() => navigate('/auth')}>
              Start Earning
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="bg-white/10 border-white/30 text-white hover:bg-white/20"
              onClick={() => document.getElementById('calculator')?.scrollIntoView({ behavior: 'smooth' })}
            >
              View Earnings Calculator
            </Button>
          </div>
          <p className="text-sm text-white/70 pt-4">
            Questions? Email us at <a href="mailto:info@stoltzone.com" className="underline">info@stoltzone.com</a>
          </p>
        </div>
      </section>

      <Footer />
    </AppLayout>
  );
}
