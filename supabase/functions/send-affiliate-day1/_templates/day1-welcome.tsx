import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
  Hr,
} from 'npm:@react-email/components@0.0.22';
import * as React from 'npm:react@18.3.1';

interface Day1WelcomeProps {
  affiliateName: string;
  referralLink: string;
  referralCode: string;
  dashboardUrl: string;
}

export const Day1Welcome = ({
  affiliateName,
  referralLink,
  referralCode,
  dashboardUrl,
}: Day1WelcomeProps) => (
  <Html>
    <Head />
    <Preview>Welcome to the xiXoi Affiliate Program - Let's earn your first $500!</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>🎉 Welcome to xiXoi Affiliates!</Heading>
        
        <Text style={text}>
          Hey {affiliateName},
        </Text>
        
        <Text style={text}>
          You're now part of the most profitable affiliate program in AI ads. 
          Here's everything you need to start earning <strong>50% recurring commissions for 12 months</strong>.
        </Text>

        <Section style={codeBox}>
          <Text style={codeLabel}>Your Referral Link:</Text>
          <Link href={referralLink} style={linkStyle}>
            {referralLink}
          </Link>
          <Text style={codeLabel} style={{marginTop: '12px'}}>Your Code: <strong>{referralCode}</strong></Text>
        </Section>

        <Hr style={divider} />

        <Heading style={h2}>🚀 The "First $500" Challenge</Heading>
        <Text style={text}>
          Over the next 7 days, we'll send you everything you need to earn your first $500:
        </Text>
        
        <ul style={list}>
          <li><strong>Day 1 (Today):</strong> Your link + first scripts</li>
          <li><strong>Day 2:</strong> 3 viral hooks that convert</li>
          <li><strong>Day 3:</strong> Faceless content kit (no camera needed)</li>
          <li><strong>Day 4:</strong> Turn 1 video into 12 posts</li>
          <li><strong>Day 5:</strong> How to get 10 signups/week</li>
          <li><strong>Day 6:</strong> Advanced tactics (duets, trends)</li>
          <li><strong>Day 7:</strong> Challenge completion bonus!</li>
        </ul>

        <Hr style={divider} />

        <Heading style={h2}>📋 Your First 3 Scripts</Heading>
        
        <Section style={scriptBox}>
          <Text style={scriptTitle}>Script #1: "The Tool No One Knows About"</Text>
          <Text style={scriptText}>
            "You're leaving money on the table if you aren't using this... I found this AI tool called xiXoi that creates full ads for small businesses in 60 seconds. Copy, image, targeting—everything. I became an affiliate and they're paying 50% recurring commissions for 12 months for every paid user. Click my link and see it yourself."
          </Text>
        </Section>

        <Section style={scriptBox}>
          <Text style={scriptTitle}>Script #2: "Watch Me Make Money"</Text>
          <Text style={scriptText}>
            "Watch me make passive income using AI... I promote xiXoi—it's an AI ad creator. Every time someone signs up, I get paid 50% for 12 months. I don't need clients. Just post videos, tutorials, or reviews. Use my link to test the tool for free."
          </Text>
        </Section>

        <Section style={scriptBox}>
          <Text style={scriptTitle}>Script #3: "Agency Hack"</Text>
          <Text style={scriptText}>
            "I replaced my ad agency with this... [Show xiXoi generating an ad on screen] I became an affiliate because the tool sells itself. Link in bio."
          </Text>
        </Section>

        <Hr style={divider} />

        <Section style={ctaSection}>
          <Link href={dashboardUrl} style={button}>
            View Your Dashboard
          </Link>
          <Text style={{...text, textAlign: 'center', marginTop: '16px'}}>
            Track clicks, signups, and earnings in real-time
          </Text>
        </Section>

        <Hr style={divider} />

        <Text style={footer}>
          Questions? Reply to this email or visit your{' '}
          <Link href={dashboardUrl} style={link}>
            affiliate dashboard
          </Link>
          .
        </Text>

        <Text style={footer}>
          <strong>xiXoi™</strong> - Paid Advertising for Every Human
          <br />
          A product of STOLTZ ONE LLC
        </Text>
      </Container>
    </Body>
  </Html>
);

export default Day1Welcome;

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
  maxWidth: '600px',
};

const h1 = {
  color: '#000',
  fontSize: '32px',
  fontWeight: 'bold',
  margin: '40px 0',
  padding: '0 40px',
  lineHeight: '1.2',
};

const h2 = {
  color: '#000',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '30px 0 20px',
  padding: '0 40px',
};

const text = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '26px',
  margin: '16px 0',
  padding: '0 40px',
};

const list = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '26px',
  marginLeft: '40px',
  paddingLeft: '20px',
};

const codeBox = {
  background: '#f4f4f4',
  borderRadius: '8px',
  margin: '24px 40px',
  padding: '24px',
  border: '1px solid #e0e0e0',
};

const codeLabel = {
  color: '#666',
  fontSize: '14px',
  fontWeight: 'bold',
  margin: '0 0 8px 0',
};

const linkStyle = {
  color: '#000',
  fontSize: '14px',
  fontFamily: 'monospace',
  wordBreak: 'break-all',
};

const scriptBox = {
  background: '#fafafa',
  borderLeft: '4px solid #000',
  margin: '16px 40px',
  padding: '16px',
};

const scriptTitle = {
  color: '#000',
  fontSize: '16px',
  fontWeight: 'bold',
  margin: '0 0 12px 0',
};

const scriptText = {
  color: '#333',
  fontSize: '14px',
  lineHeight: '22px',
  margin: '0',
  fontStyle: 'italic',
};

const ctaSection = {
  textAlign: 'center',
  margin: '32px 40px',
};

const button = {
  backgroundColor: '#000',
  borderRadius: '8px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center',
  display: 'inline-block',
  padding: '16px 32px',
};

const divider = {
  borderColor: '#e0e0e0',
  margin: '32px 40px',
};

const link = {
  color: '#000',
  textDecoration: 'underline',
};

const footer = {
  color: '#8898aa',
  fontSize: '12px',
  lineHeight: '16px',
  padding: '0 40px',
  marginTop: '16px',
};
