import { useParams, Link, Navigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Footer } from "@/components/Footer";
import { JsonLd } from "@/components/seo/JsonLd";
import { PageMeta } from "@/components/seo/PageMeta";
import { 
  CANONICAL_DEFINITION, 
  BRAND,
  GEO_CONFIG,
  AUTHORITY_LINKS 
} from "@/lib/seo/canonical";
import {
  buildSoftwareApplicationJsonLd,
  buildBreadcrumbJsonLd,
  buildFaqJsonLd,
  buildWebPageJsonLd,
} from "@/lib/seo/schema";
import { ArrowRight, Sparkles, Zap, Globe, Building2, Users, TrendingUp, Target, Palette } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

// City-specific content generator
const getCityContent = (cityName: string, countryName: string) => ({
  intro: `Creators and businesses in ${cityName} are using xiXoi to produce professional, on-brand advertising content without the traditional overhead of agencies or in-house design teams.`,
  businessTypes: [
    `${cityName} startups launching products`,
    `Local ${cityName} service businesses`,
    `E-commerce brands targeting ${cityName}`,
    `${cityName} real estate professionals`,
    `Restaurants and hospitality in ${cityName}`,
    `Professional services firms`,
  ],
  benefits: [
    { icon: Sparkles, title: "On-Brand Output", desc: `Every ad matches your ${cityName} business identity` },
    { icon: Zap, title: "60-Second Creation", desc: "From idea to published ad in under a minute" },
    { icon: Globe, title: "Multi-Platform", desc: "Meta, TikTok, Google, LinkedIn—all from one place" },
    { icon: Building2, title: "No Agency Needed", desc: "Professional results without agency retainers" },
    { icon: Users, title: "Any Business Size", desc: "From solo creators to growing teams" },
    { icon: TrendingUp, title: "Performance Focus", desc: "Ad creatives optimized for conversion" },
    { icon: Target, title: "Local Targeting", desc: `Reach your ${cityName} audience effectively` },
    { icon: Palette, title: "Brand Consistency", desc: "Maintain visual identity across campaigns" },
  ],
  faqs: [
    {
      question: `How do ${cityName} businesses use xiXoi?`,
      answer: `Businesses in ${cityName} use xiXoi to create on-brand ads, product visuals, and social content. Simply enter a prompt or paste your website URL, and xiXoi generates multiple creative directions that match your brand identity.`,
    },
    {
      question: `Is xiXoi suitable for small ${cityName} businesses?`,
      answer: `Absolutely. xiXoi is designed for businesses of all sizes. Many small businesses in ${cityName} use xiXoi because it eliminates the need for expensive agencies or in-house designers while still producing professional-quality ads.`,
    },
    {
      question: `What platforms can I publish to from ${cityName}?`,
      answer: `xiXoi supports publishing to Meta (Facebook/Instagram), TikTok, Google Ads, and LinkedIn. You can target audiences anywhere, including specifically in ${cityName} and the surrounding ${countryName} region.`,
    },
    {
      question: `Do I need an ad account to use xiXoi in ${cityName}?`,
      answer: `No. With xiXoi's Quick-Start tier, you don't need to set up or connect any ad accounts. xiXoi manages everything through verified partner accounts, making it easy for ${cityName} businesses to start advertising immediately.`,
    },
    {
      question: `How does xiXoi maintain brand consistency for ${cityName} businesses?`,
      answer: `xiXoi extracts your brand signals—colors, fonts, visual style, and tone—from your website or prompts. Every creative it generates matches your existing brand identity, ensuring consistency across all your advertising.`,
    },
  ],
});

const CityPage = () => {
  const { countrySlug, citySlug } = useParams<{ countrySlug: string; citySlug: string }>();
  
  const country = GEO_CONFIG.countries.find((c) => c.slug === countrySlug);
  const city = country?.cities.find((c) => c.slug === citySlug);
  
  if (!country || !city) {
    return <Navigate to="/countries" replace />;
  }

  const content = getCityContent(city.name, country.name);
  
  const breadcrumbs = [
    { name: "Home", url: "/" },
    { name: "Countries", url: "/countries" },
    { name: country.name, url: `/countries/${country.slug}` },
    { name: city.name, url: `/countries/${country.slug}/${city.slug}` },
  ];

  return (
    <>
      <PageMeta
        title={`xiXoi™ in ${city.name}, ${country.name} | AI Ad Creation`}
        description={`${CANONICAL_DEFINITION} See how businesses and creators in ${city.name} use xiXoi for on-brand advertising.`}
        canonicalPath={`/countries/${country.slug}/${city.slug}`}
      />
      <JsonLd
        data={[
          buildWebPageJsonLd({ 
            url: `/countries/${country.slug}/${city.slug}`, 
            title: `xiXoi in ${city.name}` 
          }),
          buildSoftwareApplicationJsonLd({ areaServed: `${city.name}, ${country.name}` }),
          buildFaqJsonLd(content.faqs),
          buildBreadcrumbJsonLd(breadcrumbs),
        ]}
      />
      <AppLayout>
        <article className="max-w-4xl mx-auto space-y-12">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
            <Link to="/countries" className="hover:text-primary">Countries</Link>
            <span>/</span>
            <Link to={`/countries/${country.slug}`} className="hover:text-primary">{country.name}</Link>
            <span>/</span>
            <span>{city.name}</span>
          </div>

          {/* Header */}
          <header className="space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
              {BRAND.alternateName} in {city.name}
            </h1>
            <p className="text-xl text-muted-foreground">
              {CANONICAL_DEFINITION}
            </p>
          </header>

          {/* Intro */}
          <section className="prose prose-neutral max-w-none">
            <p className="text-lg leading-relaxed text-muted-foreground">
              {content.intro}
            </p>
            <p className="text-lg leading-relaxed text-muted-foreground">
              Whether you're a solo entrepreneur, a growing startup, or an established business 
              in {city.name}, xiXoi provides the tools to create professional advertising content 
              that maintains your brand identity across every campaign and platform.
            </p>
          </section>

          {/* Benefits Grid */}
          <section className="space-y-6">
            <h2 className="text-2xl font-bold">Why {city.name} Businesses Choose xiXoi</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {content.benefits.map(({ icon: Icon, title, desc }) => (
                <div key={title} className="flex items-start gap-3 p-4 bg-card border rounded-xl">
                  <Icon className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-medium">{title}</h3>
                    <p className="text-sm text-muted-foreground">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Who Uses xiXoi */}
          <section className="space-y-6">
            <h2 className="text-2xl font-bold">Who Uses xiXoi in {city.name}</h2>
            <ul className="grid sm:grid-cols-2 gap-3">
              {content.businessTypes.map((type) => (
                <li key={type} className="flex items-center gap-2 text-muted-foreground">
                  <ArrowRight className="h-4 w-4 text-primary flex-shrink-0" />
                  {type}
                </li>
              ))}
            </ul>
          </section>

          {/* Workflow */}
          <section className="bg-muted/50 rounded-2xl p-8 space-y-6">
            <h2 className="text-2xl font-bold">How It Works</h2>
            <p className="text-muted-foreground">
              Creating on-brand ads in {city.name} takes less than 60 seconds with xiXoi:
            </p>
            <div className="space-y-4">
              {[
                "Enter a prompt or paste your website URL",
                "xiXoi analyzes your brand signals automatically",
                "Choose from multiple on-brand creative directions",
                "Publish directly to Meta, TikTok, Google, or LinkedIn",
              ].map((step, index) => (
                <div key={index} className="flex items-start gap-4">
                  <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                    {index + 1}
                  </div>
                  <p className="text-muted-foreground pt-1">{step}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Common Formats */}
          <section className="space-y-6">
            <h2 className="text-2xl font-bold">Common Creative Formats</h2>
            <p className="text-muted-foreground">
              {city.name} businesses use xiXoi to create a variety of advertising content:
            </p>
            <div className="flex flex-wrap gap-3">
              {[
                "Social media ads",
                "Product visuals",
                "Story content",
                "Banner ads",
                "Carousel creatives",
                "Video thumbnails",
              ].map((format) => (
                <span key={format} className="px-4 py-2 bg-card border rounded-full text-sm">
                  {format}
                </span>
              ))}
            </div>
          </section>

          {/* FAQ */}
          <section className="space-y-6">
            <h2 className="text-2xl font-bold">Frequently Asked Questions</h2>
            <Accordion type="single" collapsible className="w-full">
              {content.faqs.map((faq, index) => (
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

          {/* CTA */}
          <section className="text-center space-y-6">
            <h2 className="text-2xl font-bold">Ready to Create On-Brand Ads in {city.name}?</h2>
            <div className="flex flex-wrap justify-center gap-4">
              <Link 
                to="/auth"
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
              >
                Get Started
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
              <Link to={`/countries/${country.slug}`} className="text-primary hover:underline">
                {country.name}
              </Link>
              <Link to="/countries" className="text-primary hover:underline">
                All Countries
              </Link>
              <Link to={AUTHORITY_LINKS.whatIsXixoi} className="text-primary hover:underline">
                What is xiXoi?
              </Link>
              <Link to={AUTHORITY_LINKS.features} className="text-primary hover:underline">
                Features
              </Link>
              <Link to={AUTHORITY_LINKS.pricing} className="text-primary hover:underline">
                Pricing
              </Link>
              <Link to={AUTHORITY_LINKS.examples} className="text-primary hover:underline">
                Examples
              </Link>
              <Link to={AUTHORITY_LINKS.official} className="text-primary hover:underline">
                Official
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

export default CityPage;
