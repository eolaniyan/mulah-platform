// Service Catalog with real pricing and management deep-links
// Prices are in EUR and reflect current market rates (December 2024)

export interface ServicePlan {
  name: string;
  monthlyPrice: number;
  yearlyPrice?: number;
  features: string[];
  isPopular?: boolean;
}

export interface ServiceInfo {
  id: string;
  name: string;
  category: string;
  icon: string;
  color: string;
  website: string;
  managementUrl: string;
  cancelUrl?: string;
  plans: ServicePlan[];
  tips?: string[];
}

export const SERVICE_CATALOG: Record<string, ServiceInfo> = {
  // Streaming Services
  "disney+": {
    id: "disney+",
    name: "Disney+",
    category: "streaming",
    icon: "fa-play",
    color: "#113CCF",
    website: "https://www.disneyplus.com",
    managementUrl: "https://www.disneyplus.com/account/subscription",
    cancelUrl: "https://www.disneyplus.com/account/subscription",
    plans: [
      {
        name: "Standard with Ads",
        monthlyPrice: 5.99,
        yearlyPrice: 59.90,
        features: ["Full library", "2 screens", "1080p", "Ad-supported"]
      },
      {
        name: "Standard",
        monthlyPrice: 8.99,
        yearlyPrice: 89.90,
        features: ["Full library", "2 screens", "1080p", "No ads", "Downloads"],
        isPopular: true
      },
      {
        name: "Premium",
        monthlyPrice: 11.99,
        yearlyPrice: 119.90,
        features: ["Full library", "4 screens", "4K HDR", "Dolby Atmos", "No ads"]
      }
    ],
    tips: [
      "Annual billing saves ~15% compared to monthly",
      "Consider Standard with Ads if you don't mind occasional ads",
      "Bundle with Hulu and ESPN+ for better value in some regions"
    ]
  },
  
  "netflix": {
    id: "netflix",
    name: "Netflix",
    category: "streaming",
    icon: "fa-play",
    color: "#E50914",
    website: "https://www.netflix.com",
    managementUrl: "https://www.netflix.com/YourAccount",
    cancelUrl: "https://www.netflix.com/cancelplan",
    plans: [
      {
        name: "Standard with Ads",
        monthlyPrice: 6.99,
        features: ["Most content", "2 screens", "1080p", "Ad-supported"]
      },
      {
        name: "Standard",
        monthlyPrice: 13.49,
        features: ["Full library", "2 screens", "1080p", "Downloads"],
        isPopular: true
      },
      {
        name: "Premium",
        monthlyPrice: 17.99,
        features: ["Full library", "4 screens", "4K HDR", "Dolby Atmos", "Extra member slots"]
      }
    ],
    tips: [
      "Standard with Ads is €6.50 cheaper/month than Standard",
      "Share Premium with family to split the cost",
      "Download shows for offline viewing to get more value"
    ]
  },
  
  "spotify": {
    id: "spotify",
    name: "Spotify",
    category: "music",
    icon: "fa-music",
    color: "#1DB954",
    website: "https://www.spotify.com",
    managementUrl: "https://www.spotify.com/account/subscription/",
    cancelUrl: "https://www.spotify.com/account/subscription/cancel/",
    plans: [
      {
        name: "Free",
        monthlyPrice: 0,
        features: ["Ad-supported", "Shuffle only on mobile", "Limited skips"]
      },
      {
        name: "Individual",
        monthlyPrice: 10.99,
        features: ["No ads", "Offline downloads", "High quality audio"],
        isPopular: true
      },
      {
        name: "Duo",
        monthlyPrice: 14.99,
        features: ["2 accounts", "No ads", "Duo Mix playlist"]
      },
      {
        name: "Family",
        monthlyPrice: 17.99,
        features: ["Up to 6 accounts", "No ads", "Spotify Kids", "Family Mix"]
      },
      {
        name: "Student",
        monthlyPrice: 5.99,
        features: ["No ads", "Student verification required"]
      }
    ],
    tips: [
      "Family plan is cheapest per person if you have 3+ people",
      "Student discount is 45% off if you qualify",
      "Free tier is perfectly usable if you don't mind ads"
    ]
  },
  
  "youtube": {
    id: "youtube",
    name: "YouTube Premium",
    category: "streaming",
    icon: "fa-youtube",
    color: "#FF0000",
    website: "https://www.youtube.com/premium",
    managementUrl: "https://www.youtube.com/paid_memberships",
    cancelUrl: "https://www.youtube.com/paid_memberships",
    plans: [
      {
        name: "Free",
        monthlyPrice: 0,
        features: ["Ad-supported", "Basic features"]
      },
      {
        name: "Individual",
        monthlyPrice: 12.99,
        yearlyPrice: 129.99,
        features: ["No ads", "Background play", "Downloads", "YouTube Music"],
        isPopular: true
      },
      {
        name: "Family",
        monthlyPrice: 22.99,
        features: ["Up to 6 accounts", "No ads", "YouTube Music", "YouTube Kids"]
      },
      {
        name: "Student",
        monthlyPrice: 7.99,
        features: ["No ads", "Student verification required"]
      }
    ],
    tips: [
      "Family plan saves money if 2+ people in household watch YouTube",
      "YouTube Music is included - cancel separate music subscriptions",
      "Consider if you really need ad-free or if Free works for you"
    ]
  },
  
  "amazon prime": {
    id: "amazon prime",
    name: "Amazon Prime",
    category: "shopping",
    icon: "fa-amazon",
    color: "#FF9900",
    website: "https://www.amazon.com/prime",
    managementUrl: "https://www.amazon.com/mc/prime",
    cancelUrl: "https://www.amazon.com/mc/prime/cancel",
    plans: [
      {
        name: "Prime Monthly",
        monthlyPrice: 8.99,
        features: ["Free delivery", "Prime Video", "Prime Music", "Prime Reading"]
      },
      {
        name: "Prime Annual",
        monthlyPrice: 4.92,
        yearlyPrice: 59.00,
        features: ["Free delivery", "Prime Video", "Prime Music", "Prime Reading", "17% savings"],
        isPopular: true
      },
      {
        name: "Prime Video Only",
        monthlyPrice: 5.99,
        features: ["Prime Video streaming only"]
      }
    ],
    tips: [
      "Annual saves €48/year compared to monthly",
      "Prime Video Only is €3/month cheaper if you don't need shipping",
      "Students get 50% off with Prime Student"
    ]
  },
  
  "apple music": {
    id: "apple music",
    name: "Apple Music",
    category: "music",
    icon: "fa-apple",
    color: "#FA243C",
    website: "https://music.apple.com",
    managementUrl: "https://support.apple.com/en-us/HT202039",
    plans: [
      {
        name: "Voice",
        monthlyPrice: 4.99,
        features: ["Siri-only control", "All Apple Music catalog"]
      },
      {
        name: "Individual",
        monthlyPrice: 10.99,
        features: ["Full access", "Spatial Audio", "Lossless Audio"],
        isPopular: true
      },
      {
        name: "Family",
        monthlyPrice: 16.99,
        features: ["Up to 6 accounts", "Full access for all"]
      },
      {
        name: "Student",
        monthlyPrice: 5.99,
        features: ["Full access", "Apple TV+ included"]
      }
    ],
    tips: [
      "Voice plan is half the price if you only use Siri to play music",
      "Family plan is worthwhile with 2+ people",
      "Apple One bundles can save money if you use multiple Apple services"
    ]
  },
  
  "hbo max": {
    id: "hbo max",
    name: "Max (HBO)",
    category: "streaming",
    icon: "fa-play",
    color: "#5822B4",
    website: "https://www.max.com",
    managementUrl: "https://www.max.com/account/subscription",
    plans: [
      {
        name: "With Ads",
        monthlyPrice: 5.99,
        yearlyPrice: 59.99,
        features: ["Full library", "2 screens", "1080p", "Ad-supported"]
      },
      {
        name: "Ad-Free",
        monthlyPrice: 15.99,
        yearlyPrice: 149.99,
        features: ["Full library", "2 screens", "1080p", "Downloads"],
        isPopular: true
      },
      {
        name: "Ultimate",
        monthlyPrice: 19.99,
        yearlyPrice: 199.99,
        features: ["Full library", "4 screens", "4K HDR", "Dolby Atmos"]
      }
    ],
    tips: [
      "With Ads tier saves €10/month vs Ad-Free",
      "Annual billing saves ~15% on all tiers",
      "Ultimate only worth it if you have 4K TV"
    ]
  },
  
  "apple tv+": {
    id: "apple tv+",
    name: "Apple TV+",
    category: "streaming",
    icon: "fa-apple",
    color: "#000000",
    website: "https://tv.apple.com",
    managementUrl: "https://support.apple.com/en-us/HT202039",
    plans: [
      {
        name: "Monthly",
        monthlyPrice: 9.99,
        features: ["All originals", "4K HDR", "6 family members", "Dolby Atmos"],
        isPopular: true
      },
      {
        name: "Apple One Individual",
        monthlyPrice: 19.95,
        features: ["TV+", "Music", "Arcade", "iCloud+ 50GB"]
      },
      {
        name: "Apple One Family",
        monthlyPrice: 25.95,
        features: ["TV+", "Music", "Arcade", "iCloud+ 200GB", "6 family members"]
      }
    ],
    tips: [
      "Free for 3 months when buying Apple device",
      "Consider Apple One if you use other Apple services",
      "Smaller library than Netflix but high-quality originals"
    ]
  },
  
  // Productivity
  "microsoft 365": {
    id: "microsoft 365",
    name: "Microsoft 365",
    category: "productivity",
    icon: "fa-microsoft",
    color: "#00A4EF",
    website: "https://www.microsoft.com/microsoft-365",
    managementUrl: "https://account.microsoft.com/services",
    plans: [
      {
        name: "Personal",
        monthlyPrice: 7.00,
        yearlyPrice: 69.00,
        features: ["1 user", "1TB OneDrive", "Office apps", "Outlook premium"],
        isPopular: true
      },
      {
        name: "Family",
        monthlyPrice: 10.00,
        yearlyPrice: 99.00,
        features: ["Up to 6 users", "6TB total storage", "Office apps", "Outlook premium"]
      }
    ],
    tips: [
      "Annual saves ~17% compared to monthly",
      "Family plan is cheaper per person with 2+ users",
      "Free web versions of Office apps may be enough for basic use"
    ]
  },
  
  "chatgpt": {
    id: "chatgpt",
    name: "ChatGPT Plus",
    category: "productivity",
    icon: "fa-robot",
    color: "#10A37F",
    website: "https://chat.openai.com",
    managementUrl: "https://chat.openai.com/settings/subscription",
    plans: [
      {
        name: "Free",
        monthlyPrice: 0,
        features: ["GPT-3.5", "Limited GPT-4", "Basic features"]
      },
      {
        name: "Plus",
        monthlyPrice: 20.00,
        features: ["GPT-4", "DALL-E", "Advanced Data Analysis", "Priority access"],
        isPopular: true
      },
      {
        name: "Team",
        monthlyPrice: 25.00,
        features: ["Everything in Plus", "Admin console", "Workspace features"]
      }
    ],
    tips: [
      "Free tier gives limited GPT-4 access now",
      "Evaluate if you use it enough to justify €20/month",
      "Team plan only worth it for business use"
    ]
  },
  
  // Gaming
  "xbox game pass": {
    id: "xbox game pass",
    name: "Xbox Game Pass",
    category: "gaming",
    icon: "fa-xbox",
    color: "#107C10",
    website: "https://www.xbox.com/gamepass",
    managementUrl: "https://account.microsoft.com/services/xboxgamepass",
    plans: [
      {
        name: "Core",
        monthlyPrice: 6.99,
        features: ["Online multiplayer", "Limited game catalog", "Discounts"]
      },
      {
        name: "Standard",
        monthlyPrice: 12.99,
        features: ["100s of games", "Day one releases", "EA Play"],
        isPopular: true
      },
      {
        name: "Ultimate",
        monthlyPrice: 17.99,
        features: ["PC + Console + Cloud", "EA Play", "Perks", "Day one releases"]
      }
    ],
    tips: [
      "Core is enough if you just want online multiplayer",
      "Ultimate is only worth it if you play on multiple platforms",
      "Watch for €1 trial offers for new subscribers"
    ]
  },
  
  "playstation plus": {
    id: "playstation plus",
    name: "PlayStation Plus",
    category: "gaming",
    icon: "fa-playstation",
    color: "#003087",
    website: "https://www.playstation.com/ps-plus",
    managementUrl: "https://www.playstation.com/acct/management",
    plans: [
      {
        name: "Essential",
        monthlyPrice: 8.99,
        yearlyPrice: 71.99,
        features: ["Online multiplayer", "Monthly games", "Cloud saves"]
      },
      {
        name: "Extra",
        monthlyPrice: 13.99,
        yearlyPrice: 134.99,
        features: ["Essential benefits", "Game catalog (400+ games)"],
        isPopular: true
      },
      {
        name: "Premium",
        monthlyPrice: 16.99,
        yearlyPrice: 159.99,
        features: ["Extra benefits", "Classics catalog", "Cloud streaming", "Game trials"]
      }
    ],
    tips: [
      "Annual saves up to 40% vs monthly",
      "Essential is enough for online play + free monthly games",
      "Premium cloud streaming requires good internet"
    ]
  },
  
  // Fitness
  "peloton": {
    id: "peloton",
    name: "Peloton",
    category: "fitness",
    icon: "fa-bicycle",
    color: "#181A1B",
    website: "https://www.onepeloton.com",
    managementUrl: "https://www.onepeloton.com/settings/subscriptions",
    plans: [
      {
        name: "App Only",
        monthlyPrice: 12.99,
        features: ["Classes on any device", "No equipment needed"],
        isPopular: true
      },
      {
        name: "All-Access (with equipment)",
        monthlyPrice: 44.00,
        features: ["Full equipment features", "Metrics tracking", "Family profiles"]
      }
    ],
    tips: [
      "App Only works great without Peloton equipment",
      "Free classes available on YouTube as alternative",
      "All-Access only makes sense with Peloton bike/tread"
    ]
  },
  
  // Cloud Storage
  "dropbox": {
    id: "dropbox",
    name: "Dropbox",
    category: "productivity",
    icon: "fa-dropbox",
    color: "#0061FF",
    website: "https://www.dropbox.com",
    managementUrl: "https://www.dropbox.com/account/plan",
    plans: [
      {
        name: "Basic (Free)",
        monthlyPrice: 0,
        features: ["2GB storage", "Basic sharing"]
      },
      {
        name: "Plus",
        monthlyPrice: 11.99,
        yearlyPrice: 119.88,
        features: ["2TB storage", "30-day file recovery", "Offline access"],
        isPopular: true
      },
      {
        name: "Professional",
        monthlyPrice: 19.99,
        yearlyPrice: 199.00,
        features: ["3TB storage", "Advanced sharing", "Watermarking"]
      }
    ],
    tips: [
      "Google Drive/iCloud often cheaper for basic storage",
      "Annual billing saves ~17%",
      "2GB free tier may be enough for essential files"
    ]
  },
  
  "icloud": {
    id: "icloud",
    name: "iCloud+",
    category: "productivity",
    icon: "fa-cloud",
    color: "#3693F3",
    website: "https://www.icloud.com",
    managementUrl: "https://support.apple.com/en-us/HT201318",
    plans: [
      {
        name: "Free",
        monthlyPrice: 0,
        features: ["5GB storage"]
      },
      {
        name: "50GB",
        monthlyPrice: 0.99,
        features: ["50GB storage", "Private Relay", "Hide My Email"]
      },
      {
        name: "200GB",
        monthlyPrice: 2.99,
        features: ["200GB storage", "Family sharing available"],
        isPopular: true
      },
      {
        name: "2TB",
        monthlyPrice: 10.99,
        features: ["2TB storage", "Family sharing", "All iCloud+ features"]
      }
    ],
    tips: [
      "50GB is usually enough for photos and backups",
      "200GB can be shared with family",
      "Consider Apple One bundles for better value"
    ]
  },
  
  "google one": {
    id: "google one",
    name: "Google One",
    category: "productivity",
    icon: "fa-google",
    color: "#4285F4",
    website: "https://one.google.com",
    managementUrl: "https://one.google.com/storage",
    plans: [
      {
        name: "Free",
        monthlyPrice: 0,
        features: ["15GB across Google services"]
      },
      {
        name: "Basic",
        monthlyPrice: 1.99,
        features: ["100GB storage", "Google Store rewards"]
      },
      {
        name: "Standard",
        monthlyPrice: 2.99,
        features: ["200GB storage", "Up to 5 family members"],
        isPopular: true
      },
      {
        name: "Premium",
        monthlyPrice: 9.99,
        features: ["2TB storage", "10% Google Store rewards", "VPN"]
      }
    ],
    tips: [
      "15GB free is generous compared to iCloud's 5GB",
      "Share Standard/Premium with family for best value",
      "VPN included in Premium tier"
    ]
  }
};

// Helper function to find service info by name (fuzzy match)
export function findServiceByName(name: string): ServiceInfo | null {
  const normalizedName = name.toLowerCase().trim();
  
  // Direct match
  if (SERVICE_CATALOG[normalizedName]) {
    return SERVICE_CATALOG[normalizedName];
  }
  
  // Fuzzy match
  const keys = Object.keys(SERVICE_CATALOG);
  for (const key of keys) {
    const service = SERVICE_CATALOG[key];
    if (
      service.name.toLowerCase().includes(normalizedName) ||
      normalizedName.includes(service.name.toLowerCase()) ||
      normalizedName.includes(key)
    ) {
      return service;
    }
  }
  
  return null;
}

// Get all services in a category
export function getServicesByCategory(category: string): ServiceInfo[] {
  return Object.values(SERVICE_CATALOG).filter(
    s => s.category.toLowerCase() === category.toLowerCase()
  );
}

// Calculate potential savings if switching to a cheaper plan
export function calculatePlanSavings(
  currentMonthly: number, 
  service: ServiceInfo
): { cheaperPlans: Array<{ plan: ServicePlan; monthlySavings: number; yearlySavings: number }> } {
  const cheaperPlans = service.plans
    .filter(plan => plan.monthlyPrice < currentMonthly && plan.monthlyPrice > 0)
    .map(plan => ({
      plan,
      monthlySavings: Math.round((currentMonthly - plan.monthlyPrice) * 100) / 100,
      yearlySavings: Math.round((currentMonthly - plan.monthlyPrice) * 12 * 100) / 100
    }))
    .sort((a, b) => b.monthlySavings - a.monthlySavings);
  
  return { cheaperPlans };
}
