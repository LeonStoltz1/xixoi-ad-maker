import { AppLayout } from "@/components/layout/AppLayout";
import { Footer } from "@/components/Footer";
import { JsonLd } from "@/components/seo/JsonLd";
import { PageMeta } from "@/components/seo/PageMeta";
import { 
  CANONICAL_DEFINITION, 
  BRAND, 
  AUTHORITY_LINKS 
} from "@/lib/seo/canonical";
import {
  buildSoftwareApplicationJsonLd,
  buildBreadcrumbJsonLd,
  buildFaqJsonLd,
  buildWebPageJsonLd,
} from "@/lib/seo/schema";
import { Link } from "react-router-dom";
import { 
  Sparkles, 
  Globe, 
  Zap, 
  Users, 
  Building2, 
  ShoppingBag,
  Palette,
  ArrowRight
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "What is xiXoi?",
    answer: CANONICAL_DEFINITION,
  },
  {
    question: "How does xiXoi generate on-brand content?",
    answer: "xiXoi uses advanced AI to analyze your brand signals from a prompt or web address, then generates multiple creative directions that match your brand's visual identity, tone, and messaging.",
  },
  {
    question: "Do I need design experience to use xiXoi?",
    answer: "No. xiXoi is designed for anyone to create professional ad creatives. Simply enter a prompt or your website URL, and our AI handles the creative work.",
  },
  {
    question: "What types of content can xiXoi create?",
    answer: "xiXoi generates on-brand ads, product visuals, and social content optimized for platforms like Meta, TikTok, Google, and LinkedIn.",
  },
  {
    question: "How is xiXoi different from generic AI image tools?",
    answer: "Unlike generic image generators, xiXoi focuses on brand consistency and ad-ready outputs. It extracts your brand signals and generates content that matches your existing visual identity.",
  },
  {
    question: "Can I publish ads directly from xiXoi?",
    answer: "Yes. xiXoi handles the entire process—from creative generation to publishing across major advertising platforms. No ad account setup required.",
  },
  {
    question: "What's the Quick-Start tier?",
    answer: "Quick-Start ($49/month) lets you create and publish ads without connecting your own ad accounts. xiXoi manages everything through verified partner accounts.",
  },
  {
    question: "Is xiXoi suitable for agencies?",
    answer: "Absolutely. Our Agency tier provides multi-client management, white-labeling options, and bulk creative generation for professional advertising teams.",
  },
];

const WhatIsXixoi = () => {
  const breadcrumbs = [
    { name: "Home", url: "/" },
    { name: "What is xiXoi", url: "/what-is-xixoi" },
  ];

  return (
    <>
      <PageMeta
        title="What is xiXoi? | AI Creative Studio for On-Brand Ads"
        description={CANONICAL_DEFINITION}
        canonicalPath="/what-is-xixoi"
      />
      <JsonLd
        data={[
          buildWebPageJsonLd({ url: "/what-is-xixoi", title: "What is xiXoi?" }),
          buildSoftwareApplicationJsonLd(),
          buildFaqJsonLd(faqs),
          buildBreadcrumbJsonLd(breadcrumbs),
        ]}
      />
      <AppLayout>
        <article className="max-w-4xl mx-auto space-y-16">
          {/* Hero */}
          <header className="text-center space-y-6">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
              What is {BRAND.alternateName}?
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground leading-relaxed max-w-3xl mx-auto">
              {CANONICAL_DEFINITION}
            </p>
          </header>

          {/* What xiXoi Does */}
          <section className="space-y-8">
            <h2 className="text-3xl font-bold text-center">What xiXoi Does</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-card border rounded-2xl p-6 space-y-4">
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Sparkles className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold">On-Brand Ad Generation</h3>
                <p className="text-muted-foreground">
                  Create professional ads that match your brand's visual identity, 
                  tone, and messaging automatically.
                </p>
              </div>
              <div className="bg-card border rounded-2xl p-6 space-y-4">
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Palette className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold">Product Visuals</h3>
                <p className="text-muted-foreground">
                  Generate stunning product imagery and lifestyle shots without 
                  expensive photo shoots.
                </p>
              </div>
              <div className="bg-card border rounded-2xl p-6 space-y-4">
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Globe className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold">Social-Ready Content</h3>
                <p className="text-muted-foreground">
                  Produce scroll-stopping social content optimized for every 
                  major platform.
                </p>
              </div>
            </div>
          </section>

          {/* How It Works */}
          <section className="space-y-8">
            <h2 className="text-3xl font-bold text-center">How It Works</h2>
            <div className="space-y-4">
              {[
                { step: 1, title: "Enter a prompt or web address", description: "Describe what you want or paste your website URL" },
                { step: 2, title: "AI extracts brand signals", description: "xiXoi analyzes colors, fonts, tone, and visual style" },
                { step: 3, title: "Generate creative directions", description: "Receive multiple on-brand options to choose from" },
                { step: 4, title: "Produce ads & visuals", description: "Get polished creatives ready for any platform" },
                { step: 5, title: "Export and iterate", description: "Download, publish directly, or refine further" },
              ].map(({ step, title, description }) => (
                <div 
                  key={step}
                  className="flex items-start gap-4 p-4 rounded-xl hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-shrink-0 h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                    {step}
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{title}</h3>
                    <p className="text-muted-foreground">{description}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Who It's For */}
          <section className="space-y-8">
            <h2 className="text-3xl font-bold text-center">Who It's For</h2>
            <div className="grid sm:grid-cols-2 gap-6">
              <div className="flex items-start gap-4 p-6 bg-card border rounded-xl">
                <ShoppingBag className="h-8 w-8 text-primary flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-lg">SMBs</h3>
                  <p className="text-muted-foreground">
                    Small and medium businesses needing professional ads without 
                    agency costs.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-6 bg-card border rounded-xl">
                <Users className="h-8 w-8 text-primary flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-lg">Creators</h3>
                  <p className="text-muted-foreground">
                    Content creators and influencers who need quick, on-brand visuals.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-6 bg-card border rounded-xl">
                <Building2 className="h-8 w-8 text-primary flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-lg">Agencies</h3>
                  <p className="text-muted-foreground">
                    Marketing agencies scaling creative production for multiple clients.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-6 bg-card border rounded-xl">
                <Zap className="h-8 w-8 text-primary flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-lg">E-commerce Brands</h3>
                  <p className="text-muted-foreground">
                    Online stores needing constant fresh creatives for product launches.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* FAQ */}
          <section className="space-y-8">
            <h2 className="text-3xl font-bold text-center">Frequently Asked Questions</h2>
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq, index) => (
                <AccordionItem key={index} value={`item-${index}`}>
                  <AccordionTrigger className="text-left">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </section>

          {/* CTA Links */}
          <section className="bg-muted/50 rounded-2xl p-8 space-y-6">
            <h2 className="text-2xl font-bold text-center">Ready to get started?</h2>
            <div className="flex flex-wrap justify-center gap-4">
              <Link 
                to={AUTHORITY_LINKS.pricing}
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
              >
                View Pricing
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link 
                to={AUTHORITY_LINKS.examples}
                className="inline-flex items-center gap-2 px-6 py-3 bg-card border rounded-lg font-medium hover:bg-muted transition-colors"
              >
                See Examples
              </Link>
            </div>
          </section>

          {/* Internal Links */}
          <nav className="border-t pt-8">
            <h3 className="text-lg font-medium text-muted-foreground mb-4">Explore More</h3>
            <div className="flex flex-wrap gap-4">
              <Link to={AUTHORITY_LINKS.official} className="text-primary hover:underline">
                Official Identity
              </Link>
              <Link to={AUTHORITY_LINKS.features} className="text-primary hover:underline">
                Features
              </Link>
              <Link to={AUTHORITY_LINKS.useCases} className="text-primary hover:underline">
                Use Cases
              </Link>
              <Link to={AUTHORITY_LINKS.countries} className="text-primary hover:underline">
                Countries
              </Link>
              <Link to={AUTHORITY_LINKS.compare} className="text-primary hover:underline">
                Compare to Generic Tools
              </Link>
            </div>
          </nav>
        </article>
        <div className="mt-16">
          <Footer />
        </div>
      </AppLayout>
    </>
  );
};

export default WhatIsXixoi;
