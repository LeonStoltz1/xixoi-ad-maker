import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";

const Terms = () => {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main className="max-w-[720px] mx-auto px-6 py-24">
        <h1 className="text-3xl md:text-4xl font-bold mb-8">Terms of Service</h1>
        <p className="text-sm text-black/60 mb-12">Last updated: {new Date().toLocaleDateString()}</p>

        <section className="space-y-8">
          <div>
            <h2 className="text-xl md:text-2xl font-semibold mb-4">1. Agreement to Terms</h2>
            <p>By accessing or using xiXoi™ ("the Platform"), you agree to be bound by these Terms of Service. If you do not agree, you may not use the Platform.</p>
          </div>

          <div>
            <h2 className="text-xl md:text-2xl font-semibold mb-4">2. Description of Service</h2>
            <p className="mb-4">xiXoi™ is an AI-powered advertising platform that enables users to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Upload content (images, videos, text descriptions)</li>
              <li>Generate AI-optimized ad variants for Meta, TikTok, Google Ads, LinkedIn, and X</li>
              <li>Publish campaigns through xiXoi™'s verified partner ad accounts</li>
              <li>Track ad spend and performance (Elite/Agency tiers)</li>
            </ul>
          </div>

          <div>
            <h2 className="text-xl md:text-2xl font-semibold mb-4">3. User Eligibility</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>You must be at least 18 years old to use xiXoi™</li>
              <li>You must provide accurate account information</li>
              <li>You must comply with all applicable laws and ad platform policies</li>
              <li>Business users must have authority to bind their organization</li>
            </ul>
          </div>

          <div>
            <h2 className="text-xl md:text-2xl font-semibold mb-4">4. Account Responsibilities</h2>
            <p>You are responsible for:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Maintaining the confidentiality of your login credentials</li>
              <li>All activities conducted under your account</li>
              <li>Compliance with Meta, TikTok, Google Ads, LinkedIn, and X advertising policies</li>
              <li>Ad spend incurred on connected platforms</li>
              <li>Content uploaded to xiXoi™ (must own rights or have permission)</li>
            </ul>
          </div>

          <div>
            <h2 className="text-xl md:text-2xl font-semibold mb-4">5. Prohibited Uses</h2>
            <p className="mb-4">You may NOT use xiXoi™ to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Violate any laws or regulations</li>
              <li>Infringe intellectual property rights</li>
              <li>Promote illegal products, hate speech, or discriminatory content</li>
              <li>Upload malware, viruses, or harmful code</li>
              <li>Circumvent platform security measures or rate limits</li>
              <li>Scrape or reverse-engineer the Platform</li>
              <li>Use the Platform for unauthorized advertising purposes</li>
            </ul>
          </div>

          <div>
            <h2 className="text-xl md:text-2xl font-semibold mb-4">6. Pricing & Payment</h2>
            <p className="mb-4">xiXoi™ offers four pricing tiers:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>FREE:</strong> 1 ad/day, watermark required</li>
              <li><strong>PUBLISH PRO:</strong> $29/campaign (one-time) or $99/month (unlimited)</li>
              <li><strong>SCALE ELITE:</strong> $199/month + 5% of ad spend</li>
              <li><strong>AGENCY WHITE-LABEL:</strong> $999/month</li>
            </ul>
            <p className="mt-4">Payments processed via Stripe. Subscriptions auto-renew unless canceled. Refunds NOT available for one-time purchases after ad publishing.</p>
          </div>

          <div>
            <h2 className="text-xl md:text-2xl font-semibold mb-4">7. Ad Spend Billing (Elite/Agency Only)</h2>
            <p>Scale Elite users are billed 5% of total ad spend across all connected platforms. Billing occurs monthly via Stripe invoice. You authorize xiXoi™ to access ad spend data from connected platforms for billing purposes.</p>
          </div>

          <div>
            <h2 className="text-xl md:text-2xl font-semibold mb-4">8. OAuth & Platform Connections</h2>
            <p>By connecting ad platforms (Meta, TikTok, Google, LinkedIn, X):</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>You grant xiXoi™ permission to publish ads on your behalf</li>
              <li>You remain solely responsible for ad spend and compliance with platform policies</li>
              <li>xiXoi™ is NOT liable for platform policy violations, account suspensions, or ad disapprovals</li>
              <li>You can revoke access anytime via platform settings or xiXoi™ dashboard</li>
            </ul>
          </div>

          <div>
            <h2 className="text-xl md:text-2xl font-semibold mb-4">9. Content Ownership & License</h2>
            <p>You retain ownership of uploaded content. By using xiXoi™, you grant us a worldwide, non-exclusive license to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Process and generate ad variants using AI</li>
              <li>Publish content to connected ad platforms</li>
              <li>Store content for campaign management purposes</li>
            </ul>
            <p className="mt-4">This license terminates when you delete campaigns or your account.</p>
          </div>

          <div>
            <h2 className="text-xl md:text-2xl font-semibold mb-4">10. AI-Generated Content Disclaimer</h2>
            <p>xiXoi™ uses AI to generate ad copy, headlines, and targeting suggestions. While we strive for accuracy:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>AI outputs may contain errors or inaccuracies</li>
              <li>You are responsible for reviewing and approving all generated content before publishing</li>
              <li>xiXoi™ is NOT liable for AI-generated content that violates platform policies</li>
            </ul>
          </div>

          <div>
            <h2 className="text-xl md:text-2xl font-semibold mb-4">11. Disclaimers & Limitation of Liability</h2>
            <p className="mb-4">xiXoi™ is provided "AS IS" without warranties of any kind. We do NOT guarantee:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Ad performance, ROAS, or campaign success</li>
              <li>Uninterrupted or error-free service</li>
              <li>Approval of ads by third-party platforms</li>
            </ul>
            <p className="mt-4">xiXoi™ is NOT liable for indirect, incidental, or consequential damages including lost profits, data loss, or business interruption. Maximum liability limited to amount paid in last 12 months.</p>
          </div>

          <div>
            <h2 className="text-xl md:text-2xl font-semibold mb-4">12. Indemnification</h2>
            <p>You agree to indemnify xiXoi™ from claims arising from:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Your use of the Platform</li>
              <li>Uploaded content or advertising materials</li>
              <li>Violations of these Terms or third-party rights</li>
              <li>Ad platform policy violations</li>
            </ul>
          </div>

          <div>
            <h2 className="text-xl md:text-2xl font-semibold mb-4">13. Termination</h2>
            <p>We may suspend or terminate your account for:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Violations of these Terms</li>
              <li>Fraudulent activity or payment disputes</li>
              <li>Abuse of the Platform</li>
            </ul>
            <p className="mt-4">You may delete your account anytime at <a href="/delete-account" className="underline">xixoi.com/delete-account</a></p>
          </div>

          <div>
            <h2 className="text-xl md:text-2xl font-semibold mb-4">14. Governing Law</h2>
            <p>These Terms are governed by the laws of the State of Georgia, United States. Disputes resolved via binding arbitration in Georgia, USA.</p>
          </div>

          <div>
            <h2 className="text-xl md:text-2xl font-semibold mb-4">15. Changes to Terms</h2>
            <p>We may update these Terms periodically. Continued use after changes constitutes acceptance. Material changes will be notified via email.</p>
          </div>

          <div>
            <h2 className="text-xl md:text-2xl font-semibold mb-4">16. Contact Information</h2>
            <p>For questions about these Terms:</p>
            <p className="mt-4">
              <strong>Email:</strong> legal@xixoi.com<br />
              <strong>Company:</strong> STOLTZ ONE LLC<br />
              <strong>Location:</strong> Georgia, USA<br />
              <strong>Product:</strong> xiXoi™ (a product of STOLTZ ONE LLC)
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Terms;
