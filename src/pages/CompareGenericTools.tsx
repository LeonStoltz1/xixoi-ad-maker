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
  buildBreadcrumbJsonLd,
  buildWebPageJsonLd,
} from "@/lib/seo/schema";
import { Link } from "react-router-dom";
import { Check, X, ArrowRight } from "lucide-react";

const comparisonData = [
  {
    feature: "Brand Consistency",
    xixoi: "Extracts and maintains your brand identity automatically",
    generic: "No brand awareness—outputs are generic",
    xiXoiWins: true,
  },
  {
    feature: "On-Brand Output",
    xixoi: "Every creative matches your visual identity",
    generic: "Random styles unrelated to your brand",
    xiXoiWins: true,
  },
  {
    feature: "Input Methods",
    xixoi: "Prompt OR web address for instant brand extraction",
    generic: "Text prompts only",
    xiXoiWins: true,
  },
  {
    feature: "Ad-Ready Formats",
    xixoi: "Optimized for Meta, TikTok, Google, LinkedIn",
    generic: "Generic image sizes, manual resizing needed",
    xiXoiWins: true,
  },
  {
    feature: "Social-Ready Content",
    xixoi: "Platform-specific aspect ratios and styles",
    generic: "One-size-fits-all output",
    xiXoiWins: true,
  },
  {
    feature: "Direct Publishing",
    xixoi: "Publish ads directly to platforms",
    generic: "Export and manually upload",
    xiXoiWins: true,
  },
  {
    feature: "Creative Art Generation",
    xixoi: "Business-focused, ad-optimized",
    generic: "Broad creative freedom for any use case",
    xiXoiWins: false,
  },
];

const CompareGenericTools = () => {
  const breadcrumbs = [
    { name: "Home", url: "/" },
    { name: "Compare", url: "/compare/generic-ai-image-tools" },
  ];

  return (
    <>
      <PageMeta
        title="xiXoi™ vs Generic AI Image Tools | Comparison"
        description={`Compare ${BRAND.name} to generic AI image generators. ${CANONICAL_DEFINITION}`}
        canonicalPath="/compare/generic-ai-image-tools"
      />
      <JsonLd
        data={[
          buildWebPageJsonLd({ 
            url: "/compare/generic-ai-image-tools", 
            title: "xiXoi vs Generic AI Image Tools" 
          }),
          buildBreadcrumbJsonLd(breadcrumbs),
        ]}
      />
      <AppLayout>
        <article className="max-w-4xl mx-auto space-y-12">
          {/* Header */}
          <header className="text-center space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
              {BRAND.alternateName} vs Generic AI Image Tools
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              {CANONICAL_DEFINITION}
            </p>
          </header>

          {/* Comparison Table */}
          <section className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-4 font-semibold">Feature</th>
                  <th className="text-left p-4 font-semibold bg-primary/5">
                    {BRAND.alternateName}
                  </th>
                  <th className="text-left p-4 font-semibold">
                    Generic AI Tools
                  </th>
                </tr>
              </thead>
              <tbody>
                {comparisonData.map((row, index) => (
                  <tr key={index} className="border-b hover:bg-muted/50">
                    <td className="p-4 font-medium">{row.feature}</td>
                    <td className="p-4 bg-primary/5">
                      <div className="flex items-start gap-2">
                        {row.xiXoiWins ? (
                          <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                        ) : (
                          <X className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                        )}
                        <span className="text-sm">{row.xixoi}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-start gap-2">
                        {!row.xiXoiWins ? (
                          <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                        ) : (
                          <X className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                        )}
                        <span className="text-sm text-muted-foreground">{row.generic}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          {/* Explanation */}
          <section className="space-y-6">
            <h2 className="text-2xl font-bold">Why xiXoi is Not a Generic Image Generator</h2>
            <div className="prose prose-neutral max-w-none">
              <p className="text-muted-foreground leading-relaxed">
                Generic AI image tools are powerful for creative exploration—generating art, 
                illustrations, and imaginative visuals. They excel when you want unbounded 
                creative freedom.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                {BRAND.alternateName} takes a fundamentally different approach. Instead of 
                generating random images from prompts, xiXoi extracts your existing brand 
                signals—colors, fonts, visual style, and tone—then produces advertising 
                content that's immediately on-brand and platform-ready.
              </p>
            </div>
          </section>

          {/* When to Use What */}
          <section className="grid md:grid-cols-2 gap-6">
            <div className="bg-card border rounded-2xl p-6 space-y-4">
              <h3 className="text-xl font-semibold">When Generic Tools Are Fine</h3>
              <ul className="space-y-2 text-muted-foreground">
                <li>• Creating original art or illustrations</li>
                <li>• Exploring creative concepts</li>
                <li>• Personal projects without brand constraints</li>
                <li>• One-off images for non-commercial use</li>
              </ul>
            </div>
            <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6 space-y-4">
              <h3 className="text-xl font-semibold">When xiXoi is the Better Choice</h3>
              <ul className="space-y-2">
                <li>• Creating ads that match your brand</li>
                <li>• Scaling content production consistently</li>
                <li>• Publishing directly to ad platforms</li>
                <li>• Maintaining visual identity across campaigns</li>
              </ul>
            </div>
          </section>

          {/* CTA */}
          <section className="bg-muted/50 rounded-2xl p-8 text-center space-y-6">
            <h2 className="text-2xl font-bold">Ready for On-Brand AI Ads?</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Skip the generic outputs. Get ads that actually look like your brand.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link 
                to="/auth"
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
              >
                Try xiXoi Free
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
            <h3 className="text-lg font-medium text-muted-foreground mb-4">Learn More</h3>
            <div className="flex flex-wrap gap-4">
              <Link to={AUTHORITY_LINKS.whatIsXixoi} className="text-primary hover:underline">
                What is xiXoi?
              </Link>
              <Link to={AUTHORITY_LINKS.examples} className="text-primary hover:underline">
                Examples
              </Link>
              <Link to={AUTHORITY_LINKS.features} className="text-primary hover:underline">
                Features
              </Link>
              <Link to={AUTHORITY_LINKS.pricing} className="text-primary hover:underline">
                Pricing
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

export default CompareGenericTools;
