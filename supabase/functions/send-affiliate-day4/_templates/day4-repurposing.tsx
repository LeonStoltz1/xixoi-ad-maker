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

interface Day4EmailProps {
  affiliateName: string;
  referralLink: string;
}

export const Day4RepurposingEmail = ({
  affiliateName,
  referralLink,
}: Day4EmailProps) => (
  <Html>
    <Head />
    <Preview>Day 4: Turn 1 Video Into 10+ Posts</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>♻️ Day 4: Content Multiplication</Heading>
        
        <Text style={text}>
          Hey {affiliateName},
        </Text>
        
        <Text style={text}>
          You've posted 3 times. Today, we're showing you how to <strong>turn 1 piece of content into 10+ posts</strong> without creating anything new.
        </Text>

        <Section style={formulaSection}>
          <Heading style={h2}>The 1→10 Formula</Heading>
          <Text style={stepText}>
            <strong>Step 1:</strong> Take your best-performing video from Days 1-3
          </Text>
          <Text style={stepText}>
            <strong>Step 2:</strong> Extract 3 clips (15-20 seconds each)
          </Text>
          <Text style={stepText}>
            <strong>Step 3:</strong> Turn each clip into:
          </Text>
          <Text style={listText}>
            • TikTok (original)<br/>
            • Instagram Reel (original)<br/>
            • YouTube Short (original)<br/>
            • LinkedIn carousel (screenshots + captions)<br/>
            • Twitter thread (text version)<br/>
            • Facebook post (video embed)<br/>
            • Email to your list (video + CTA)<br/>
            • Blog post (transcript + embed)<br/>
            • Pinterest pin (thumbnail + link)<br/>
            • Reddit post (value-first, link in bio)
          </Text>
        </Section>

        <Section style={templateSection}>
          <Heading style={h2}>Copy/Paste Captions</Heading>
          
          <Text style={captionHeader}>TikTok/Reels:</Text>
          <Text style={captionText}>
            "I tested xiXoi's AI ad builder so you don't have to. Results? 🤯 [your result]. Try it: {referralLink}"
          </Text>

          <Text style={captionHeader}>LinkedIn:</Text>
          <Text style={captionText}>
            "Spent the last week testing AI ad automation. Here's what actually works: [3 insights]. Tool: {referralLink}"
          </Text>

          <Text style={captionHeader}>Twitter/X:</Text>
          <Text style={captionText}>
            "Just turned my landing page into ads across Meta, TikTok, Google, LinkedIn, and X in 40 seconds. AI is wild. {referralLink}"
          </Text>
        </Section>

        <Section style={proTipSection}>
          <Heading style={h2}>🔥 Pro Tip: Batch Schedule</Heading>
          <Text style={text}>
            Use Buffer, Hootsuite, or Later to schedule all 10 posts across 10 days. That's 10 days of promotion from 1 piece of content.
          </Text>
        </Section>

        <Text style={text}>
          <strong>Your Task Today:</strong> Repurpose your best video into at least 5 different formats.
        </Text>

        <Text style={footer}>
          Work smarter, not harder.<br/>
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

const formulaSection = {
  backgroundColor: '#f5f5f5',
  padding: '20px',
  margin: '20px 0',
  borderRadius: '8px',
};

const templateSection = {
  backgroundColor: '#e8f5e9',
  padding: '20px',
  margin: '20px 0',
  borderRadius: '8px',
};

const proTipSection = {
  backgroundColor: '#fff3e0',
  border: '2px solid #ff9800',
  padding: '20px',
  margin: '20px 0',
  borderRadius: '8px',
};

const stepText = {
  color: '#000',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '8px 0',
};

const listText = {
  color: '#333',
  fontSize: '15px',
  lineHeight: '22px',
  margin: '10px 0 10px 20px',
};

const captionHeader = {
  color: '#000',
  fontSize: '15px',
  fontWeight: 'bold',
  margin: '15px 0 5px',
};

const captionText = {
  color: '#333',
  fontSize: '14px',
  lineHeight: '20px',
  fontStyle: 'italic',
  backgroundColor: '#fff',
  padding: '10px',
  borderRadius: '4px',
  margin: '5px 0',
};

const footer = {
  color: '#898989',
  fontSize: '12px',
  marginTop: '40px',
};
