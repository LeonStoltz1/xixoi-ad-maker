import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "What's included in the Free tier?",
    answer: "Free tier lets you build and preview AI-generated ad variants with the xiXoi™ watermark. You can test the platform and see what your ads will look like before publishing. To publish ads live, upgrade to Quick-Start ($49/mo) or Pro ($149/mo).",
  },
  {
    question: "Who can use xiXoi™?",
    answer: "Everyone. Small businesses, restaurants, creators, coaches, service providers, online stores, agencies, political campaigns, nonprofits—anyone who wants to run paid ads without complexity or technical knowledge.",
  },
  {
    question: "What can I advertise with xiXoi™?",
    answer: "Anything. Promote your café, announce an event, get bookings for your service business, grow your YouTube channel, launch your product, sell your merch, run political ads legally, increase restaurant reservations, boost app downloads—xiXoi works for all of it.",
  },
  {
    question: "How does xiXoi™ generate ads?",
    answer: "xiXoi™ uses advanced AI to analyze your uploaded content and automatically generate professional ad copy, headlines, CTAs, and creative variations optimized for each platform (Meta, TikTok, Google, LinkedIn, X).",
  },
  {
    question: "Do I need my own ad accounts?",
    answer: "Not if you use Quick-Start tier ($49/mo). xiXoi handles everything through our master accounts—zero setup. Pro tier users ($149/mo) can connect their own accounts for unlimited spend and full control.",
  },
  {
    question: "Do I need advertising experience?",
    answer: "Absolutely not. xiXoi™ is designed for everyone—from complete beginners to experienced marketers. Just describe what you want to promote, upload your content, and let the AI handle the rest.",
  },
  {
    question: "Which ad platforms does xiXoi™ support?",
    answer: "xiXoi™ publishes to Meta Ads (Facebook & Instagram), TikTok Ads, Google Ads, LinkedIn Ads, and X (Twitter) Ads. You can choose which platforms to publish to for each campaign.",
  },
  {
    question: "Can I run political ads on xiXoi™?",
    answer: "Yes, but only on Pro tier ($149/mo) with your own connected ad accounts. Political ads require FEC compliance and identity verification. Quick-Start tier cannot run political ads for regulatory reasons.",
  },
  {
    question: "Can I edit the AI-generated ads before publishing?",
    answer: "Yes! You can review and customize all AI-generated content before publishing. xiXoi™ gives you full control over the final ad copy, images, and targeting.",
  },
];

export const FAQ = () => {
  return (
    <section className="py-section px-6 bg-background">
      <div className="w-full max-w-content mx-auto">
        <div className="text-center mb-grid space-y-tight">
          <h2 className="text-3xl md:text-4xl font-bold font-heading">
            Frequently Asked Questions
          </h2>
          <p className="text-base">
            Everything you need to know
          </p>
        </div>

        <Accordion type="single" collapsible className="space-y-4">
          {faqs.map((faq, index) => (
            <AccordionItem
              key={index}
              value={`item-${index}`}
              className="border border-foreground px-6"
            >
              <AccordionTrigger className="text-left hover:no-underline py-6">
                <span className="font-bold text-sm">{faq.question}</span>
              </AccordionTrigger>
              <AccordionContent className="pb-6 text-sm">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
};
