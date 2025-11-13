import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "How does xiXoi™ generate ads?",
    answer: "xiXoi™ uses advanced AI to analyze your uploaded content and automatically generate professional ad copy, headlines, CTAs, and creative variations optimized for your chosen platform.",
  },
  {
    question: "What's the 'Powered By xiXoi™' branding?",
    answer: "Free users have a small, subtle 'Powered By xiXoi™' watermark on their ads. You can remove it per campaign with a one-time payment or upgrade to Pro to remove it from all ads.",
  },
  {
    question: "Which ad platforms do you support?",
    answer: "xiXoi™ currently supports Meta Ads (Facebook & Instagram), TikTok Ads, Google Ads, and LinkedIn Ads. You'll need to connect your account for each platform via OAuth.",
  },
  {
    question: "Do I need advertising experience?",
    answer: "Absolutely not. xiXoi™ is designed for everyone - from complete beginners to experienced marketers. Just upload your content and let the AI handle the rest.",
  },
  {
    question: "How much do the ads cost to run?",
    answer: "xiXoi™ doesn't charge for ad spend - you pay that directly to the ad platform (Meta, TikTok, etc.). You only pay xiXoi™ for the platform subscription or branding removal.",
  },
  {
    question: "Can I edit the AI-generated ads?",
    answer: "Yes! You can review and customize all AI-generated content before publishing. xiXoi™ gives you full control over the final ad.",
  },
];

export const FAQ = () => {
  return (
    <section className="py-24 px-6 bg-secondary/30">
      <div className="container mx-auto max-w-3xl">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 font-heading">
            Frequently Asked Questions
          </h2>
          <p className="text-xl text-muted-foreground">
            Everything you need to know
          </p>
        </div>

        <Accordion type="single" collapsible className="space-y-4">
          {faqs.map((faq, index) => (
            <AccordionItem
              key={index}
              value={`item-${index}`}
              className="glass-panel border border-border/50 rounded-xl px-6 rim-light hover:border-accent/50 transition-all"
            >
              <AccordionTrigger className="text-left hover:no-underline py-6">
                <span className="font-semibold font-heading">{faq.question}</span>
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground pb-6">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
};
