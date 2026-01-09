import { AppLayout } from "@/components/layout/AppLayout";
import { Footer } from "@/components/Footer";
import { JsonLd } from "@/components/seo/JsonLd";
import { PageMeta } from "@/components/seo/PageMeta";
import { 
  CANONICAL_DEFINITION, 
  GEO_CONFIG,
  AUTHORITY_LINKS 
} from "@/lib/seo/canonical";
import {
  buildBreadcrumbJsonLd,
  buildWebPageJsonLd,
} from "@/lib/seo/schema";
import { Link } from "react-router-dom";
import { Globe, MapPin, ArrowRight } from "lucide-react";

const Countries = () => {
  const breadcrumbs = [
    { name: "Home", url: "/" },
    { name: "Countries", url: "/countries" },
  ];

  return (
    <>
      <PageMeta
        title="xiXoi™ Countries | AI Ad Creation Worldwide"
        description={`${CANONICAL_DEFINITION} Explore xiXoi availability across the United States, United Kingdom, Canada, and Australia.`}
        canonicalPath="/countries"
      />
      <JsonLd
        data={[
          buildWebPageJsonLd({ url: "/countries", title: "xiXoi Countries" }),
          buildBreadcrumbJsonLd(breadcrumbs),
        ]}
      />
      <AppLayout>
        <div className="max-w-4xl mx-auto space-y-12">
          {/* Header */}
          <header className="text-center space-y-4">
            <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-primary/10 mx-auto">
              <Globe className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
              xiXoi™ Countries
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              {CANONICAL_DEFINITION}
            </p>
          </header>

          {/* Countries Grid */}
          <section className="grid sm:grid-cols-2 gap-6">
            {GEO_CONFIG.countries.map((country) => (
              <Link
                key={country.slug}
                to={`/countries/${country.slug}`}
                className="group bg-card border rounded-2xl p-6 hover:shadow-lg hover:border-primary/50 transition-all"
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <h2 className="text-2xl font-semibold group-hover:text-primary transition-colors">
                      {country.name}
                    </h2>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span>{country.cities.length} major cities</span>
                    </div>
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {country.cities.slice(0, 3).map((city) => (
                    <span
                      key={city.slug}
                      className="px-2 py-1 bg-muted text-xs rounded-full"
                    >
                      {city.name}
                    </span>
                  ))}
                  {country.cities.length > 3 && (
                    <span className="px-2 py-1 text-xs text-muted-foreground">
                      +{country.cities.length - 3} more
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </section>

          {/* CTA */}
          <section className="bg-muted/50 rounded-2xl p-8 text-center space-y-4">
            <h2 className="text-2xl font-bold">Available Worldwide</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              While we highlight key markets, xiXoi works for businesses everywhere. 
              Create on-brand ads no matter where you're based.
            </p>
            <Link 
              to="/auth"
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
            >
              Get Started
              <ArrowRight className="h-4 w-4" />
            </Link>
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
              <Link to={AUTHORITY_LINKS.pricing} className="text-primary hover:underline">
                Pricing
              </Link>
              <Link to={AUTHORITY_LINKS.official} className="text-primary hover:underline">
                Official
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

export default Countries;
