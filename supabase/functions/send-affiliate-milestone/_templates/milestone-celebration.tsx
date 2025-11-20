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
} from "https://esm.sh/@react-email/components@0.0.22";
import * as React from "https://esm.sh/react@18.3.1";

interface MilestoneCelebrationEmailProps {
  affiliateCode: string;
  milestoneType: string;
  milestoneValue: number;
  totalEarnings: number;
  totalReferrals: number;
}

const milestoneMessages: Record<string, { emoji: string; heading: string; message: string; tip: string }> = {
  first_referral: {
    emoji: "🎉",
    heading: "Your First Referral!",
    message: "Congratulations! You've made your first referral to xiXoi™. This is just the beginning of your earning journey.",
    tip: "Keep sharing your unique link to earn 20% recurring commissions on every subscription!"
  },
  referrals_5: {
    emoji: "🚀",
    heading: "5 Referrals Milestone!",
    message: "Amazing progress! You've successfully referred 5 users to xiXoi™. You're building real momentum.",
    tip: "Pro tip: Share your success story on social media to inspire more sign-ups!"
  },
  referrals_10: {
    emoji: "🔥",
    heading: "10 Referrals Achievement!",
    message: "Incredible! You've hit 10 referrals. You're now in the top tier of xiXoi™ affiliates.",
    tip: "Consider creating tutorial content or case studies to drive even more conversions."
  },
  referrals_25: {
    emoji: "💪",
    heading: "25 Referrals - You're a Superstar!",
    message: "Outstanding performance! 25 referrals shows you're a true xiXoi™ advocate.",
    tip: "At this level, consider reaching out to our team for exclusive promotional opportunities."
  },
  referrals_50: {
    emoji: "🏆",
    heading: "50 Referrals - Elite Status!",
    message: "You're absolutely crushing it! 50 referrals puts you in elite company.",
    tip: "You're earning serious recurring income. Keep scaling your promotional efforts!"
  },
  referrals_100: {
    emoji: "👑",
    heading: "100 Referrals - Legendary!",
    message: "Extraordinary achievement! You've referred 100 users to xiXoi™. You're a legend.",
    tip: "Contact our partnership team to discuss custom commission structures for top performers."
  },
  first_payout: {
    emoji: "💰",
    heading: "Your First Payout!",
    message: "Congratulations! You've received your first payout from xiXoi™. This is real money for real effort.",
    tip: "Your recurring commissions will continue to grow with each billing cycle!"
  },
  earnings_1000: {
    emoji: "💎",
    heading: "$1,000 Total Earnings!",
    message: "Milestone unlocked! You've earned $1,000 in total commissions. This proves the power of the xiXoi™ affiliate program.",
    tip: "You're generating significant passive income. Double down on what's working!"
  },
  earnings_5000: {
    emoji: "🌟",
    heading: "$5,000 Total Earnings!",
    message: "Phenomenal! $5,000 in total earnings is a life-changing amount. You're building real wealth.",
    tip: "At this level, consider reinvesting in paid advertising to scale even faster."
  },
  earnings_10000: {
    emoji: "🎯",
    heading: "$10,000 Total Earnings!",
    message: "Absolutely incredible! $10,000 in affiliate commissions proves you've mastered the game.",
    tip: "You're in the top 1% of affiliates. Let's discuss exclusive partnership opportunities."
  },
};

export const MilestoneCelebrationEmail = ({
  affiliateCode,
  milestoneType,
  milestoneValue,
  totalEarnings,
  totalReferrals,
}: MilestoneCelebrationEmailProps) => {
  const milestone = milestoneMessages[milestoneType] || milestoneMessages.first_referral;

  return (
    <Html>
      <Head />
      <Preview>{milestone.heading} - xiXoi™ Affiliate Milestone</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Text style={emoji}>{milestone.emoji}</Text>
            <Heading style={h1}>{milestone.heading}</Heading>
          </Section>

          <Text style={text}>{milestone.message}</Text>

          <Section style={statsBox}>
            <Text style={statsHeading}>Your Affiliate Stats</Text>
            <Hr style={divider} />
            <Text style={statLine}>
              <strong>Total Referrals:</strong> {totalReferrals}
            </Text>
            <Text style={statLine}>
              <strong>Total Earnings:</strong> ${totalEarnings.toFixed(2)}
            </Text>
            <Text style={statLine}>
              <strong>Affiliate Code:</strong> {affiliateCode}
            </Text>
          </Section>

          <Section style={tipBox}>
            <Text style={tipHeading}>💡 Pro Tip</Text>
            <Text style={tipText}>{milestone.tip}</Text>
          </Section>

          <Section style={ctaSection}>
            <Link
              href={`https://xixoi.com/affiliates`}
              style={button}
            >
              View Your Dashboard
            </Link>
          </Section>

          <Hr style={divider} />

          <Text style={footer}>
            Keep up the great work! Every milestone brings you closer to building serious passive income.
          </Text>

          <Text style={footerSmall}>
            xiXoi™ Affiliate Program • Paid Advertising for Every Human. And soon, robots too.
          </Text>

          <Text style={footerSmall}>
            Questions? Reply to this email or contact{" "}
            <Link href="mailto:info@stoltzone.com" style={link}>
              info@stoltzone.com
            </Link>
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

export default MilestoneCelebrationEmail;

const main = {
  backgroundColor: "#000000",
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif',
};

const container = {
  margin: "0 auto",
  padding: "40px 20px",
  maxWidth: "600px",
};

const header = {
  textAlign: "center" as const,
  marginBottom: "32px",
};

const emoji = {
  fontSize: "64px",
  margin: "0 0 16px 0",
  textAlign: "center" as const,
};

const h1 = {
  color: "#FFFFFF",
  fontSize: "32px",
  fontWeight: "bold",
  margin: "0",
  textAlign: "center" as const,
};

const text = {
  color: "#FFFFFF",
  fontSize: "16px",
  lineHeight: "24px",
  margin: "24px 0",
};

const statsBox = {
  backgroundColor: "#1a1a1a",
  border: "1px solid #333333",
  borderRadius: "8px",
  padding: "24px",
  margin: "32px 0",
};

const statsHeading = {
  color: "#FFFFFF",
  fontSize: "18px",
  fontWeight: "bold",
  margin: "0 0 16px 0",
};

const statLine = {
  color: "#FFFFFF",
  fontSize: "14px",
  lineHeight: "24px",
  margin: "8px 0",
};

const tipBox = {
  backgroundColor: "#0a0a0a",
  border: "1px solid #333333",
  borderRadius: "8px",
  padding: "20px",
  margin: "24px 0",
};

const tipHeading = {
  color: "#FFFFFF",
  fontSize: "16px",
  fontWeight: "bold",
  margin: "0 0 12px 0",
};

const tipText = {
  color: "#CCCCCC",
  fontSize: "14px",
  lineHeight: "22px",
  margin: "0",
};

const ctaSection = {
  textAlign: "center" as const,
  margin: "32px 0",
};

const button = {
  backgroundColor: "#FFFFFF",
  color: "#000000",
  fontSize: "16px",
  fontWeight: "bold",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "14px 32px",
  borderRadius: "6px",
  border: "2px solid #FFFFFF",
};

const divider = {
  borderColor: "#333333",
  margin: "24px 0",
};

const footer = {
  color: "#CCCCCC",
  fontSize: "14px",
  lineHeight: "22px",
  margin: "24px 0 16px 0",
  textAlign: "center" as const,
};

const footerSmall = {
  color: "#888888",
  fontSize: "12px",
  lineHeight: "20px",
  margin: "8px 0",
  textAlign: "center" as const,
};

const link = {
  color: "#FFFFFF",
  textDecoration: "underline",
};
