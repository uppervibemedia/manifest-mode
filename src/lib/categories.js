export const CATEGORIES = [
  {
    id: "wealth",
    label: "Wealth",
    icon: "💰",
    color: "#fbbf24",
    meaning: "Money, income, abundance, savings, luxury purchases",
    prompt: "What does financial freedom look like in your life?",
  },
  {
    id: "home",
    label: "Home",
    icon: "🏡",
    color: "#a78bfa",
    meaning: "House, apartment, dream space, environment",
    prompt: "Describe the space where your future self lives.",
  },
  {
    id: "body",
    label: "Body",
    icon: "💪",
    color: "#34d399",
    meaning: "Fitness, health, appearance, energy",
    prompt: "How does your future body look and feel?",
  },
  {
    id: "love",
    label: "Love",
    icon: "❤️",
    color: "#f87171",
    meaning: "Relationships, marriage, family, connection",
    prompt: "Who are the people in your ideal future life?",
  },
  {
    id: "business",
    label: "Business",
    icon: "🚀",
    color: "#60a5fa",
    meaning: "Brand, career, clients, success, productivity",
    prompt: "What does your future career or business look like?",
  },
  {
    id: "lifestyle",
    label: "Lifestyle",
    icon: "✨",
    color: "#f9a8d4",
    meaning: "Car, travel, fashion, freedom, experiences",
    prompt: "What experiences define your dream lifestyle?",
  },
  {
    id: "spiritual",
    label: "Spiritual Growth",
    icon: "🌙",
    color: "#818cf8",
    meaning: "Peace, purpose, faith, healing, inner alignment",
    prompt: "What does a deeply aligned inner life feel like?",
  },
];

export const CATEGORY_MAP = Object.fromEntries(CATEGORIES.map(c => [c.id, c]));

export const getCategoryMeta = (id) => CATEGORY_MAP[id] || { icon: "✦", color: "#fbbf24", label: id, meaning: "" };