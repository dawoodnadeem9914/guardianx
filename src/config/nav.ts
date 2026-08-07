export interface NavLink {
  label: string;
  href: string;
  description?: string;
}

export interface NavGroup {
  label: string;
  links: NavLink[];
}

export const navGroups: NavGroup[] = [
  {
    label: "Product",
    links: [
      { label: "Features", href: "/features", description: "Every capability, end to end" },
      { label: "AI Technology", href: "/ai-technology", description: "Vision AI, GPT-4o mini, RAG" },
      { label: "How It Works", href: "/how-it-works", description: "Recognize to Protect, in order" },
      { label: "Emergency Workflow", href: "/emergency-workflow", description: "The full incident lifecycle" },
      { label: "AI Explainability", href: "/explainability", description: "Confidence, evidence, source" },
    ],
  },
  {
    label: "Solutions",
    links: [
      { label: "Campus Mode", href: "/campus-mode", description: "For universities & schools" },
      { label: "Hospital Dashboard", href: "/hospital-dashboard", description: "Pre-arrival patient handoff" },
      { label: "Simulation Mode", href: "/simulation-mode", description: "Practice before it's real" },
    ],
  },
  {
    label: "Company",
    links: [
      { label: "About", href: "/about", description: "Why we built GuardianX" },
      { label: "SDG Impact", href: "/sdg-impact", description: "SDG 3, 9 & 11 alignment" },
      { label: "Business Model", href: "/business-model", description: "How GuardianX sustains itself" },
      { label: "Roadmap", href: "/roadmap", description: "5-year and 10-year vision" },
      { label: "Team", href: "/team", description: "The people building GuardianX" },
    ],
  },
  {
    label: "Resources",
    links: [
      { label: "Technology Stack", href: "/technology-stack", description: "What GuardianX is built on" },
      { label: "Security & Privacy", href: "/security-privacy", description: "How data is protected" },
      { label: "FAQ", href: "/faq", description: "Common questions, answered" },
      { label: "Demo", href: "/demo", description: "See the 5-minute walkthrough" },
    ],
  },
];

export const footerLinks = navGroups;

export const contactHref = "/contact";
