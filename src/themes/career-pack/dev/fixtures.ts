import type { PortfolioData } from "@/types/portfolio";
import type { ThemeConfig } from "@/types/theme";

export const careerThemeFixtureConfig: ThemeConfig = {
  appearance: {
    colorMode: "light",
    backgroundColor: "#f8fafc",
    surfaceColor: "#ffffff",
    textColor: "#172033",
    mutedTextColor: "#526078",
    accentColor: "#2457d6",
    borderColor: "#d7deea",
    fontFamily: "Geist",
    headingFontFamily: "Playfair Display",
    borderRadius: 12,
    spacing: "comfortable",
    animationIntensity: "subtle",
  },
  sections: {
    order: [
      "summary",
      "projects",
      "experience",
      "skills",
      "education",
      "achievements",
      "certifications",
      "languages",
      "interests",
      "customSections",
    ],
    hidden: [],
  },
  visibility: {
    showProfileImage: true,
    showEmail: true,
    showPhone: true,
    showLocation: true,
    showLinks: true,
  },
};

export const fullPortfolioFixture: PortfolioData = {
  personal: {
    fullName: "Avery Morgan",
    headline: "Cross-functional product and operations leader",
    email: "avery@example.com",
    phone: "+1 555 010 2486",
    location: "Toronto, Canada",
    profileImageUrl: "https://images.example.com/avery-morgan.webp",
  },
  summary:
    "I turn ambiguous customer and business problems into practical products, programs, and measurable outcomes.",
  experience: [
    {
      id: "experience-1",
      company: "Northstar Works",
      role: "Lead Strategist",
      employmentType: "Full-time",
      location: "Toronto, Canada",
      startDate: "2022-04",
      endDate: "",
      isCurrent: true,
      description: "Lead multidisciplinary teams from discovery through delivery.",
      highlights: [
        "Launched a new service line across three markets.",
        "Reduced delivery lead time by 28% through workflow redesign.",
      ],
    },
    {
      id: "experience-2",
      company: "Field & Form",
      role: "Senior Consultant",
      employmentType: "Full-time",
      location: "Vancouver, Canada",
      startDate: "2019-01",
      endDate: "2022-03",
      isCurrent: false,
      description: "Advised growing teams on research, operating models, and delivery systems.",
      highlights: ["Built repeatable planning practices for a 60-person organization."],
    },
  ],
  education: [
    {
      id: "education-1",
      institution: "Lakeshore University",
      degree: "Master of Design",
      fieldOfStudy: "Strategic Innovation",
      location: "Toronto, Canada",
      startDate: "2017-09",
      endDate: "2019-05",
      grade: "Distinction",
      description: "Focused on systems thinking, research, and responsible innovation.",
    },
  ],
  projects: [
    {
      id: "project-1",
      name: "Community Services Navigator",
      description: "A service and digital product helping residents find local support.",
      technologies: ["Service design", "Research", "Prototyping"],
      highlights: ["Validated with 42 residents and six service organizations."],
      projectUrl: "https://example.com/projects/services-navigator",
      githubUrl: "",
      startDate: "2023-02",
      endDate: "2023-11",
    },
    {
      id: "project-2",
      name: "Operations Signal Dashboard",
      description: "A lightweight decision system connecting delivery risks to team actions.",
      technologies: ["Data modeling", "Facilitation", "Change management"],
      highlights: ["Adopted by four departments after a six-week pilot."],
      projectUrl: "https://example.com/projects/operations-signal",
      githubUrl: "https://github.com/example/operations-signal",
      startDate: "2022-06",
      endDate: "2022-12",
    },
  ],
  skills: [
    {
      id: "skills-1",
      category: "Strategy",
      items: ["Research synthesis", "Roadmapping", "Operating models"],
    },
    {
      id: "skills-2",
      category: "Delivery",
      items: ["Facilitation", "Prototyping", "Program leadership"],
    },
  ],
  achievements: [
    {
      id: "achievement-1",
      title: "Emerging Leader Award",
      issuer: "Regional Design Council",
      date: "2024-06",
      description: "Recognized for community-centered systems work.",
    },
  ],
  certifications: [
    {
      id: "certification-1",
      name: "Certified Change Practitioner",
      issuer: "Practice Institute",
      issueDate: "2021-10",
      expiryDate: "2027-10",
      credentialId: "CCP-1042",
      credentialUrl: "https://example.com/credentials/ccp-1042",
    },
  ],
  links: [
    {
      id: "link-1",
      type: "linkedin",
      label: "LinkedIn",
      url: "https://www.linkedin.com/in/example",
    },
    {
      id: "link-2",
      type: "portfolio",
      label: "Selected work",
      url: "https://example.com/avery",
    },
  ],
  languages: [
    { id: "language-1", name: "English", proficiency: "Native" },
    { id: "language-2", name: "French", proficiency: "Professional" },
  ],
  interests: ["Public spaces", "Documentary photography", "Cycling"],
  customSections: [
    {
      id: "custom-1",
      title: "Community work",
      items: [
        {
          id: "custom-item-1",
          title: "Volunteer mentor",
          subtitle: "Open Practice Network",
          date: "2021 – Present",
          description: "Mentor early-career practitioners through monthly portfolio reviews.",
        },
      ],
    },
  ],
};

export const sparsePortfolioFixture: PortfolioData = {
  personal: {
    fullName: "Jordan Lee",
    headline: "Early-career professional",
    email: "",
    phone: "",
    location: "",
    profileImageUrl: "",
  },
  summary: "Curious, dependable, and ready to contribute.",
  experience: [],
  education: [],
  projects: [],
  skills: [],
  achievements: [],
  certifications: [],
  links: [],
  languages: [],
  interests: [],
  customSections: [],
};
