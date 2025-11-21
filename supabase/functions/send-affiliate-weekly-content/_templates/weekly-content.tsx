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

interface WeeklyContentEmailProps {
  affiliateName: string;
  weekStart: string;
  weekEnd: string;
  topHooks: Array<{ content: string; performance_score: number; anonymized_creator: string }>;
  topScripts: Array<{ content: string; performance_score: number }>;
}

export const WeeklyContentEmail = ({
  affiliateName,
  weekStart,
  weekEnd,
  topHooks,
  topScripts,
}: WeeklyContentEmailProps) => (
  <Html>
    <Head />
    <Preview>Your Weekly Content Swipe Pack 📦</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>📦 Weekly Swipe Pack</Heading>
        
        <Text style={text}>
          Hey {affiliateName},
        </Text>
        
        <Text style={text}>
          Here's what worked best last week ({weekStart} - {weekEnd}). Copy, adapt, and deploy.
        </Text>

        <Section style={section}>
          <Heading style={h2}>🔥 Top Performing Hooks</Heading>
          {topHooks.map((hook, index) => (
            <Section key={index} style={hookSection}>
              <Text style={hookText}>"{hook.content}"</Text>
              <Text style={metaText}>
                Performance: {hook.performance_score}/10 | Created by: {hook.anonymized_creator}
              </Text>
            </Section>
          ))}
        </Section>

        <Section style={section}>
          <Heading style={h2}>💬 Top Performing Scripts</Heading>
          {topScripts.map((script, index) => (
            <Section key={index} style={scriptSection}>
              <Text style={scriptText}>{script.content}</Text>
              <Text style={metaText}>Performance: {script.performance_score}/10</Text>
            </Section>
          ))}
        </Section>

        <Section style={tipSection}>
          <Heading style={h2}>💡 This Week's Pro Tip</Heading>
          <Text style={text}>
            Test variations. Don't copy word-for-word. Adapt hooks to your voice and niche. The best affiliates customize 30-40% of each swipe.
          </Text>
        </Section>

        <Text style={text}>
          More content drops in your <Link href="https://xixoi.com/affiliates" style={link}>affiliate dashboard</Link>.
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
  fontSize: '22px',
  fontWeight: 'bold',
  margin: '24px 0 16px',
};

const text = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '26px',
  margin: '16px 0',
};

const section = {
  margin: '32px 0',
};

const hookSection = {
  backgroundColor: '#f9f9f9',
  borderLeft: '4px solid #000',
  padding: '16px',
  margin: '16px 0',
  borderRadius: '4px',
};

const scriptSection = {
  backgroundColor: '#f0f0f0',
  padding: '16px',
  margin: '16px 0',
  borderRadius: '8px',
};

const hookText = {
  color: '#000',
  fontSize: '17px',
  lineHeight: '26px',
  fontStyle: 'italic',
  margin: '0 0 8px',
  fontWeight: '500',
};

const scriptText = {
  color: '#000',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '0 0 8px',
};

const metaText = {
  color: '#666',
  fontSize: '13px',
  margin: '4px 0 0',
};

const tipSection = {
  backgroundColor: '#fff8e1',
  border: '2px solid #ffc107',
  padding: '20px',
  margin: '24px 0',
  borderRadius: '8px',
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
