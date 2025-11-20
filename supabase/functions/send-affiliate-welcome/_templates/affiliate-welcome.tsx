import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Text,
  Section,
  Hr,
} from 'https://esm.sh/@react-email/components@0.0.22';
import * as React from 'https://esm.sh/react@18.3.1';

interface AffiliateWelcomeEmailProps {
  affiliateCode: string;
  affiliateLink: string;
  email: string;
}

export const AffiliateWelcomeEmail = ({
  affiliateCode,
  affiliateLink,
  email,
}: AffiliateWelcomeEmailProps) => (
  <Html>
    <Head />
    <Preview>Welcome to the xiXoi™ Affiliate Program - Start Earning 20% Today!</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Welcome to xiXoi™ Affiliates! 🎉</Heading>
        
        <Text style={text}>
          Congratulations! You're now part of the xiXoi™ Affiliate Program. We're excited to have you on board and help you earn recurring income promoting the future of AI-powered advertising.
        </Text>

        <Section style={linkBox}>
          <Heading style={linkHeading}>Your Unique Affiliate Link</Heading>
          <div style={codeBlock}>{affiliateLink}</div>
          <Text style={linkSubtext}>
            Share this link anywhere — social media, blog posts, videos, emails, or direct messages. Every signup through your link earns you commission!
          </Text>
          <Text style={linkSubtext}>
            <strong>Your Affiliate Code:</strong> {affiliateCode}
          </Text>
        </Section>

        <Hr style={divider} />

        <Section style={commissionSection}>
          <Heading style={h2}>💰 Your Commission Structure</Heading>
          <Text style={text}>
            You earn <strong>20% recurring commission</strong> on every subscription, every month, for as long as your referral stays subscribed. This is lifetime recurring income!
          </Text>
          
          <table style={commissionTable}>
            <tr style={tableHeader}>
              <td style={tableHeaderCell}>Plan</td>
              <td style={tableHeaderCell}>Price</td>
              <td style={tableHeaderCell}>Your Monthly Commission</td>
            </tr>
            <tr style={tableRow}>
              <td style={tableCellPlan}>Quick-Start</td>
              <td style={tableCell}>$49/mo</td>
              <td style={tableCellCommission}>$9.80/mo</td>
            </tr>
            <tr style={tableRow}>
              <td style={tableCellPlan}>Publish Pro</td>
              <td style={tableCell}>$99/mo</td>
              <td style={tableCellCommission}>$19.80/mo</td>
            </tr>
            <tr style={tableRow}>
              <td style={tableCellPlan}>Scale Elite</td>
              <td style={tableCell}>$199/mo</td>
              <td style={tableCellCommission}>$39.80/mo</td>
            </tr>
            <tr style={tableRow}>
              <td style={tableCellPlan}>Agency</td>
              <td style={tableCell}>$299/mo</td>
              <td style={tableCellCommission}>$59.80/mo</td>
            </tr>
          </table>

          <Text style={highlightText}>
            💡 Example: Refer just 10 Pro customers and earn <strong>$198/month</strong> in recurring income. That's <strong>$2,376/year</strong> from just 10 referrals!
          </Text>
        </Section>

        <Hr style={divider} />

        <Section style={payoutSection}>
          <Heading style={h2}>💸 How Payouts Work</Heading>
          <Text style={text}>
            • <strong>Automatic Monthly Payouts:</strong> Earn $100+ per month? We automatically deposit to your bank account on the 1st of each month via Stripe Connect.
          </Text>
          <Text style={text}>
            • <strong>Below $100?</strong> Keep growing your balance! You can request a payout when closing your account, but we encourage hitting $100 to minimize transaction fees.
          </Text>
          <Text style={text}>
            • <strong>30-Day Cookie:</strong> Your link stays active for 30 days. If someone signs up within that window, you get credit!
          </Text>
        </Section>

        <Hr style={divider} />

        <Section style={quickStartSection}>
          <Heading style={h2}>🚀 Quick Start Guide</Heading>
          
          <Heading style={h3}>Step 1: Connect Your Stripe Account</Heading>
          <Text style={text}>
            Before you start earning, connect your Stripe account for automatic payouts. This takes 2 minutes.
          </Text>
          <Link href="https://xixoi.com/payout-settings" style={button}>
            Connect Stripe Account
          </Link>

          <Heading style={h3}>Step 2: Share Your Link</Heading>
          <Text style={text}>
            The fastest way to get started:
          </Text>
          <ul style={tipsList}>
            <li style={tipsItem}><strong>Social Media:</strong> Post on Twitter, LinkedIn, Facebook, or Instagram with your link</li>
            <li style={tipsItem}><strong>YouTube/TikTok:</strong> Create a tutorial or review video and drop your link in the description</li>
            <li style={tipsItem}><strong>Blog/Website:</strong> Write a review or how-to guide featuring xiXoi™</li>
            <li style={tipsItem}><strong>Email List:</strong> Send a recommendation to your subscribers</li>
            <li style={tipsItem}><strong>Online Communities:</strong> Share in relevant Facebook groups, Reddit, or Discord servers (where allowed)</li>
          </ul>

          <Heading style={h3}>Step 3: Use Our Marketing Resources</Heading>
          <Text style={text}>
            We've created everything you need to promote xiXoi™ effectively:
          </Text>
          <ul style={tipsList}>
            <li style={tipsItem}>📝 <strong>Pre-Written Social Posts:</strong> Copy-paste ready content for Twitter, LinkedIn, Facebook</li>
            <li style={tipsItem}>✉️ <strong>Email Templates:</strong> Professional email copy to send your audience</li>
            <li style={tipsItem}>🎬 <strong>Video Scripts:</strong> Teleprompter-ready scripts for 60-second demos and 2-minute reviews</li>
            <li style={tipsItem}>🎨 <strong>Banner Graphics:</strong> Professional banners in all sizes (1200×628, 1080×1080, 1080×1920)</li>
          </ul>
          <Link href="https://xixoi.com/influencers#marketing-resources" style={button}>
            Get Marketing Resources
          </Link>
        </Section>

        <Hr style={divider} />

        <Section style={tipsSection}>
          <Heading style={h2}>💡 Pro Tips for Success</Heading>
          <Text style={text}>
            <strong>1. Lead with the problem:</strong> "Tired of spending hours creating ads?" is more compelling than "Check out this tool."
          </Text>
          <Text style={text}>
            <strong>2. Show, don't just tell:</strong> Create a screen recording showing how fast xiXoi™ generates ads (under 60 seconds).
          </Text>
          <Text style={text}>
            <strong>3. Target small business owners:</strong> Local businesses, realtors, e-commerce stores, and creators are your ideal audience.
          </Text>
          <Text style={text}>
            <strong>4. Highlight the AI automation:</strong> People love that xiXoi™ requires zero design skills or marketing knowledge.
          </Text>
          <Text style={text}>
            <strong>5. Emphasize multi-platform publishing:</strong> One click publishes to Meta, TikTok, Google, LinkedIn, and X simultaneously.
          </Text>
        </Section>

        <Hr style={divider} />

        <Section style={ctaSection}>
          <Heading style={h2}>Ready to Start Earning?</Heading>
          <Text style={text}>
            Track your clicks, conversions, and earnings in real-time on your affiliate dashboard.
          </Text>
          <Link href="https://xixoi.com/affiliates" style={buttonPrimary}>
            Go to Your Dashboard
          </Link>
        </Section>

        <Hr style={divider} />

        <Text style={footer}>
          Questions? Contact our affiliate team at{' '}
          <Link href="mailto:affiliates@xixoi.com" style={footerLink}>
            affiliates@xixoi.com
          </Link>
        </Text>
        
        <Text style={footer}>
          xiXoi™ — Paid Advertising for Every Human. And soon, robots too.
        </Text>
      </Container>
    </Body>
  </Html>
);

export default AffiliateWelcomeEmail;

const main = {
  backgroundColor: '#f6f6f6',
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '40px 20px',
  maxWidth: '600px',
  borderRadius: '8px',
};

const h1 = {
  color: '#000000',
  fontSize: '28px',
  fontWeight: 'bold',
  margin: '0 0 24px',
  padding: '0',
  lineHeight: '1.3',
};

const h2 = {
  color: '#000000',
  fontSize: '22px',
  fontWeight: 'bold',
  margin: '24px 0 16px',
  padding: '0',
};

const h3 = {
  color: '#000000',
  fontSize: '18px',
  fontWeight: 'bold',
  margin: '20px 0 12px',
  padding: '0',
};

const text = {
  color: '#333333',
  fontSize: '16px',
  lineHeight: '1.6',
  margin: '0 0 16px',
};

const linkBox = {
  backgroundColor: '#f9f9f9',
  border: '2px solid #000000',
  borderRadius: '8px',
  padding: '24px',
  margin: '24px 0',
};

const linkHeading = {
  color: '#000000',
  fontSize: '18px',
  fontWeight: 'bold',
  margin: '0 0 16px',
  textAlign: 'center' as const,
};

const codeBlock = {
  display: 'block',
  backgroundColor: '#000000',
  color: '#ffffff',
  padding: '16px',
  borderRadius: '6px',
  fontSize: '14px',
  fontFamily: 'monospace',
  wordBreak: 'break-all' as const,
  margin: '0 0 16px',
  textAlign: 'center' as const,
};

const linkSubtext = {
  color: '#666666',
  fontSize: '14px',
  margin: '8px 0',
  textAlign: 'center' as const,
};

const divider = {
  borderColor: '#e6e6e6',
  margin: '32px 0',
};

const commissionSection = {
  margin: '24px 0',
};

const commissionTable = {
  width: '100%',
  borderCollapse: 'collapse' as const,
  margin: '20px 0',
  border: '1px solid #e6e6e6',
};

const tableHeader = {
  backgroundColor: '#f9f9f9',
};

const tableHeaderCell = {
  color: '#000000',
  fontSize: '14px',
  fontWeight: 'bold',
  padding: '12px',
  textAlign: 'left' as const,
  borderBottom: '2px solid #e6e6e6',
};

const tableRow = {
  borderBottom: '1px solid #f0f0f0',
};

const tableCellPlan = {
  color: '#000000',
  fontSize: '15px',
  fontWeight: '600',
  padding: '12px',
};

const tableCell = {
  color: '#666666',
  fontSize: '15px',
  padding: '12px',
};

const tableCellCommission = {
  color: '#000000',
  fontSize: '16px',
  fontWeight: 'bold',
  padding: '12px',
};

const highlightText = {
  backgroundColor: '#fff9e6',
  border: '1px solid #ffd700',
  borderRadius: '6px',
  padding: '16px',
  color: '#333333',
  fontSize: '16px',
  lineHeight: '1.6',
  margin: '20px 0',
};

const payoutSection = {
  margin: '24px 0',
};

const quickStartSection = {
  margin: '24px 0',
};

const tipsSection = {
  margin: '24px 0',
};

const tipsList = {
  margin: '12px 0',
  paddingLeft: '24px',
};

const tipsItem = {
  color: '#333333',
  fontSize: '15px',
  lineHeight: '1.8',
  margin: '8px 0',
};

const button = {
  backgroundColor: '#ffffff',
  border: '2px solid #000000',
  borderRadius: '6px',
  color: '#000000',
  fontSize: '16px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 28px',
  margin: '12px 0',
};

const buttonPrimary = {
  backgroundColor: '#000000',
  borderRadius: '6px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '14px 32px',
  margin: '20px 0',
};

const ctaSection = {
  textAlign: 'center' as const,
  margin: '32px 0',
};

const footer = {
  color: '#999999',
  fontSize: '12px',
  lineHeight: '1.6',
  margin: '8px 0',
  textAlign: 'center' as const,
};

const footerLink = {
  color: '#666666',
  textDecoration: 'underline',
};
