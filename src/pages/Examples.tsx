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
  buildWebPageJsonLd,
} from "@/lib/seo/schema";
import { Link } from "react-router-dom";
import { Sparkles, Image, Video, MessageSquare } from "lucide-react";

// Example creatives - these should be replaced with real generated examples
const examples = [
  {
    id: 1,
    title: "E-commerce Product Ad",
    description: "Generated from product URL",
    inputType: "Web Address",
    category: "Ad",
    placeholder: true,
  },
  {
    id: 2,
    title: "Fashion Brand Social Post",
    description: "On-brand Instagram content",
    inputType: "Prompt",
    category: "Social",
    placeholder: true,
  },
  {
    id: 3,
    title: "SaaS Product Visual",
    description: "Clean product feature highlight",
    inputType: "Web Address",
    category: "Visual",
    placeholder: true,
  },
  {
    id: 4,
    title: "Restaurant Promo Ad",
    description: "Appetizing food campaign creative",
    inputType: "Prompt",
    category: "Ad",
    placeholder: true,
  },
  {
    id: 5,
    title: "Fitness Brand Story",
    description: "Motivational social content",
    inputType: "Prompt",
    category: "Social",
    placeholder: true,
  },
  {
    id: 6,
    title: "Tech Startup Banner",
    description: "Professional B2B ad creative",
    inputType: "Web Address",
    category: "Ad",
    placeholder: true,
  },
];

const getCategoryIcon = (category: string) => {
  switch (category) {
    case "Ad":
      return <Sparkles className="h-4 w-4" />;
    case "Social":
      return <MessageSquare className="h-4 w-4" />;
    case "Visual":
      return <Image className="h-4 w-4" />;
    default:
      return <Sparkles className="h-4 w-4" />;
  }
};

const Examples = () => {
  const breadcrumbs = [
    { name: "Home", url: "/" },
    { name: "Examples", url: "/examples" },
  ];

  return (
    <>
      <PageMeta
        title="xiXoi™ Examples | AI-Generated Ads and Visuals"
        description={`See real examples of on-brand ads, product visuals, and social content created with ${BRAND.name}. ${CANONICAL_DEFINITION}`}
        canonicalPath="/examples"
      />
      <JsonLd
        data={[
          buildWebPageJsonLd({ url: "/examples", title: "xiXoi Examples" }),
          buildSoftwareApplicationJsonLd(),
          buildBreadcrumbJsonLd(breadcrumbs),
        ]}
      />
      <AppLayout>
        <div className="max-w-6xl mx-auto space-y-12">
          {/* Header */}
          <header className="text-center space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
              {BRAND.alternateName} Examples
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              {CANONICAL_DEFINITION} See what our AI can create for your brand.
            </p>
          </header>

          {/* Examples Grid */}
          <section className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {examples.map((example) => (
              <div 
                key={example.id}
                className="group bg-card border rounded-2xl overflow-hidden hover:shadow-lg transition-shadow"
              >
                {/* Image Placeholder */}
                <div className="aspect-[4/3] bg-muted flex items-center justify-center">
                  {example.placeholder ? (
                    <div className="text-center text-muted-foreground p-4">
                      <Video className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Example Coming Soon</p>
                    </div>
                  ) : (
                    <img 
                      src="" 
                      alt={example.title}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
                
                {/* Content */}
                <div className="p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary text-xs rounded-full">
                      {getCategoryIcon(example.category)}
                      {example.category}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      via {example.inputType}
                    </span>
                  </div>
                  <h3 className="font-semibold">{example.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {example.description}
                  </p>
                </div>
              </div>
            ))}
          </section>

          {/* CTA */}
          <section className="bg-muted/50 rounded-2xl p-8 text-center space-y-6">
            <h2 className="text-2xl font-bold">Create Your Own</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Ready to generate on-brand ads and visuals for your business? 
              Get started in under 60 seconds.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link 
                to="/auth"
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
              >
                Start Creating
                <Sparkles className="h-4 w-4" />
              </Link>
              <Link 
                to={AUTHORITY_LINKS.whatIsXixoi}
                className="inline-flex items-center gap-2 px-6 py-3 bg-card border rounded-lg font-medium hover:bg-muted transition-colors"
              >
                Learn More
              </Link>
            </div>
          </section>

          {/* Internal Links */}
          <nav className="border-t pt-8">
            <h3 className="text-lg font-medium text-muted-foreground mb-4">Explore More</h3>
            <div className="flex flex-wrap gap-4">
              <Link to={AUTHORITY_LINKS.whatIsXixoi} className="text-primary hover:underline">
                What is xiXoi?
              </Link>
              <Link to={AUTHORITY_LINKS.features} className="text-primary hover:underline">
                Features
              </Link>
              <Link to={AUTHORITY_LINKS.pricing} className="text-primary hover:underline">
                Pricing
              </Link>
              <Link to={AUTHORITY_LINKS.countries} className="text-primary hover:underline">
                Countries
              </Link>
            </div>
          </nav>
        </div>
        <div className="mt-16">
          <Footer />
        </div>
      </AppLayout>
    </>
  );
};

export default Examples;
