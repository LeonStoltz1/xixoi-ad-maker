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

interface Day6EmailProps {
  affiliateName: string;
  referralLink: string;
}

export const Day6AdvancedTacticsEmail = ({
  affiliateName,
  referralLink,
}: Day6EmailProps) => (
  <Html>
    <Head />
    <Preview>Day 6: Advanced Tactics (Duets, Reactions, Trends)</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>🚀 Day 6: Advanced Tactics</Heading>
        
        <Text style={text}>
          Hey {affiliateName},
        </Text>
        
        <Text style={text}>
          You've posted. You've promoted. Today, we're unlocking <strong>advanced growth tactics</strong> that 10x your reach without 10x your effort.
        </Text>

        <Section style={tacticSection}>
          <Heading style={h2}>Tactic #1: Duet Viral Videos</Heading>
          <Text style={text}>
            Find videos with 100k+ views about "ad struggles," "marketing pain," or "agency costs."
          </Text>
          <Text style={scriptText}>
            Duet them with: "This is why I switched to AI ads. Same results. $49 instead of $3k/month."
          </Text>
          <Text style={tipText}>
            🎯 <strong>Why it works:</strong> You piggyback their audience. Their viral video = your exposure.
          </Text>
        </Section>

        <Section style={tacticSection}>
          <Heading style={h2}>Tactic #2: Green Screen Reactions</Heading>
          <Text style={text}>
            Use xiXoi's dashboard as your green screen background. React to questions like:
          </Text>
          <Text style={scriptText}>
            • "How do I run Meta ads without an ad account?"<br/>
            • "What's the easiest way to advertise on TikTok?"<br/>
            • "Can AI really create ads?"
          </Text>
          <Text style={tipText}>
            🎯 <strong>Why it works:</strong> You're answering real questions. SEO-friendly. Algorithm loves educational content.
          </Text>
        </Section>

        <Section style={tacticSection}>
          <Heading style={h2}>Tactic #3: Trend Piggybacking</Heading>
          <Text style={text}>
            Use trending sounds/formats but adapt them to xiXoi:
          </Text>
          <Text style={scriptText}>
            Trending audio: "Wait, that's illegal"<br/>
            Your video: "Agencies charging $3k/month when AI does it for $49"
          </Text>
          <Text style={scriptText}>
            Trending format: "Things I wish I knew earlier"<br/>
            Your video: "Things I wish I knew before hiring an agency: 1. AI ads exist 2. They're $49 3. They work"
          </Text>
          <Text style={tipText}>
            🎯 <strong>Why it works:</strong> Trends = free distribution. You ride the algorithm wave.
          </Text>
        </Section>

        <Section style={bonusSection}>
          <Heading style={h2}>🔥 Power Move: Niche Down</Heading>
          <Text style={text}>
            Instead of "AI ads for everyone," target ONE niche for 30 days:
          </Text>
          <Text style={listText}>
            • Realtors → "AI ads for real estate agents"<br/>
            • Coaches → "AI ads for course creators"<br/>
            • E-commerce → "AI ads for Shopify stores"<br/>
            • Local businesses → "AI ads for restaurants/salons/gyms"
          </Text>
          <Text style={tipText}>
            🎯 Niche = faster trust. Broad = slow growth.
          </Text>
        </Section>

        <Text style={calloutText}>
          <strong>Your Task Today:</strong> Post 1 duet, 1 green screen reaction, OR 1 trend-based video.
        </Text>

        <Text style={text}>
          Link: <Link href={referralLink} style={link}>{referralLink}</Link>
        </Text>

        <Text style={footer}>
          Tomorrow: The First $500 Challenge begins.<br/>
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

const tacticSection = {
  backgroundColor: '#f5f5f5',
  padding: '20px',
  margin: '20px 0',
  borderRadius: '8px',
  borderLeft: '4px solid #000',
};

const bonusSection = {
  backgroundColor: '#e3f2fd',
  border: '2px solid #2196f3',
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

const listText = {
  color: '#333',
  fontSize: '15px',
  lineHeight: '22px',
  margin: '10px 0 10px 20px',
};

const tipText = {
  color: '#666',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '10px 0',
  fontWeight: '500',
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
