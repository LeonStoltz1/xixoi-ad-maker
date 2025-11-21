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

interface MonthlySummaryEmailProps {
  affiliateName: string;
  month: string;
  conversions: number;
  clicks: number;
  earnings: number;
  tier: string;
  leaderboardRank: number | null;
  nextTier: string | null;
  conversionsToNextTier: number | null;
}

export const MonthlySummaryEmail = ({
  affiliateName,
  month,
  conversions,
  clicks,
  earnings,
  tier,
  leaderboardRank,
  nextTier,
  conversionsToNextTier,
}: MonthlySummaryEmailProps) => (
  <Html>
    <Head />
    <Preview>Your {month} Affiliate Summary 📊</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>📊 Your {month} Summary</Heading>
        
        <Text style={text}>
          Hey {affiliateName},
        </Text>
        
        <Text style={text}>
          Here's how you performed last month:
        </Text>

        <Section style={statsSection}>
          <Heading style={statsHeading}>Performance Overview</Heading>
          <Text style={statsText}>
            💰 <strong>Earnings:</strong> ${earnings.toFixed(2)}<br/>
            🎯 <strong>Conversions:</strong> {conversions}<br/>
            👆 <strong>Clicks:</strong> {clicks}<br/>
            📈 <strong>Conversion Rate:</strong> {clicks > 0 ? ((conversions / clicks) * 100).toFixed(1) : '0'}%<br/>
            🏆 <strong>Tier:</strong> {tier.charAt(0).toUpperCase() + tier.slice(1)}
          </Text>
          {leaderboardRank && (
            <Text style={statsText}>
              🥇 <strong>Leaderboard Rank:</strong> #{leaderboardRank}
            </Text>
          )}
        </Section>

        {nextTier && conversionsToNextTier !== null && (
          <Section style={progressSection}>
            <Heading style={h2}>Next Milestone</Heading>
            <Text style={text}>
              You're <strong>{conversionsToNextTier} conversions away</strong> from reaching <strong>{nextTier}</strong> tier!
            </Text>
            <Text style={text}>
              {nextTier === 'active' && '🎁 Unlock: Weekly content drops + featured in newsletter'}
              {nextTier === 'power' && '🎁 Unlock: Exclusive strategies + extended commission window'}
              {nextTier === 'super' && '🎁 Unlock: White-label funnels + revenue share on sub-affiliates'}
            </Text>
          </Section>
        )}

        <Section style={tipsSection}>
          <Heading style={h2}>💡 Tips to Boost Performance</Heading>
          {conversions < 5 && (
            <Text style={tipText}>
              • Focus on DM outreach (50 messages = ~5 conversions)<br/>
              • Post more frequently (2-3x per day drives 3x results)<br/>
              • Use case studies instead of generic promos
            </Text>
          )}
          {conversions >= 5 && conversions < 25 && (
            <Text style={tipText}>
              • Double down on your best-performing content format<br/>
              • Start building an email list for recurring promotions<br/>
              • Test niche-specific messaging (realtors, coaches, etc.)
            </Text>
          )}
          {conversions >= 25 && (
            <Text style={tipText}>
              • Create custom landing pages for different audiences<br/>
              • Build automated funnels with nurture sequences<br/>
              • Consider recruiting sub-affiliates for revenue share
            </Text>
          )}
        </Section>

        <Section style={ctaSection}>
          <Text style={text}>
            View full dashboard: <Link href="https://xixoi.com/affiliates" style={link}>xixoi.com/affiliates</Link>
          </Text>
        </Section>

        <Text style={footer}>
          Let's make next month even bigger.<br/>
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
  margin: '20px 0 12px',
};

const text = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '26px',
  margin: '16px 0',
};

const statsSection = {
  backgroundColor: '#e8f5e9',
  padding: '24px',
  margin: '24px 0',
  borderRadius: '12px',
  textAlign: 'center' as const,
};

const statsHeading = {
  color: '#000',
  fontSize: '20px',
  fontWeight: 'bold',
  margin: '0 0 16px',
};

const statsText = {
  color: '#000',
  fontSize: '17px',
  lineHeight: '32px',
  textAlign: 'left' as const,
};

const progressSection = {
  backgroundColor: '#fff3e0',
  border: '2px solid #ff9800',
  padding: '20px',
  margin: '24px 0',
  borderRadius: '12px',
};

const tipsSection = {
  backgroundColor: '#e3f2fd',
  padding: '20px',
  margin: '24px 0',
  borderRadius: '12px',
};

const tipText = {
  color: '#333',
  fontSize: '15px',
  lineHeight: '24px',
  margin: '12px 0',
};

const ctaSection = {
  backgroundColor: '#f5f5f5',
  padding: '20px',
  margin: '24px 0',
  borderRadius: '12px',
  textAlign: 'center' as const,
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
  textAlign: 'center' as const,
};
