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
  buildWebPageJsonLd,
} from "@/lib/seo/schema";
import { MapPin, ArrowRight, Sparkles, Zap, Globe, Building2 } from "lucide-react";

// Country-specific content
const countryContent: Record<string, {
  industries: string[];
  useCases: string[];
  intro: string;
}> = {
  "united-states": {
    industries: ["E-commerce", "Real Estate", "SaaS", "Restaurants", "Professional Services", "Fitness"],
    useCases: ["Product launches", "Local business advertising", "Brand awareness campaigns", "Lead generation"],
    intro: "American businesses of all sizes use xiXoi to create professional advertising content without the overhead of agencies or in-house design teams.",
  },
  "united-kingdom": {
    industries: ["Retail", "Finance", "Technology", "Hospitality", "Healthcare", "Education"],
    useCases: ["Brand campaigns", "Social media advertising", "Product marketing", "Service promotion"],
    intro: "UK businesses leverage xiXoi to produce on-brand advertising content that resonates with British consumers across digital platforms.",
  },
  "canada": {
    industries: ["Technology", "Real Estate", "Retail", "Tourism", "Professional Services", "Food & Beverage"],
    useCases: ["Bilingual campaigns", "Local market targeting", "E-commerce promotion", "Service advertising"],
    intro: "Canadian businesses use xiXoi to create consistent, on-brand advertising across English-speaking markets.",
  },
  "australia": {
    industries: ["Retail", "Tourism", "Real Estate", "Technology", "Mining", "Agriculture"],
    useCases: ["Regional campaigns", "E-commerce advertising", "Tourism promotion", "B2B marketing"],
    intro: "Australian businesses rely on xiXoi for fast, professional ad creation that maintains brand consistency across all channels.",
  },
};

const CountryPage = () => {
  const { countrySlug } = useParams<{ countrySlug: string }>();
  
  const country = GEO_CONFIG.countries.find((c) => c.slug === countrySlug);
  
  if (!country) {
    return <Navigate to="/countries" replace />;
  }

  const content = countryContent[countrySlug!] || countryContent["united-states"];
  
  const breadcrumbs = [
    { name: "Home", url: "/" },
    { name: "Countries", url: "/countries" },
    { name: country.name, url: `/countries/${country.slug}` },
  ];

  return (
    <>
      <PageMeta
        title={`xiXoi™ in ${country.name} | AI-Powered Ad Creation`}
        description={`${CANONICAL_DEFINITION} See how businesses in ${country.name} use xiXoi to create on-brand advertising content.`}
        canonicalPath={`/countries/${country.slug}`}
      />
      <JsonLd
        data={[
          buildWebPageJsonLd({ 
            url: `/countries/${country.slug}`, 
            title: `xiXoi in ${country.name}` 
          }),
          buildSoftwareApplicationJsonLd({ areaServed: country.name }),
          buildBreadcrumbJsonLd(breadcrumbs),
        ]}
      />
      <AppLayout>
        <article className="max-w-4xl mx-auto space-y-12">
          {/* Header */}
          <header className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Link to="/countries" className="hover:text-primary">Countries</Link>
              <span>/</span>
              <span>{country.name}</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
              {BRAND.alternateName} in {country.name}
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
          </section>

          {/* How Businesses Use xiXoi */}
          <section className="space-y-6">
            <h2 className="text-2xl font-bold">How {country.name} Businesses Use xiXoi</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                { icon: Sparkles, title: "On-Brand Ad Generation", desc: "Create ads that match your visual identity automatically" },
                { icon: Zap, title: "Fast Turnaround", desc: "Go from idea to published ad in under 60 seconds" },
                { icon: Globe, title: "Multi-Platform Publishing", desc: "Publish to Meta, TikTok, Google, and LinkedIn" },
                { icon: Building2, title: "No Agency Required", desc: "Professional results without agency costs" },
              ].map(({ icon: Icon, title, desc }) => (
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

          {/* Popular Industries */}
          <section className="space-y-6">
            <h2 className="text-2xl font-bold">Popular Industries</h2>
            <div className="flex flex-wrap gap-3">
              {content.industries.map((industry) => (
                <span
                  key={industry}
                  className="px-4 py-2 bg-muted rounded-full text-sm"
                >
                  {industry}
                </span>
              ))}
            </div>
          </section>

          {/* Common Use Cases */}
          <section className="space-y-6">
            <h2 className="text-2xl font-bold">Common Use Cases</h2>
            <ul className="grid sm:grid-cols-2 gap-3">
              {content.useCases.map((useCase) => (
                <li
                  key={useCase}
                  className="flex items-center gap-2 text-muted-foreground"
                >
                  <ArrowRight className="h-4 w-4 text-primary" />
                  {useCase}
                </li>
              ))}
            </ul>
          </section>

          {/* Cities */}
          <section className="space-y-6">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <MapPin className="h-6 w-6" />
              Cities in {country.name}
            </h2>
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
              {country.cities.map((city) => (
                <Link
                  key={city.slug}
                  to={`/countries/${country.slug}/${city.slug}`}
                  className="group p-4 bg-card border rounded-xl hover:border-primary/50 hover:shadow-md transition-all"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium group-hover:text-primary transition-colors">
                      {city.name}
                    </span>
                    <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                  </div>
                </Link>
              ))}
            </div>
          </section>

          {/* Workflow */}
          <section className="bg-muted/50 rounded-2xl p-8 space-y-6">
            <h2 className="text-2xl font-bold">The xiXoi Workflow</h2>
            <div className="space-y-4">
              {[
                "Enter a prompt describing your ad or paste your website URL",
                "xiXoi extracts your brand signals automatically",
                "Receive multiple on-brand creative options",
                "Select, customize, and publish directly to ad platforms",
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

          {/* CTA */}
          <section className="text-center space-y-6">
            <h2 className="text-2xl font-bold">Ready to Create On-Brand Ads?</h2>
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

export default CountryPage;
