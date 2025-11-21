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
} from 'https://esm.sh/@react-email/components@0.0.22';
import * as React from 'https://esm.sh/react@18.3.1';

interface Day5EmailProps {
  affiliateName: string;
  referralLink: string;
  currentConversions: number;
}

export const Day5FirstHundredEmail = ({
  affiliateName,
  referralLink,
  currentConversions,
}: Day5EmailProps) => (
  <Html>
    <Head />
    <Preview>Day 5: Your First $100 in Commissions</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>💰 Day 5: Earn Your First $100</Heading>
        
        <Text style={text}>
          Hey {affiliateName},
        </Text>
        
        <Text style={text}>
          You've built momentum. Now let's convert it into cash. Today's focus: <strong>your first $100 in commissions.</strong>
        </Text>

        {currentConversions > 0 && (
          <Section style={statsSection}>
            <Text style={statsText}>
              🎯 You're at {currentConversions} conversion{currentConversions !== 1 ? 's' : ''}!<br/>
              💵 That's ${(currentConversions * 49 * 0.50).toFixed(2)} earned so far.
            </Text>
          </Section>
        )}

        <Section style={tacticSection}>
          <Heading style={h2}>Tactic #1: DM Script for Small Businesses</Heading>
          <Text style={scriptText}>
            "Hey [name], saw your [business type] page. I'm sharing a tool that creates ads for Meta, TikTok, Google in 60 seconds. No ad account setup. Curious if it'd help?"
          </Text>
          <Text style={tipText}>
            ✅ Send to 20 small business owners today. Even a 10% response rate = 2 conversions = $49 commission.
          </Text>
        </Section>

        <Section style={tacticSection}>
          <Heading style={h2}>Tactic #2: Facebook Group Posts</Heading>
          <Text style={scriptText}>
            Post in: "Small Business Owners," "Digital Marketing," "Side Hustle," "Entrepreneur"
          </Text>
          <Text style={scriptText}>
            Copy: "Anyone else tired of paying $2k+/month for ad management? Found a tool that does it for $49. Meta, TikTok, Google, LinkedIn, X. Fully automated. [your link]"
          </Text>
          <Text style={tipText}>
            ✅ Post in 5 groups. Check group rules first (some allow affiliate links, some don't).
          </Text>
        </Section>

        <Section style={tacticSection}>
          <Heading style={h2}>Tactic #3: Reddit Value Bombs</Heading>
          <Text style={scriptText}>
            Subreddits: r/Entrepreneur, r/smallbusiness, r/DigitalMarketing, r/PPC
          </Text>
          <Text style={scriptText}>
            Post format: "I tested 5 AI ad tools. Here's what actually worked [comparison chart]. Tool I'm using now: [link in bio]"
          </Text>
          <Text style={tipText}>
            ✅ Lead with value, not promotion. Reddit hates ads—but loves helpful breakdowns.
          </Text>
        </Section>

        <Section style={bonusSection}>
          <Heading style={h2}>🎁 Bonus: Email Template</Heading>
          <Text style={text}>
            If you have an email list (even 50 people):
          </Text>
          <Text style={scriptText}>
            Subject: "I found a $49 tool that replaced our $3k/month agency"<br/><br/>
            Body: "[Quick story about your experience]. Tried xiXoi. Same results. 1/60th the cost. Here's my referral link if you want to test it: {referralLink}"
          </Text>
        </Section>

        <Text style={calloutText}>
          <strong>Your Task Today:</strong> Get 2 conversions using one of these tactics. That's $49 commission—halfway to $100.
        </Text>

        <Text style={footer}>
          You're closer than you think.<br/>
          The xiXoi Team
        </Text>
      </Container>
    </Body>
  </Html>
);

const main = {
  backgroundColor: '#ffffff',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  margin: '0 auto',
  padding: '20px 0 48px',
  maxWidth: '600px',
};

const h1 = {
  color: '#000',
  fontSize: '28px',
  fontWeight: 'bold',
  margin: '40px 0 20px',
};

const h2 = {
  color: '#000',
  fontSize: '20px',
  fontWeight: 'bold',
  margin: '20px 0 10px',
};

const text = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '26px',
  margin: '16px 0',
};

const statsSection = {
  backgroundColor: '#e8f5e9',
  padding: '20px',
  margin: '20px 0',
  borderRadius: '8px',
  textAlign: 'center' as const,
};

const statsText = {
  color: '#000',
  fontSize: '18px',
  fontWeight: 'bold',
  lineHeight: '28px',
};

const tacticSection = {
  backgroundColor: '#f5f5f5',
  padding: '20px',
  margin: '20px 0',
  borderRadius: '8px',
  borderLeft: '4px solid #000',
};

const bonusSection = {
  backgroundColor: '#fff8e1',
  border: '2px solid #ffc107',
  padding: '20px',
  margin: '20px 0',
  borderRadius: '8px',
};

const scriptText = {
  color: '#000',
  fontSize: '15px',
  lineHeight: '22px',
  fontStyle: 'italic',
  backgroundColor: '#fff',
  padding: '12px',
  borderRadius: '4px',
  margin: '10px 0',
};

const tipText = {
  color: '#666',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '10px 0',
};

const calloutText = {
  color: '#000',
  fontSize: '17px',
  lineHeight: '26px',
  fontWeight: 'bold',
  backgroundColor: '#ffeb3b',
  padding: '15px',
  borderRadius: '8px',
  margin: '20px 0',
};

const footer = {
  color: '#898989',
  fontSize: '12px',
  marginTop: '40px',
};
