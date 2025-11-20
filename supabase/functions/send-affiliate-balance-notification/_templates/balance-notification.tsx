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

interface BalanceNotificationEmailProps {
  affiliateCode: string;
  currentBalance: number;
  amountNeeded: number;
  totalEarned: number;
  totalPaid: number;
  referralCount: number;
  dashboardUrl: string;
}

export const BalanceNotificationEmail = ({
  affiliateCode,
  currentBalance,
  amountNeeded,
  totalEarned,
  totalPaid,
  referralCount,
  dashboardUrl,
}: BalanceNotificationEmailProps) => (
  <Html>
    <Head />
    <Preview>Your xiXoi™ Affiliate Balance Update - ${currentBalance.toFixed(2)} Earned</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Your Affiliate Balance Update</Heading>
        
        <Text style={text}>
          Hi there,
        </Text>
        
        <Text style={text}>
          We wanted to give you a quick update on your xiXoi™ affiliate earnings! You're making great progress.
        </Text>

        <Section style={balanceBox}>
          <Heading style={balanceHeading}>Current Balance</Heading>
          <Text style={balanceAmount}>${currentBalance.toFixed(2)}</Text>
          <Text style={balanceSubtext}>
            You need <strong>${amountNeeded.toFixed(2)} more</strong> to reach the $100 automatic payout threshold
          </Text>
        </Section>

        <Section style={statsSection}>
          <Heading style={h2}>Your Earnings Summary</Heading>
          <table style={statsTable}>
            <tr>
              <td style={statsLabel}>Total Lifetime Earnings:</td>
              <td style={statsValue}>${totalEarned.toFixed(2)}</td>
            </tr>
            <tr>
              <td style={statsLabel}>Total Paid Out:</td>
              <td style={statsValue}>${totalPaid.toFixed(2)}</td>
            </tr>
            <tr>
              <td style={statsLabel}>Active Referrals:</td>
              <td style={statsValue}>{referralCount}</td>
            </tr>
            <tr>
              <td style={statsLabel}>Affiliate Code:</td>
              <td style={statsValue}>{affiliateCode}</td>
            </tr>
          </table>
        </Section>

        <Hr style={divider} />

        <Section style={infoSection}>
          <Heading style={h3}>How Automatic Payouts Work</Heading>
          <Text style={text}>
            Once you reach <strong>$100 in unpaid earnings</strong>, we'll automatically process your payout on the 1st of the next month. The funds will be deposited directly into your connected bank account via Stripe Connect within 3-5 business days.
          </Text>
          <Text style={text}>
            If you need to access your earnings before reaching $100, you can request a payout when closing your affiliate account. However, we encourage you to keep growing your balance to minimize transaction fees!
          </Text>
        </Section>

        <Section style={ctaSection}>
          <Heading style={h3}>Keep Growing Your Earnings</Heading>
          <Text style={text}>
            Here are some tips to reach $100 faster:
          </Text>
          <ul style={tipsList}>
            <li style={tipsItem}>Share your affiliate link on social media</li>
            <li style={tipsItem}>Create content reviews or tutorials about xiXoi™</li>
            <li style={tipsItem}>Email your network about the platform</li>
            <li style={tipsItem}>Use our ready-made marketing materials</li>
          </ul>
          
          <Link href={dashboardUrl} style={button}>
            View Your Dashboard
          </Link>
        </Section>

        <Hr style={divider} />

        <Text style={footer}>
          Questions about your affiliate account?{' '}
          <Link href="mailto:affiliates@xixoi.com" style={footerLink}>
            Contact our affiliate team
          </Link>
        </Text>
        
        <Text style={footer}>
          xiXoi™ — Paid Advertising for Every Human. And soon, robots too.
        </Text>
      </Container>
    </Body>
  </Html>
);

export default BalanceNotificationEmail;

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
  fontSize: '20px',
  fontWeight: 'bold',
  margin: '0 0 16px',
  padding: '0',
};

const h3 = {
  color: '#000000',
  fontSize: '18px',
  fontWeight: 'bold',
  margin: '0 0 12px',
  padding: '0',
};

const text = {
  color: '#333333',
  fontSize: '16px',
  lineHeight: '1.6',
  margin: '0 0 16px',
};

const balanceBox = {
  backgroundColor: '#f9f9f9',
  border: '2px solid #000000',
  borderRadius: '8px',
  padding: '24px',
  textAlign: 'center' as const,
  margin: '24px 0',
};

const balanceHeading = {
  color: '#666666',
  fontSize: '14px',
  fontWeight: '600',
  textTransform: 'uppercase' as const,
  letterSpacing: '1px',
  margin: '0 0 8px',
};

const balanceAmount = {
  color: '#000000',
  fontSize: '48px',
  fontWeight: 'bold',
  margin: '0 0 12px',
  lineHeight: '1',
};

const balanceSubtext = {
  color: '#666666',
  fontSize: '14px',
  margin: '0',
};

const statsSection = {
  margin: '32px 0',
};

const statsTable = {
  width: '100%',
  borderCollapse: 'collapse' as const,
};

const statsLabel = {
  color: '#666666',
  fontSize: '14px',
  padding: '8px 0',
  textAlign: 'left' as const,
};

const statsValue = {
  color: '#000000',
  fontSize: '16px',
  fontWeight: '600',
  padding: '8px 0',
  textAlign: 'right' as const,
};

const divider = {
  borderColor: '#e6e6e6',
  margin: '32px 0',
};

const infoSection = {
  margin: '24px 0',
};

const ctaSection = {
  margin: '32px 0',
};

const tipsList = {
  margin: '12px 0',
  paddingLeft: '24px',
};

const tipsItem = {
  color: '#333333',
  fontSize: '15px',
  lineHeight: '1.8',
  margin: '4px 0',
};

const button = {
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
