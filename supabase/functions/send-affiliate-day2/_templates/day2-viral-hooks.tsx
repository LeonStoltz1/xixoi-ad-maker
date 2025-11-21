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

interface Day2EmailProps {
  affiliateName: string;
  referralLink: string;
  affiliateCode: string;
}

export const Day2ViralHooksEmail = ({
  affiliateName,
  referralLink,
  affiliateCode,
}: Day2EmailProps) => (
  <Html>
    <Head />
    <Preview>Day 2: 3 Viral Hooks That Convert</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>🔥 Day 2: Your Viral Hooks</Heading>
        
        <Text style={text}>
          Hey {affiliateName},
        </Text>
        
        <Text style={text}>
          Yesterday you got your link. Today, you're getting 3 <strong>proven viral hooks</strong> that convert cold scrollers into xiXoi users.
        </Text>

        <Section style={hookSection}>
          <Heading style={h2}>Hook #1: The Speed Hook</Heading>
          <Text style={hookText}>
            "I turned my website into a Meta ad in 40 seconds using AI. No ad account. No setup. Just results."
          </Text>
          <Text style={tipText}>
            💡 <strong>Why it works:</strong> Speed + simplicity = shares. Everyone wants faster results.
          </Text>
        </Section>

        <Section style={hookSection}>
          <Heading style={h2}>Hook #2: The Demo Hook</Heading>
          <Text style={hookText}>
            "AI can now create your ads across Meta, TikTok, Google, LinkedIn, and X in under 60 seconds. Watch this..."
          </Text>
          <Text style={tipText}>
            💡 <strong>Why it works:</strong> Shows, not tells. Demos outperform testimonials 3:1.
          </Text>
        </Section>

        <Section style={hookSection}>
          <Heading style={h2}>Hook #3: The Transformation Hook</Heading>
          <Text style={hookText}>
            "I tested xiXoi on my struggling [insert niche] client. Their ROAS went from 1.2x to 4.7x in 3 weeks."
          </Text>
          <Text style={tipText}>
            💡 <strong>Why it works:</strong> Before/after + real numbers = instant credibility.
          </Text>
        </Section>

        <Text style={text}>
          <strong>Your Task Today:</strong>
        </Text>
        <Text style={text}>
          Post ONE of these hooks as a TikTok, Reel, or carousel. Add your link: <Link href={referralLink} style={link}>{referralLink}</Link>
        </Text>

        <Text style={text}>
          Tomorrow: We'll show you how to turn 1 piece of content into 10+ posts.
        </Text>

        <Text style={footer}>
          Keep crushing it,<br/>
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

const hookSection = {
  backgroundColor: '#f9f9f9',
  borderLeft: '4px solid #000',
  padding: '20px',
  margin: '20px 0',
};

const hookText = {
  color: '#000',
  fontSize: '16px',
  lineHeight: '24px',
  fontStyle: 'italic',
  margin: '10px 0',
};

const tipText = {
  color: '#666',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '10px 0',
};

const link = {
  color: '#000',
  textDecoration: 'underline',
  fontWeight: 'bold',
};

const footer = {
  color: '#898989',
  fontSize: '12px',
  marginTop: '40px',
};
