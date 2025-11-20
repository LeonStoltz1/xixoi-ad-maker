import { AppLayout } from "@/components/layout/AppLayout";
import { Footer } from "@/components/Footer";

const About = () => {
  return (
    <AppLayout title="About xiXoi™">
      <main className="flex-1 container max-w-4xl mx-auto">
        
        <div className="space-y-8 text-foreground">
          <section>
            <h2 className="text-2xl font-semibold mb-4">Company Background</h2>
            <p className="mb-4">
              xiXoi™ is a product of STOLTZ ONE LLC, a technology company based in Georgia. We're building the future of digital advertising by making it accessible to everyone—regardless of technical expertise or marketing budget.
            </p>
            <p>
              Founded on the principle that advertising should be instant and effortless, xiXoi™ eliminates the complexity of traditional ad platforms and replaces it with AI-powered automation that works in seconds.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Our Mission</h2>
            <p className="mb-4 text-xl font-medium">
              "Instant Ads for Everyone."
            </p>
            <p className="mb-4">
              We believe that creating and publishing high-performing ads shouldn't require a marketing degree, weeks of setup, or thousands of dollars in agency fees. xiXoi™ democratizes digital advertising through three simple steps:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong>Upload.</strong> Share your product, service, or idea.</li>
              <li><strong>Pay.</strong> Fund your campaign with transparent pricing.</li>
              <li><strong>Publish.</strong> Your ad goes live across Meta, TikTok, Google, LinkedIn, and X.</li>
            </ul>
            <p className="mt-4">
              No ad accounts. No setup. No friction. Just results.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">What We Do</h2>
            <p className="mb-4">
              xiXoi™ is a fully-managed AI advertising platform that runs campaigns through our verified master accounts across all major ad platforms. This means:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>You never need to create Business Manager accounts</li>
              <li>You never deal with platform verification or approval processes</li>
              <li>You never connect OAuth or manage API credentials</li>
              <li>Your ads launch in under 60 seconds from upload to live</li>
            </ul>
            <p className="mt-4">
              We handle the complexity. You focus on your business.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Specialized Features</h2>
            <p className="mb-4">
              Beyond standard advertising, xiXoi™ offers specialized modes for:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong>Real Estate Professionals:</strong> Fair Housing compliant ads with structured property forms and auto-generated legal footers</li>
              <li><strong>Political Candidates:</strong> FEC-compliant political advertising with KYC verification, dual watermarking, and public verification portals</li>
            </ul>
            <p className="mt-4">
              These aren't separate products—they're optional modes within xiXoi™ that unlock when you need them.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Technology</h2>
            <p className="mb-4">
              xiXoi™ is powered by:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Advanced AI models for copy generation, visual analysis, and compliance checking</li>
              <li>Secure Stripe payment processing with transparent pricing</li>
              <li>Direct integrations with Meta, TikTok, Google Ads, LinkedIn, and X</li>
              <li>Real-time campaign analytics and performance tracking</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Contact Information</h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Company</h3>
                <p>STOLTZ ONE LLC</p>
                <p>Based in Georgia</p>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">Support</h3>
                <p>For technical support, billing inquiries, or general questions:</p>
                <p className="mt-2">Email: <a href="mailto:info@stoltzone.com" className="underline">info@stoltzone.com</a></p>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">Business Inquiries</h3>
                <p>For partnership opportunities, API access, or enterprise solutions:</p>
                <p className="mt-2">Email: <a href="mailto:business@xixoi.com" className="underline">business@xixoi.com</a></p>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">Legal</h3>
                <p>Read our <a href="/privacy" className="underline">Privacy Policy</a> and <a href="/terms" className="underline">Terms of Service</a>.</p>
              </div>
            </div>
          </section>

          <section className="pt-8 border-t border-border">
            <p className="text-sm text-muted-foreground">
              xiXoi™ is a trademark of STOLTZ ONE LLC. All rights reserved.
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </AppLayout>
  );
};

export default About;
