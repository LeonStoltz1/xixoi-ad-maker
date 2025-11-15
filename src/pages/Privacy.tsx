import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";

const Privacy = () => {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main className="max-w-[720px] mx-auto px-6 py-24">
        <h1 className="text-3xl md:text-4xl font-bold mb-8">Privacy Policy</h1>
        <p className="text-sm text-black/60 mb-12">Last updated: {new Date().toLocaleDateString()}</p>

        <section className="space-y-8">
          <div>
            <h2 className="text-xl md:text-2xl font-semibold mb-4">1. Information We Collect</h2>
            <p className="mb-4">xiXoi™ collects the following types of information:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Account Information:</strong> Email address, full name, OAuth tokens from connected ad platforms (Meta, TikTok, Google Ads, LinkedIn, X)</li>
              <li><strong>Campaign Data:</strong> Uploaded content (images, videos, text), generated ad variants, targeting preferences, daily budget settings</li>
              <li><strong>Payment Information:</strong> Processed securely via Stripe (we do not store credit card details)</li>
              <li><strong>Ad Spend Data:</strong> Total spend per platform, billing period, currency, campaign performance metrics</li>
              <li><strong>Usage Data:</strong> Login timestamps, campaign creation events, subscription status</li>
            </ul>
          </div>

          <div>
            <h2 className="text-xl md:text-2xl font-semibold mb-4">2. How We Use Your Information</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Create and publish advertising campaigns on connected platforms</li>
              <li>Generate AI-powered ad variants optimized for each platform</li>
              <li>Process payments and manage subscriptions</li>
              <li>Track ad spend and calculate percentage-based billing (Elite/Agency tiers)</li>
              <li>Provide customer support and improve platform functionality</li>
              <li>Comply with legal obligations and enforce Terms of Service</li>
            </ul>
          </div>

          <div>
            <h2 className="text-xl md:text-2xl font-semibold mb-4">3. Data Sharing & Third Parties</h2>
            <p className="mb-4">We share data with the following third parties:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Ad Platforms:</strong> Meta, TikTok, Google Ads, LinkedIn, X (campaign data, targeting settings, creative assets)</li>
              <li><strong>Payment Processor:</strong> Stripe (payment information, subscription status)</li>
              <li><strong>AI Providers:</strong> Lovable AI (content analysis for ad generation)</li>
              <li><strong>Cloud Infrastructure:</strong> Supabase (data storage, authentication)</li>
            </ul>
            <p className="mt-4">We do NOT sell your personal information to third parties.</p>
          </div>

          <div>
            <h2 className="text-xl md:text-2xl font-semibold mb-4">4. Data Retention</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Active Users:</strong> Data retained for duration of account activity</li>
              <li><strong>Deleted Accounts:</strong> All user data permanently deleted within 30 days of account deletion request</li>
              <li><strong>Ad Spend Records:</strong> Retained for 7 years for tax/accounting compliance</li>
              <li><strong>OAuth Tokens:</strong> Deleted immediately upon platform disconnection or account deletion</li>
            </ul>
          </div>

          <div>
            <h2 className="text-2xl font-semibold mb-4">5. Data Security</h2>
            <p>xiXoi™ implements industry-standard security measures:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>OAuth tokens encrypted at rest using AES-256</li>
              <li>HTTPS/TLS encryption for all data in transit</li>
              <li>Row-Level Security (RLS) policies on all database tables</li>
              <li>Regular security audits and vulnerability scanning</li>
              <li>Stripe PCI-DSS compliant payment processing</li>
            </ul>
          </div>

          <div>
            <h2 className="text-2xl font-semibold mb-4">6. Your Rights (GDPR & CCPA)</h2>
            <p className="mb-4">You have the right to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Access:</strong> Request a copy of your personal data</li>
              <li><strong>Correction:</strong> Update inaccurate or incomplete information</li>
              <li><strong>Deletion:</strong> Request permanent deletion of your account and all associated data</li>
              <li><strong>Portability:</strong> Export your campaign data in machine-readable format</li>
              <li><strong>Opt-Out:</strong> Unsubscribe from marketing emails (does not affect transactional emails)</li>
            </ul>
            <p className="mt-4">To exercise these rights, visit <a href="/delete-account" className="underline">xixoi.com/delete-account</a> or contact privacy@xixoi.com</p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold mb-4">7. Cookies & Tracking</h2>
            <p>xiXoi™ uses essential cookies for:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>User authentication and session management</li>
              <li>Payment processing (Stripe)</li>
              <li>Platform performance monitoring</li>
            </ul>
            <p className="mt-4">We do NOT use third-party advertising or analytics cookies.</p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold mb-4">8. Children's Privacy</h2>
            <p>xiXoi™ is not intended for users under 18 years of age. We do not knowingly collect data from children.</p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold mb-4">9. Changes to This Policy</h2>
            <p>We may update this Privacy Policy periodically. Changes will be posted on this page with an updated "Last updated" date. Continued use of xiXoi™ after changes constitutes acceptance.</p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold mb-4">10. Contact Us</h2>
            <p>For privacy-related questions or data requests:</p>
            <p className="mt-4">
              <strong>Email:</strong> privacy@xixoi.com<br />
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

export default Privacy;
