import type { InsertServicePlan } from "@shared/schema";

export interface ServicePlanSeedData {
  serviceSlug: string;
  plans: Omit<InsertServicePlan, 'serviceId'>[];
}

export const servicePlansSeed: ServicePlanSeedData[] = [
  {
    serviceSlug: "netflix",
    plans: [
      { name: "Standard with Ads", monthlyPrice: "6.99", features: ["Most content", "2 screens", "1080p", "Ad-supported"], sortOrder: 0 },
      { name: "Standard", monthlyPrice: "13.49", features: ["Full library", "2 screens", "1080p", "Downloads"], isPopular: true, isFamilyEligible: true, maxFamilyMembers: 2, sortOrder: 1 },
      { name: "Premium", monthlyPrice: "17.99", features: ["Full library", "4 screens", "4K HDR", "Dolby Atmos", "Extra member slots"], isFamilyEligible: true, maxFamilyMembers: 4, sortOrder: 2 }
    ]
  },
  {
    serviceSlug: "disney-plus",
    plans: [
      { name: "Standard with Ads", monthlyPrice: "5.99", yearlyPrice: "59.90", features: ["Full library", "2 screens", "1080p", "Ad-supported"], sortOrder: 0 },
      { name: "Standard", monthlyPrice: "8.99", yearlyPrice: "89.90", features: ["Full library", "2 screens", "1080p", "No ads", "Downloads"], isPopular: true, isFamilyEligible: true, maxFamilyMembers: 4, sortOrder: 1 },
      { name: "Premium", monthlyPrice: "11.99", yearlyPrice: "119.90", features: ["Full library", "4 screens", "4K HDR", "Dolby Atmos", "No ads"], isFamilyEligible: true, maxFamilyMembers: 4, sortOrder: 2 }
    ]
  },
  {
    serviceSlug: "spotify",
    plans: [
      { name: "Free", monthlyPrice: "0.00", features: ["Shuffle play", "Ads", "Limited skips"], sortOrder: 0 },
      { name: "Individual", monthlyPrice: "10.99", features: ["Ad-free", "Offline", "High quality audio"], isPopular: true, sortOrder: 1 },
      { name: "Duo", monthlyPrice: "14.99", features: ["2 accounts", "Ad-free", "Duo Mix"], isFamilyEligible: true, maxFamilyMembers: 2, sortOrder: 2 },
      { name: "Family", monthlyPrice: "17.99", features: ["Up to 6 accounts", "Ad-free", "Family Mix", "Block explicit content"], isFamilyEligible: true, maxFamilyMembers: 6, sortOrder: 3 }
    ]
  },
  {
    serviceSlug: "apple-music",
    plans: [
      { name: "Voice", monthlyPrice: "4.99", features: ["Siri only", "All songs"], sortOrder: 0 },
      { name: "Individual", monthlyPrice: "10.99", features: ["100M+ songs", "Lossless audio", "Spatial audio"], isPopular: true, sortOrder: 1 },
      { name: "Family", monthlyPrice: "16.99", features: ["Up to 6 accounts", "All features"], isFamilyEligible: true, maxFamilyMembers: 6, sortOrder: 2 }
    ]
  },
  {
    serviceSlug: "amazon-prime",
    plans: [
      { name: "Monthly", monthlyPrice: "8.99", features: ["Free delivery", "Prime Video", "Prime Music", "Prime Gaming"], sortOrder: 0 },
      { name: "Annual", yearlyPrice: "89.90", features: ["Free delivery", "Prime Video", "Prime Music", "Prime Gaming", "Save 25%"], isPopular: true, sortOrder: 1 }
    ]
  },
  {
    serviceSlug: "youtube-premium",
    plans: [
      { name: "Individual", monthlyPrice: "13.99", features: ["Ad-free", "Background play", "YouTube Music", "Downloads"], isPopular: true, sortOrder: 0 },
      { name: "Family", monthlyPrice: "22.99", features: ["Up to 5 accounts", "All Individual features"], isFamilyEligible: true, maxFamilyMembers: 5, sortOrder: 1 }
    ]
  },
  {
    serviceSlug: "hbo-max",
    plans: [
      { name: "With Ads", monthlyPrice: "5.99", yearlyPrice: "59.99", features: ["Full library", "2 screens", "1080p", "Ad-supported"], sortOrder: 0 },
      { name: "Ad-Free", monthlyPrice: "15.99", yearlyPrice: "149.99", features: ["Full library", "3 screens", "4K HDR", "Downloads"], isPopular: true, sortOrder: 1 }
    ]
  },
  {
    serviceSlug: "adobe-creative-cloud",
    plans: [
      { name: "Photography", monthlyPrice: "11.99", features: ["Photoshop", "Lightroom", "20GB cloud"], sortOrder: 0 },
      { name: "Single App", monthlyPrice: "22.99", features: ["One app of choice", "100GB cloud"], sortOrder: 1 },
      { name: "All Apps", monthlyPrice: "59.99", features: ["20+ creative apps", "100GB cloud", "Fonts", "Portfolio"], isPopular: true, sortOrder: 2 }
    ]
  },
  {
    serviceSlug: "microsoft-365",
    plans: [
      { name: "Personal", monthlyPrice: "6.99", yearlyPrice: "69.99", features: ["1 person", "1TB OneDrive", "Word/Excel/PowerPoint"], isPopular: true, sortOrder: 0 },
      { name: "Family", monthlyPrice: "9.99", yearlyPrice: "99.99", features: ["Up to 6 people", "6TB OneDrive", "All apps"], isFamilyEligible: true, maxFamilyMembers: 6, sortOrder: 1 }
    ]
  },
  {
    serviceSlug: "notion",
    plans: [
      { name: "Free", monthlyPrice: "0.00", features: ["Unlimited pages", "Share with 10 guests", "7 day history"], sortOrder: 0 },
      { name: "Plus", monthlyPrice: "8.00", yearlyPrice: "96.00", features: ["Unlimited file uploads", "Unlimited guests", "30 day history"], isPopular: true, sortOrder: 1 },
      { name: "Business", monthlyPrice: "15.00", yearlyPrice: "180.00", features: ["SAML SSO", "Private teamspaces", "Advanced security"], sortOrder: 2 }
    ]
  },
  {
    serviceSlug: "google-workspace",
    plans: [
      { name: "Business Starter", monthlyPrice: "6.00", features: ["30GB per user", "Custom email", "Meet 100 participants"], sortOrder: 0 },
      { name: "Business Standard", monthlyPrice: "12.00", features: ["2TB per user", "Meet 150 participants", "Recording"], isPopular: true, sortOrder: 1 },
      { name: "Business Plus", monthlyPrice: "18.00", features: ["5TB per user", "Meet 500 participants", "Advanced security"], sortOrder: 2 }
    ]
  },
  {
    serviceSlug: "slack",
    plans: [
      { name: "Free", monthlyPrice: "0.00", features: ["90 days history", "10 integrations", "1:1 calls"], sortOrder: 0 },
      { name: "Pro", monthlyPrice: "7.25", features: ["Unlimited history", "Unlimited integrations", "Group calls"], isPopular: true, sortOrder: 1 },
      { name: "Business+", monthlyPrice: "12.50", features: ["SSO", "User provisioning", "Data exports"], sortOrder: 2 }
    ]
  },
  {
    serviceSlug: "dropbox",
    plans: [
      { name: "Plus", monthlyPrice: "11.99", yearlyPrice: "119.88", features: ["2TB storage", "30 day history", "Smart Sync"], sortOrder: 0 },
      { name: "Professional", monthlyPrice: "19.99", yearlyPrice: "239.88", features: ["3TB storage", "180 day history", "Watermarking"], isPopular: true, sortOrder: 1 }
    ]
  },
  {
    serviceSlug: "icloud",
    plans: [
      { name: "50GB", monthlyPrice: "0.99", features: ["50GB storage", "iCloud backup", "Keychain"], sortOrder: 0 },
      { name: "200GB", monthlyPrice: "2.99", features: ["200GB storage", "Family sharing", "Hide My Email"], isPopular: true, isFamilyEligible: true, maxFamilyMembers: 6, sortOrder: 1 },
      { name: "2TB", monthlyPrice: "10.99", features: ["2TB storage", "Private Relay", "HomeKit Secure Video"], isFamilyEligible: true, maxFamilyMembers: 6, sortOrder: 2 }
    ]
  },
  {
    serviceSlug: "google-one",
    plans: [
      { name: "Basic", monthlyPrice: "1.99", features: ["100GB storage", "Google experts", "Family sharing"], isFamilyEligible: true, maxFamilyMembers: 5, sortOrder: 0 },
      { name: "Standard", monthlyPrice: "2.99", features: ["200GB storage", "10% back on Store", "VPN"], isPopular: true, isFamilyEligible: true, maxFamilyMembers: 5, sortOrder: 1 },
      { name: "Premium", monthlyPrice: "9.99", features: ["2TB storage", "Gemini Advanced", "All features"], isFamilyEligible: true, maxFamilyMembers: 5, sortOrder: 2 }
    ]
  },
  {
    serviceSlug: "chatgpt",
    plans: [
      { name: "Free", monthlyPrice: "0.00", features: ["GPT-3.5", "Limited messages", "Web access"], sortOrder: 0 },
      { name: "Plus", monthlyPrice: "20.00", features: ["GPT-4", "Unlimited messages", "Image generation", "Code interpreter"], isPopular: true, sortOrder: 1 },
      { name: "Team", monthlyPrice: "25.00", features: ["All Plus features", "Admin console", "No training on data"], sortOrder: 2 }
    ]
  },
  {
    serviceSlug: "canva",
    plans: [
      { name: "Free", monthlyPrice: "0.00", features: ["250k+ templates", "5GB storage", "Basic features"], sortOrder: 0 },
      { name: "Pro", monthlyPrice: "12.99", yearlyPrice: "119.99", features: ["Premium templates", "1TB storage", "Brand Kit", "Magic Resize"], isPopular: true, sortOrder: 1 },
      { name: "Teams", monthlyPrice: "14.99", yearlyPrice: "149.90", features: ["All Pro features", "Team collaboration", "Workflow approval"], sortOrder: 2 }
    ]
  },
  {
    serviceSlug: "figma",
    plans: [
      { name: "Starter", monthlyPrice: "0.00", features: ["3 Figma files", "3 FigJam files", "Unlimited viewers"], sortOrder: 0 },
      { name: "Professional", monthlyPrice: "12.00", yearlyPrice: "144.00", features: ["Unlimited files", "Private projects", "Dev Mode"], isPopular: true, sortOrder: 1 },
      { name: "Organization", monthlyPrice: "45.00", features: ["All Professional features", "SSO", "Advanced security"], sortOrder: 2 }
    ]
  }
];
