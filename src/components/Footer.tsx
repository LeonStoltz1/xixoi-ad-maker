const footerLinks = {
  Product: [
    { label: "Features", href: "/#features" },
    { label: "Pricing", href: "/#pricing" },
    { label: "How It Works", href: "/#how-it-works" },
    { label: "FAQ", href: "/#faq" }
  ],
  Company: [
    { label: "About", href: "/#about" },
    { label: "Blog", href: "/#blog" },
    { label: "Careers", href: "/#careers" },
    { label: "Affiliates", href: "/affiliates" },
    { label: "Contact", href: "mailto:support@xixoi.com" }
  ],
  Legal: [
    { label: "Privacy Policy", href: "/privacy" },
    { label: "Terms of Service", href: "/terms" },
    { label: "Delete Account", href: "/delete-account" }
  ],
  Connect: [
    { label: "Twitter", href: "#" },
    { label: "LinkedIn", href: "#" },
    { label: "Discord", href: "#" },
    { label: "Support", href: "mailto:support@xixoi.com" }
  ],
};

export const Footer = () => {
  return (
    <footer className="bg-foreground text-background py-16 px-6 border-t border-foreground">
      <div className="w-full max-w-6xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <video 
                src="/xiXoiLogo.mp4" 
                autoPlay 
                loop 
                muted 
                playsInline
                className="w-12 h-12 object-contain"
              />
              <h3 className="text-2xl font-bold">xiXoi™</h3>
            </div>
            <p className="text-sm opacity-70">
              Instant Ads for Everyone.
            </p>
          </div>
          
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h4 className="font-semibold mb-4 text-sm">{category}</h4>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-xs opacity-70 hover:opacity-100 transition-opacity"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="pt-8 border-t border-background/20">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-center md:text-left">
              <p className="text-xs opacity-70">
                © 2025 xiXoi™. All rights reserved.
              </p>
              <p className="text-xs opacity-60 mt-1">
                A product of STOLTZ ONE LLC (Georgia, USA)
              </p>
            </div>
            <div className="flex gap-6">
              <a href="/privacy" className="text-xs opacity-70 hover:opacity-100 transition-opacity">
                Privacy
              </a>
              <a href="/terms" className="text-xs opacity-70 hover:opacity-100 transition-opacity">
                Terms
              </a>
              <a href="mailto:support@xixoi.com" className="text-xs opacity-70 hover:opacity-100 transition-opacity">
                Contact
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
