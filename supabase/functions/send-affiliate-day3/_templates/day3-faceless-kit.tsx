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

interface Day3EmailProps {
  affiliateName: string;
  referralLink: string;
}

export const Day3FacelessKitEmail = ({
  affiliateName,
  referralLink,
}: Day3EmailProps) => (
  <Html>
    <Head />
    <Preview>Day 3: Faceless Content Kit (No Camera Needed)</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>📱 Day 3: Faceless Content Kit</Heading>
        
        <Text style={text}>
          Hey {affiliateName},
        </Text>
        
        <Text style={text}>
          Don't want to show your face? <strong>Perfect.</strong> Today's kit is 100% faceless—no camera, no editing skills, just results.
        </Text>

        <Section style={scriptSection}>
          <Heading style={h2}>Script #1: Screen Recording</Heading>
          <Text style={scriptText}>
            "Watch me build a complete ad campaign in real-time. No cuts. No edits. 60 seconds start to finish."
          </Text>
          <Text style={instructionText}>
            🎬 Record your screen creating an ad in xiXoi. Speed it up 2x. Add text overlay.
          </Text>
        </Section>

        <Section style={scriptSection}>
          <Heading style={h2}>Script #2: Text-to-Speech Demo</Heading>
          <Text style={scriptText}>
            "This AI turned my product description into 5 platform-specific ads. Meta. TikTok. Google. LinkedIn. X. All in 40 seconds."
          </Text>
          <Text style={instructionText}>
            🎬 Use CapCut's text-to-speech. Show before/after. No voiceover needed.
          </Text>
        </Section>

        <Section style={scriptSection}>
          <Heading style={h2}>Script #3: Carousel (Static)</Heading>
          <Text style={scriptText}>
            Slide 1: "AI ads in 60 seconds"<br/>
            Slide 2: "Upload your product"<br/>
            Slide 3: "AI creates 5 platform variants"<br/>
            Slide 4: "Publish everywhere"<br/>
            Slide 5: "Your results" [screenshot]<br/>
            Slide 6: "Try it free 👇" [link]
          </Text>
          <Text style={instructionText}>
            🎬 Use Canva templates. No video. Pure carousel.
          </Text>
        </Section>

        <Section style={bonusSection}>
          <Heading style={h2}>🎁 Bonus: 3 Voiceover Scripts</Heading>
          <Text style={text}>
            If you DO want voice:
          </Text>
          <Text style={scriptText}>
            1. "I spent $2,000 on an agency. Then I tried xiXoi for $49. Same results. 1/40th the cost."<br/>
            2. "Small business owners: Stop paying agencies $3k/month. This AI does it for $49."<br/>
            3. "I tested 5 AI ad tools. Only one publishes to all 5 platforms. Here's proof."
          </Text>
        </Section>

        <Text style={text}>
          <strong>Your Task Today:</strong> Post 1 faceless video or carousel with your link: <Link href={referralLink} style={link}>{referralLink}</Link>
        </Text>

        <Text style={footer}>
          No camera. No problem.<br/>
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

const scriptSection = {
  backgroundColor: '#f0f0f0',
  padding: '20px',
  margin: '20px 0',
  borderRadius: '8px',
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
  fontSize: '16px',
  lineHeight: '24px',
  fontStyle: 'italic',
  margin: '10px 0',
};

const instructionText = {
  color: '#666',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '10px 0',
  fontWeight: '500',
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
