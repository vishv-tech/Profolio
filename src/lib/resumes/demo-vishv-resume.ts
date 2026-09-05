import { normalizeResumeExtraction } from "@/lib/ai/normalize-portfolio";
import {
  GeminiResumeExtractionSchema,
  type GeminiResumeExtraction,
} from "@/lib/ai/resume-schema";
import type { PortfolioData } from "@/types/portfolio";

const VISHV_RESUME_EXTRACTION = {
  personal: {
    fullName: "Vishv Deepak Lange",
    headline: "B.SC. IT STUDENT | AI AUTOMATION | FULL-STACK DEVELOPMENT",
    email: "vishvlange843@gmail.com",
    phone: "9892829923",
    location: "Mumbai, India",
  },
  summary:
    "AI and full-stack development enthusiast pursuing B.Sc. IT, focused on building practical products with Next.js, React, Node.js, MongoDB and AI-assisted workflows. Seeking an AI Automation, Intelligent Solutions or Full Stack Internship where I can contribute through fast execution, clean UI development and product-focused problem solving.",
  experience: [],
  education: [
    {
      institution: "Guru Nanak Khalsa College, Mumbai",
      degree: "B.Sc. Information Technology",
      fieldOfStudy: "",
      location: "Mumbai, India",
      startDate: "",
      endDate: "",
      grade: "",
      description: "3rd Year",
    },
  ],
  projects: [
    {
      name: "VibeCode Studio - Multi-Agent AI Coding Workspace",
      technologies: [
        "Electron",
        "React",
        "TypeScript",
        "Node.js",
        "OpenRouter",
        "local project memory",
      ],
      description:
        "Built a desktop AI coding workspace where a multi-agent orchestrator routes tasks across planning, development and debugging flows.",
      highlights: [
        "Added local project memory so agents can share the same context; designed model-provider flow to use free models available through OpenRouter.",
      ],
      projectUrl: "",
      githubUrl: "",
      startDate: "",
      endDate: "",
    },
    {
      name: "Parkbnb - Parking Booking Web Platform",
      technologies: [
        "Next.js",
        "React",
        "TypeScript",
        "Tailwind CSS",
        "MongoDB",
        "APIs",
      ],
      description:
        "Built a parking marketplace where owners list spaces and seekers search, book and manage parking bookings.",
      highlights: [
        "Implemented listing flow, availability schedule, hourly pricing, booking logic, owner dashboard and admin overview concepts.",
      ],
      projectUrl: "",
      githubUrl: "",
      startDate: "",
      endDate: "",
    },
    {
      name: "Brandon.AI - AI Fashion & Product Content Studio",
      technologies: [
        "Next.js",
        "TypeScript",
        "Tailwind CSS",
        "Node.js",
        "Sharp",
        "mock AI",
        "mock Razorpay",
      ],
      description:
        "Built a premium MVP for brands to generate fashion catalog photos and cinematic product-video previews from uploaded images.",
      highlights: [
        "Created Photo Studio/Cinematic Studio workflows, watermarked previews, credits, mock payments and protected downloads.",
      ],
      projectUrl: "",
      githubUrl: "",
      startDate: "",
      endDate: "",
    },
    {
      name: "Szocial - Local Community & Business Discovery Platform",
      technologies: [
        "Next.js",
        "React",
        "Tailwind CSS",
        "Razorpay mock",
        "MongoDB-ready architecture",
      ],
      description:
        "Built a hyperlocal platform idea for neighbourhood posts, fun/help categories, business-owner flows and local discovery.",
      highlights: [
        "Planned local posts, chat, notifications, business listings and monetization through paid shop profiles.",
      ],
      projectUrl: "",
      githubUrl: "",
      startDate: "",
      endDate: "",
    },
    {
      name: "Detective.ai",
      technologies: [
        "Python",
        "FastAPI",
        "React",
        "TypeScript",
        "Vite",
        "PyTorch",
        "TorchVision",
        "NumPy",
        "Scikit-learn",
        "PyTest",
        "HTML",
        "CSS",
      ],
      description:
        "Developed a full-stack AI media detection web application that analyzes images, videos, and audio to estimate the likelihood of AI-generated content using a modular detection pipeline.",
      highlights: [
        "Built the backend with FastAPI (Python) and the frontend with React, TypeScript, and Vite, supporting secure file uploads, result visualization, and report generation.",
        "Designed the project with a scalable architecture for integrating PyTorch EfficientNet-B0 image detection models, along with automated testing using PyTest and a hybrid heuristic/model-based detection framework.",
      ],
      projectUrl: "",
      githubUrl: "",
      startDate: "",
      endDate: "",
    },
    {
      name: "SAGE AI - Multi-Agent AI Development Assistant",
      technologies: [
        "Electron",
        "React",
        "TypeScript",
        "Node.js",
        "OpenRouter",
        "AI Agents",
      ],
      description:
        "Built an AI-powered development workspace where multiple specialized agents collaborate to plan, develop and debug software projects.",
      highlights: [
        "Implemented agent orchestration, task routing and shared project memory to maintain context across development workflows.",
        "Designed Beginner and Advanced agent modes with role-based collaboration between software engineers, developers and planning agents.",
      ],
      projectUrl: "",
      githubUrl: "",
      startDate: "",
      endDate: "",
    },
    {
      name: "MovieVerse - Movie Discovery & Watchlist Platform",
      technologies: [
        "MongoDB",
        "Node.js",
        "Express.js",
        "React",
        "JavaScript",
        "REST APIs",
      ],
      description:
        "Built a movie discovery platform where users can browse, search and explore movies with detailed information and personalized watchlists.",
      highlights: [
        "Implemented MongoDB-based data management for users, movies and watchlist functionality with API-driven application flows.",
        "Added user-focused features including movie search, watchlist management and dynamic movie details for an interactive browsing experience.",
      ],
      projectUrl: "",
      githubUrl: "",
      startDate: "",
      endDate: "",
    },
    {
      name: "AwaazPay - UPI Voice Payment Alert App",
      technologies: [
        "Android",
        "Java",
        "NotificationListenerService",
        "Text-to-Speech",
        "Room Database",
      ],
      description:
        "Built an Android payment-alert app that turns a merchant's existing smartphone into a UPI soundbox by detecting supported payment notifications and announcing successful received payments aloud.",
      highlights: [
        "Implemented received-payment filtering, amount/app detection, duplicate prevention, transaction history, multilingual voice alerts in English/Hindi/Marathi, and scheduled listening controls.",
      ],
      projectUrl: "",
      githubUrl: "",
      startDate: "",
      endDate: "",
    },
  ],
  skills: [
    {
      category: "Languages",
      items: ["Java", "Python", "JavaScript", "HTML", "CSS"],
    },
    {
      category: "Frontend",
      items: ["React.js", "Next.js", "Tailwind CSS", "responsive UI design"],
    },
    {
      category: "Backend & DB",
      items: [
        "Node.js",
        "API routes",
        "MongoDB",
        "local JSON storage",
        "authentication flows",
      ],
    },
    {
      category: "AI & Tools",
      items: [
        "Agent orchestration",
        "OpenRouter",
        "prompt engineering",
        "Codex",
        "Cursor",
        "AI-assisted development",
      ],
    },
    {
      category: "Other",
      items: [
        "GitHub",
        "VS Code",
        "debugging",
        "MVP development",
        "product thinking",
      ],
    },
  ],
  achievements: [],
  certifications: [
    {
      name: "Internship Completion Certificate",
      issuer: "BharatCares × IBM SkillsBuild",
      issueDate: "",
      expiryDate: "",
      credentialId: "",
      credentialUrl: "",
    },
    {
      name: "IBM SkillsBuild - Introduction to Large Language Models",
      issuer: "IBM SkillsBuild",
      issueDate: "2025-11",
      expiryDate: "",
      credentialId: "",
      credentialUrl: "",
    },
    {
      name:
        "IBM SkillsBuild - The Data Pathway: From Learner to Data Professional",
      issuer: "IBM SkillsBuild",
      issueDate: "2025-12",
      expiryDate: "",
      credentialId: "",
      credentialUrl: "",
    },
  ],
  links: [
    {
      type: "linkedin",
      label: "LinkedIn",
      url: "https://www.linkedin.com/in/vishv-lange-a781352b7/",
    },
    {
      type: "github",
      label: "GitHub",
      url: "https://github.com/vishv-tech",
    },
  ],
  languages: [
    { name: "English", proficiency: "" },
    { name: "Hindi", proficiency: "" },
    { name: "Marathi", proficiency: "" },
  ],
  interests: [],
  customSections: [],
} satisfies GeminiResumeExtraction;

export function buildDemoVishvPortfolio(): PortfolioData {
  let nextId = 0;
  const extraction = GeminiResumeExtractionSchema.parse(
    VISHV_RESUME_EXTRACTION,
  );

  return normalizeResumeExtraction(extraction, {
    createId: () => `demo-vishv-${String(++nextId).padStart(3, "0")}`,
  });
}
