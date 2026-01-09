import { AppLayout } from "@/components/layout/AppLayout";
import { Footer } from "@/components/Footer";
import { JsonLd } from "@/components/seo/JsonLd";
import { PageMeta } from "@/components/seo/PageMeta";
import { 
  CANONICAL_DEFINITION, 
  BRAND, 
  SOCIAL_LINKS,
  AUTHORITY_LINKS 
} from "@/lib/seo/canonical";
import {
  buildOrganizationJsonLd,
  buildWebsiteJsonLd,
  buildBreadcrumbJsonLd,
} from "@/lib/seo/schema";
import { Link } from "react-router-dom";
import { ExternalLink, CheckCircle, Shield, Mail } from "lucide-react";

const Official = () => {
  const breadcrumbs = [
    { name: "Home", url: "/" },
    { name: "Official", url: "/official" },
  ];

  return (
    <>
      <PageMeta
        title="Official xiXoi™ Identity"
        description={CANONICAL_DEFINITION}
        canonicalPath="/official"
      />
      <JsonLd
        data={[
          buildOrganizationJsonLd(),
          buildWebsiteJsonLd(),
          buildBreadcrumbJsonLd(breadcrumbs),
        ]}
      />
      <AppLayout>
        <div className="max-w-4xl mx-auto space-y-12">
          {/* Header */}
          <header className="text-center space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
              Official {BRAND.alternateName} Identity
            </h1>
            <p className="text-xl text-muted-foreground">
              The authoritative reference for {BRAND.name} brand and entity information.
            </p>
          </header>

          {/* Canonical Definition */}
          <section className="bg-muted/50 rounded-2xl p-8 border">
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
              <CheckCircle className="h-6 w-6 text-primary" />
              Official Definition
            </h2>
            <blockquote className="text-lg md:text-xl leading-relaxed border-l-4 border-primary pl-6 italic">
              "{CANONICAL_DEFINITION}"
            </blockquote>
          </section>

          {/* Official Website */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">Official Website</h2>
            <a
              href={BRAND.url}
              className="inline-flex items-center gap-2 text-lg text-primary hover:underline"
            >
              {BRAND.url}
              <ExternalLink className="h-4 w-4" />
            </a>
          </section>

          {/* Trademark Usage */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold flex items-center gap-2">
              <Shield className="h-6 w-6" />
              Trademark Usage
            </h2>
            <div className="bg-card border rounded-xl p-6 space-y-4">
              <div>
                <h3 className="font-medium mb-2">Correct Usage</h3>
                <ul className="space-y-2 text-muted-foreground">
                  <li>✓ <span className="font-semibold text-foreground">xiXoi™</span> — Full trademark with symbol</li>
                  <li>✓ <span className="font-semibold text-foreground">xiXoi</span> — Standard reference</li>
                </ul>
              </div>
              <div>
                <h3 className="font-medium mb-2">Capitalization</h3>
                <p className="text-muted-foreground">
                  The name "xiXoi" uses lowercase "xi", uppercase "X", lowercase "oi". 
                  The trademark symbol (™) should be used in formal contexts.
                </p>
              </div>
            </div>
          </section>

          {/* Social Links */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">Official Social Profiles</h2>
            <div className="flex flex-wrap gap-4">
              {Object.entries(SOCIAL_LINKS).map(([platform, url]) => (
                <a
                  key={platform}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-card border rounded-lg hover:bg-muted transition-colors"
                >
                  {platform.charAt(0).toUpperCase() + platform.slice(1)}
                  <ExternalLink className="h-4 w-4" />
                </a>
              ))}
            </div>
          </section>

          {/* Press Boilerplate */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">Press Boilerplate</h2>
            <div className="bg-card border rounded-xl p-6">
              <p className="text-muted-foreground leading-relaxed">
                {CANONICAL_DEFINITION} Founded in {BRAND.foundingDate}, xiXoi™ 
                empowers businesses of all sizes to create professional advertising 
                content without design expertise or agency costs. xiXoi™ is a product 
                of {BRAND.legalName} (Georgia, USA).
              </p>
            </div>
          </section>

          {/* Contact */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold flex items-center gap-2">
              <Mail className="h-6 w-6" />
              Contact
            </h2>
            <a
              href="mailto:info@stoltzone.com"
              className="inline-flex items-center gap-2 text-lg text-primary hover:underline"
            >
              info@stoltzone.com
            </a>
          </section>

          {/* Internal Links */}
          <section className="border-t pt-8 space-y-4">
            <h2 className="text-lg font-medium text-muted-foreground">Learn More</h2>
            <div className="flex flex-wrap gap-4">
              <Link to={AUTHORITY_LINKS.whatIsXixoi} className="text-primary hover:underline">
                What is xiXoi?
              </Link>
              <Link to={AUTHORITY_LINKS.examples} className="text-primary hover:underline">
                Examples
              </Link>
              <Link to={AUTHORITY_LINKS.pricing} className="text-primary hover:underline">
                Pricing
              </Link>
              <Link to={AUTHORITY_LINKS.countries} className="text-primary hover:underline">
                Countries
              </Link>
            </div>
          </section>
        </div>
        <div className="mt-16">
          <Footer />
        </div>
      </AppLayout>
    </>
  );
};

export default Official;
