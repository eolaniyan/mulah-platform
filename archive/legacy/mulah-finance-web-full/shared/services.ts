// Comprehensive subscription services database for smart category detection
export interface ServicePlan {
  id: string;
  name: string;
  price: number;
  currency: string;
  billingCycle: 'monthly' | 'yearly';
  features?: string[];
  popular?: boolean;
}

export interface SubscriptionService {
  id: string;
  name: string;
  category: string;
  icon: string;
  color: string;
  description: string;
  website: string;
  plans: ServicePlan[];
  defaultPlan?: string;
}

export const SUBSCRIPTION_CATEGORIES = [
  { id: 'streaming', name: 'Streaming & Entertainment', icon: '▶️', color: '#e53e3e' },
  { id: 'productivity', name: 'Productivity & Work', icon: '💼', color: '#3182ce' },
  { id: 'cloud', name: 'Cloud & Storage', icon: '☁️', color: '#38a169' },
  { id: 'music', name: 'Music & Audio', icon: '🎵', color: '#d69e2e' },
  { id: 'fitness', name: 'Health & Fitness', icon: '💪', color: '#dd6b20' },
  { id: 'news', name: 'News & Information', icon: '📰', color: '#805ad5' },
  { id: 'design', name: 'Design & Creative', icon: '🎨', color: '#ed64a6' },
  { id: 'developer', name: 'Developer Tools', icon: '💻', color: '#319795' },
  { id: 'gaming', name: 'Gaming', icon: '🎮', color: '#e53e3e' },
  { id: 'food', name: 'Food & Delivery', icon: '🍽️', color: '#f56500' },
  { id: 'transport', name: 'Transport & Travel', icon: '🚗', color: '#3182ce' },
  { id: 'financial', name: 'Financial Services', icon: '💳', color: '#38a169' },
  { id: 'other', name: 'Other', icon: '⚡', color: '#718096' }
];

export const SUBSCRIPTION_SERVICES: SubscriptionService[] = [
  // Streaming & Entertainment
  {
    id: 'netflix',
    name: 'Netflix',
    category: 'streaming',
    icon: 'fab fa-netflix',
    color: '#E50914',
    description: 'Movies and TV shows streaming',
    website: 'netflix.com',
    plans: [
      { id: 'basic', name: 'Basic', price: 8.99, currency: 'EUR', billingCycle: 'monthly' },
      { id: 'standard', name: 'Standard', price: 13.49, currency: 'EUR', billingCycle: 'monthly', popular: true },
      { id: 'premium', name: 'Premium', price: 17.99, currency: 'EUR', billingCycle: 'monthly' }
    ],
    defaultPlan: 'standard'
  },
  {
    id: 'disney-plus',
    name: 'Disney+',
    category: 'streaming',
    icon: 'fas fa-castle',
    color: '#113CCF',
    description: 'Disney, Marvel, Star Wars content',
    website: 'disneyplus.com',
    plans: [
      { id: 'monthly', name: 'Monthly', price: 8.99, currency: 'EUR', billingCycle: 'monthly' },
      { id: 'yearly', name: 'Annual', price: 89.90, currency: 'EUR', billingCycle: 'yearly', popular: true }
    ],
    defaultPlan: 'monthly'
  },
  {
    id: 'amazon-prime',
    name: 'Amazon Prime',
    category: 'streaming',
    icon: 'fab fa-amazon',
    color: '#FF9900',
    description: 'Prime Video, delivery, and more',
    website: 'amazon.com',
    plans: [
      { id: 'monthly', name: 'Monthly', price: 8.99, currency: 'EUR', billingCycle: 'monthly' },
      { id: 'yearly', name: 'Annual', price: 89.90, currency: 'EUR', billingCycle: 'yearly', popular: true }
    ],
    defaultPlan: 'yearly'
  },
  {
    id: 'hbo-max',
    name: 'HBO Max',
    category: 'streaming',
    icon: 'fas fa-film',
    color: '#9B37FF',
    description: 'Premium HBO content and originals',
    website: 'hbomax.com',
    plans: [
      { id: 'monthly', name: 'Monthly', price: 8.99, currency: 'EUR', billingCycle: 'monthly', popular: true }
    ],
    defaultPlan: 'monthly'
  },
  {
    id: 'youtube-premium',
    name: 'YouTube Premium',
    category: 'streaming',
    icon: 'fab fa-youtube',
    color: '#FF0000',
    description: 'Ad-free YouTube and YouTube Music',
    website: 'youtube.com',
    plans: [
      { id: 'individual', name: 'Individual', price: 11.99, currency: 'EUR', billingCycle: 'monthly', popular: true },
      { id: 'family', name: 'Family', price: 17.99, currency: 'EUR', billingCycle: 'monthly' }
    ],
    defaultPlan: 'individual'
  },

  // Music & Audio
  {
    id: 'spotify',
    name: 'Spotify',
    category: 'music',
    icon: 'fab fa-spotify',
    color: '#1DB954',
    description: 'Music streaming service',
    website: 'spotify.com',
    plans: [
      { id: 'premium', name: 'Premium', price: 9.99, currency: 'EUR', billingCycle: 'monthly', popular: true },
      { id: 'duo', name: 'Duo', price: 12.99, currency: 'EUR', billingCycle: 'monthly' },
      { id: 'family', name: 'Family', price: 15.99, currency: 'EUR', billingCycle: 'monthly' }
    ],
    defaultPlan: 'premium'
  },
  {
    id: 'apple-music',
    name: 'Apple Music',
    category: 'music',
    icon: 'fab fa-apple',
    color: '#FA243C',
    description: 'Apple\'s music streaming service',
    website: 'music.apple.com',
    plans: [
      { id: 'individual', name: 'Individual', price: 9.99, currency: 'EUR', billingCycle: 'monthly', popular: true },
      { id: 'family', name: 'Family', price: 14.99, currency: 'EUR', billingCycle: 'monthly' }
    ],
    defaultPlan: 'individual'
  },

  // Productivity & Work
  {
    id: 'microsoft-365',
    name: 'Microsoft 365',
    category: 'productivity',
    icon: 'fab fa-microsoft',
    color: '#0078D4',
    description: 'Office apps and cloud storage',
    website: 'microsoft.com',
    plans: [
      { id: 'personal', name: 'Personal', price: 6.99, currency: 'EUR', billingCycle: 'monthly' },
      { id: 'family', name: 'Family', price: 9.99, currency: 'EUR', billingCycle: 'monthly', popular: true },
      { id: 'business-basic', name: 'Business Basic', price: 5.60, currency: 'EUR', billingCycle: 'monthly' }
    ],
    defaultPlan: 'family'
  },
  {
    id: 'google-workspace',
    name: 'Google Workspace',
    category: 'productivity',
    icon: 'fab fa-google',
    color: '#4285F4',
    description: 'Gmail, Drive, Docs and more',
    website: 'workspace.google.com',
    plans: [
      { id: 'business-starter', name: 'Business Starter', price: 5.75, currency: 'EUR', billingCycle: 'monthly', popular: true },
      { id: 'business-standard', name: 'Business Standard', price: 11.50, currency: 'EUR', billingCycle: 'monthly' }
    ],
    defaultPlan: 'business-starter'
  },
  {
    id: 'notion',
    name: 'Notion',
    category: 'productivity',
    icon: 'fas fa-sticky-note',
    color: '#000000',
    description: 'All-in-one workspace',
    website: 'notion.so',
    plans: [
      { id: 'personal-pro', name: 'Personal Pro', price: 4.00, currency: 'EUR', billingCycle: 'monthly' },
      { id: 'team', name: 'Team', price: 8.00, currency: 'EUR', billingCycle: 'monthly', popular: true }
    ],
    defaultPlan: 'team'
  },

  // Design & Creative
  {
    id: 'adobe-cc',
    name: 'Adobe Creative Cloud',
    category: 'design',
    icon: 'fab fa-adobe',
    color: '#FF0000',
    description: 'Professional creative apps',
    website: 'adobe.com',
    plans: [
      { id: 'photography', name: 'Photography', price: 11.89, currency: 'EUR', billingCycle: 'monthly' },
      { id: 'single-app', name: 'Single App', price: 23.79, currency: 'EUR', billingCycle: 'monthly' },
      { id: 'all-apps', name: 'All Apps', price: 59.99, currency: 'EUR', billingCycle: 'monthly', popular: true }
    ],
    defaultPlan: 'all-apps'
  },
  {
    id: 'figma',
    name: 'Figma',
    category: 'design',
    icon: 'fab fa-figma',
    color: '#F24E1E',
    description: 'Collaborative design tool',
    website: 'figma.com',
    plans: [
      { id: 'professional', name: 'Professional', price: 12.00, currency: 'EUR', billingCycle: 'monthly', popular: true },
      { id: 'organization', name: 'Organization', price: 45.00, currency: 'EUR', billingCycle: 'monthly' }
    ],
    defaultPlan: 'professional'
  },

  // Cloud & Storage
  {
    id: 'dropbox',
    name: 'Dropbox',
    category: 'cloud',
    icon: 'fab fa-dropbox',
    color: '#0061FF',
    description: 'Cloud storage and sync',
    website: 'dropbox.com',
    plans: [
      { id: 'plus', name: 'Plus', price: 9.99, currency: 'EUR', billingCycle: 'monthly', popular: true },
      { id: 'family', name: 'Family', price: 16.99, currency: 'EUR', billingCycle: 'monthly' },
      { id: 'professional', name: 'Professional', price: 19.99, currency: 'EUR', billingCycle: 'monthly' }
    ],
    defaultPlan: 'plus'
  },
  {
    id: 'google-one',
    name: 'Google One',
    category: 'cloud',
    icon: 'fab fa-google-drive',
    color: '#4285F4',
    description: 'Google cloud storage',
    website: 'one.google.com',
    plans: [
      { id: '100gb', name: '100 GB', price: 1.99, currency: 'EUR', billingCycle: 'monthly' },
      { id: '200gb', name: '200 GB', price: 2.99, currency: 'EUR', billingCycle: 'monthly', popular: true },
      { id: '2tb', name: '2 TB', price: 9.99, currency: 'EUR', billingCycle: 'monthly' }
    ],
    defaultPlan: '200gb'
  },

  // Developer Tools
  {
    id: 'github',
    name: 'GitHub',
    category: 'developer',
    icon: 'fab fa-github',
    color: '#181717',
    description: 'Code hosting and collaboration',
    website: 'github.com',
    plans: [
      { id: 'pro', name: 'Pro', price: 4.00, currency: 'EUR', billingCycle: 'monthly' },
      { id: 'team', name: 'Team', price: 4.00, currency: 'EUR', billingCycle: 'monthly', popular: true },
      { id: 'pro-yearly', name: 'Pro (Annual)', price: 48.00, currency: 'EUR', billingCycle: 'yearly' }
    ],
    defaultPlan: 'team'
  },
  {
    id: 'vercel',
    name: 'Vercel',
    category: 'developer',
    icon: 'fas fa-triangle',
    color: '#000000',
    description: 'Frontend deployment platform',
    website: 'vercel.com',
    plans: [
      { id: 'pro', name: 'Pro', price: 20.00, currency: 'EUR', billingCycle: 'monthly', popular: true },
      { id: 'team', name: 'Team', price: 40.00, currency: 'EUR', billingCycle: 'monthly' }
    ],
    defaultPlan: 'pro'
  },

  // Gaming
  {
    id: 'xbox-game-pass',
    name: 'Xbox Game Pass',
    category: 'gaming',
    icon: 'fab fa-xbox',
    color: '#107C10',
    description: 'Gaming subscription service',
    website: 'xbox.com',
    plans: [
      { id: 'console', name: 'Console', price: 9.99, currency: 'EUR', billingCycle: 'monthly' },
      { id: 'pc', name: 'PC', price: 9.99, currency: 'EUR', billingCycle: 'monthly' },
      { id: 'ultimate', name: 'Ultimate', price: 12.99, currency: 'EUR', billingCycle: 'monthly', popular: true }
    ],
    defaultPlan: 'ultimate'
  },
  {
    id: 'playstation-plus',
    name: 'PlayStation Plus',
    category: 'gaming',
    icon: 'fab fa-playstation',
    color: '#003087',
    description: 'PlayStation gaming service',
    website: 'playstation.com',
    plans: [
      { id: 'essential', name: 'Essential', price: 8.99, currency: 'EUR', billingCycle: 'monthly' },
      { id: 'extra', name: 'Extra', price: 13.99, currency: 'EUR', billingCycle: 'monthly', popular: true },
      { id: 'premium', name: 'Premium', price: 16.99, currency: 'EUR', billingCycle: 'monthly' }
    ],
    defaultPlan: 'extra'
  },

  // Food & Delivery
  {
    id: 'uber-eats-pass',
    name: 'Uber Eats Pass',
    category: 'food',
    icon: 'fab fa-uber',
    color: '#000000',
    description: 'Food delivery subscription',
    website: 'ubereats.com',
    plans: [
      { id: 'monthly', name: 'Monthly', price: 4.99, currency: 'EUR', billingCycle: 'monthly', popular: true }
    ],
    defaultPlan: 'monthly'
  },
  {
    id: 'deliveroo-plus',
    name: 'Deliveroo Plus',
    category: 'food',
    icon: 'fas fa-motorcycle',
    color: '#00CCBC',
    description: 'Free delivery on orders',
    website: 'deliveroo.com',
    plans: [
      { id: 'monthly', name: 'Monthly', price: 3.49, currency: 'EUR', billingCycle: 'monthly', popular: true }
    ],
    defaultPlan: 'monthly'
  },

  // Health & Fitness
  {
    id: 'peloton',
    name: 'Peloton Digital',
    category: 'fitness',
    icon: 'fas fa-bicycle',
    color: '#262626',
    description: 'Fitness classes and training',
    website: 'onepeloton.com',
    plans: [
      { id: 'digital', name: 'Digital', price: 12.99, currency: 'EUR', billingCycle: 'monthly', popular: true }
    ],
    defaultPlan: 'digital'
  },
  {
    id: 'myfitnesspal',
    name: 'MyFitnessPal Premium',
    category: 'fitness',
    icon: 'fas fa-apple-alt',
    color: '#0072CE',
    description: 'Nutrition tracking and analysis',
    website: 'myfitnesspal.com',
    plans: [
      { id: 'premium', name: 'Premium', price: 9.99, currency: 'EUR', billingCycle: 'monthly', popular: true },
      { id: 'premium-yearly', name: 'Premium (Annual)', price: 49.99, currency: 'EUR', billingCycle: 'yearly' }
    ],
    defaultPlan: 'premium'
  }
];

export function findServiceByName(name: string): SubscriptionService | undefined {
  const searchName = name.toLowerCase().trim();
  return SUBSCRIPTION_SERVICES.find(service => 
    service.name.toLowerCase().includes(searchName) ||
    service.id.includes(searchName) ||
    searchName.includes(service.name.toLowerCase())
  );
}

export function getCategoryById(categoryId: string) {
  return SUBSCRIPTION_CATEGORIES.find(cat => cat.id === categoryId);
}

export function getServicesByCategory(categoryId: string): SubscriptionService[] {
  return SUBSCRIPTION_SERVICES.filter(service => service.category === categoryId);
}