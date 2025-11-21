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

interface Day7EmailProps {
  affiliateName: string;
  referralLink: string;
  currentConversions: number;
  currentEarnings: number;
}

export const Day7ChallengeEmail = ({
  affiliateName,
  currentConversions,
  currentEarnings,
  referralLink,
}: Day7EmailProps) => (
  <Html>
    <Head />
    <Preview>Day 7: The First $500 Challenge 🏆</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>🏆 Day 7: First $500 Challenge</Heading>
        
        <Text style={text}>
          Hey {affiliateName},
        </Text>
        
        <Text style={text}>
          You made it through the 7-day sprint. Now it's time for <strong>The First $500 Challenge.</strong>
        </Text>

        <Section style={statsSection}>
          <Heading style={statsHeading}>Your Current Stats</Heading>
          <Text style={statsText}>
            🎯 Conversions: {currentConversions}<br/>
            💵 Earnings: ${currentEarnings.toFixed(2)}<br/>
            📈 To $500: ${(500 - currentEarnings).toFixed(2)} remaining
          </Text>
        </Section>

        <Section style={challengeSection}>
          <Heading style={h2}>The Challenge</Heading>
          <Text style={text}>
            Get to <strong>15 paid conversions</strong> in the next 30 days.
          </Text>
          <Text style={text}>
            That's 15 referrals × $49 Quick-Start × 50% commission = <strong>$367.50 in commissions.</strong>
          </Text>
          <Text style={bonusText}>
            💰 <strong>BONUS:</strong> First person to hit 15 conversions gets $200 cash bonus.
          </Text>
        </Section>

        <Section style={planSection}>
          <Heading style={h2}>Your 30-Day Plan</Heading>
          
          <Text style={weekText}><strong>Week 1:</strong> Content Blitz</Text>
          <Text style={listText}>
            • Post 7 videos (1 per day)<br/>
            • 3 TikToks, 2 Reels, 2 YouTube Shorts<br/>
            • Use Days 1-6 scripts<br/>
            • Target: 3 conversions
          </Text>

          <Text style={weekText}><strong>Week 2:</strong> Outbound DMs</Text>
          <Text style={listText}>
            • DM 50 small business owners<br/>
            • Use Day 5 DM script<br/>
            • Personalize each message<br/>
            • Target: 5 conversions
          </Text>

          <Text style={weekText}><strong>Week 3:</strong> Community Engagement</Text>
          <Text style={listText}>
            • Post in 10 Facebook groups<br/>
            • Comment on 30 Reddit threads<br/>
            • Answer questions, provide value<br/>
            • Target: 4 conversions
          </Text>

          <Text style={weekText}><strong>Week 4:</strong> Momentum Push</Text>
          <Text style={listText}>
            • Repurpose your best-performing content<br/>
            • Email your list<br/>
            • Post case studies<br/>
            • Target: 3 conversions
          </Text>
        </Section>

        <Section style={rewardSection}>
          <Heading style={h2}>🎁 Milestones & Rewards</Heading>
          <Text style={listText}>
            <strong>5 conversions:</strong> Light Affiliate tier unlocked<br/>
            <strong>10 conversions:</strong> Featured in weekly newsletter<br/>
            <strong>15 conversions:</strong> $200 cash bonus + Active Affiliate tier<br/>
            <strong>20 conversions:</strong> $200 milestone bonus (automatic)<br/>
            <strong>25+ conversions:</strong> Power Affiliate tier + extended commission window
          </Text>
        </Section>

        <Section style={ctaSection}>
          <Heading style={h2}>What's Next?</Heading>
          <Text style={text}>
            1. Track your progress in your <Link href="https://xixoi.com/affiliates" style={link}>affiliate dashboard</Link><br/>
            2. Join our affiliate Telegram group for daily support<br/>
            3. Watch for weekly content drops every Monday<br/>
            4. Keep posting, keep promoting, keep earning
          </Text>
        </Section>

        <Text style={finalText}>
          You've got the tools. You've got the scripts. You've got the momentum.
        </Text>

        <Text style={finalText}>
          Now go get your first $500.
        </Text>

        <Text style={footer}>
          We're rooting for you.<br/>
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
  fontSize: '32px',
  fontWeight: 'bold',
  margin: '40px 0 20px',
  textAlign: 'center' as const,
};

const h2 = {
  color: '#000',
  fontSize: '22px',
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
  fontSize: '18px',
  lineHeight: '32px',
  fontWeight: '500',
};

const challengeSection = {
  backgroundColor: '#fff3e0',
  border: '3px solid #ff9800',
  padding: '24px',
  margin: '24px 0',
  borderRadius: '12px',
};

const bonusText = {
  color: '#000',
  fontSize: '18px',
  lineHeight: '28px',
  fontWeight: 'bold',
  backgroundColor: '#ffeb3b',
  padding: '12px',
  borderRadius: '8px',
  margin: '16px 0',
  textAlign: 'center' as const,
};

const planSection = {
  backgroundColor: '#f5f5f5',
  padding: '24px',
  margin: '24px 0',
  borderRadius: '12px',
};

const weekText = {
  color: '#000',
  fontSize: '17px',
  fontWeight: 'bold',
  margin: '20px 0 8px',
};

const listText = {
  color: '#333',
  fontSize: '15px',
  lineHeight: '24px',
  margin: '8px 0 16px 20px',
};

const rewardSection = {
  backgroundColor: '#e3f2fd',
  border: '2px solid #2196f3',
  padding: '24px',
  margin: '24px 0',
  borderRadius: '12px',
};

const ctaSection = {
  backgroundColor: '#fce4ec',
  padding: '24px',
  margin: '24px 0',
  borderRadius: '12px',
};

const finalText = {
  color: '#000',
  fontSize: '18px',
  lineHeight: '28px',
  fontWeight: 'bold',
  textAlign: 'center' as const,
  margin: '24px 0',
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
