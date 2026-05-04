import { BankTransaction, Category } from "@shared/schema";

interface CategoryRule {
  patterns: RegExp[];
  categorySlug: string;
}

const CATEGORY_RULES: CategoryRule[] = [
  {
    patterns: [/grocery|supermarket|lidl|aldi|tesco|sainsbury|asda|waitrose|morrisons|spar|supervalu|dunnes/i],
    categorySlug: "groceries"
  },
  {
    patterns: [/netflix|spotify|disney\+|hulu|amazon prime|youtube|apple music|hbo|audible|patreon/i],
    categorySlug: "subscriptions"
  },
  {
    patterns: [/uber|lyft|taxi|bus|train|metro|transit|dart|luas|transport|fuel|petrol|shell|bp|circle k/i],
    categorySlug: "transport"
  },
  {
    patterns: [/rent|mortgage|housing|landlord|letting|property|accommodation/i],
    categorySlug: "rent"
  },
  {
    patterns: [/electric|electricity|gas|water|sewage|waste|bin|energy|utility|eir|vodafone|three|virgin media/i],
    categorySlug: "utilities"
  },
  {
    patterns: [/restaurant|cafe|coffee|starbucks|costa|mcdonalds|burger king|kfc|domino|just eat|deliveroo|uber eats/i],
    categorySlug: "dining"
  },
  {
    patterns: [/cinema|movie|theatre|concert|ticket|event|ticketmaster|entertainment/i],
    categorySlug: "entertainment"
  },
  {
    patterns: [/gym|fitness|yoga|pilates|sports|swim|golf|tennis/i],
    categorySlug: "fitness"
  },
  {
    patterns: [/pharmacy|doctor|hospital|medical|health|dental|dentist|optician|vision/i],
    categorySlug: "healthcare"
  },
  {
    patterns: [/amazon|ebay|aliexpress|wish|online shop|fashion|clothes|zara|h&m|primark|penneys/i],
    categorySlug: "shopping"
  },
  {
    patterns: [/insurance|allianz|axa|zurich|aviva|cover|policy/i],
    categorySlug: "insurance"
  },
  {
    patterns: [/salary|wages|payroll|income|payment received|transfer in|deposit/i],
    categorySlug: "income"
  },
  {
    patterns: [/atm|withdrawal|cash/i],
    categorySlug: "cash"
  },
  {
    patterns: [/transfer|sent to|payment to|p2p/i],
    categorySlug: "transfers"
  }
];

export const DEFAULT_CATEGORIES: Array<{ name: string; slug: string; icon: string; color: string }> = [
  { name: "Groceries", slug: "groceries", icon: "fa-shopping-cart", color: "#22C55E" },
  { name: "Subscriptions", slug: "subscriptions", icon: "fa-repeat", color: "#8B5CF6" },
  { name: "Transport", slug: "transport", icon: "fa-car", color: "#3B82F6" },
  { name: "Rent", slug: "rent", icon: "fa-home", color: "#EF4444" },
  { name: "Utilities", slug: "utilities", icon: "fa-bolt", color: "#F59E0B" },
  { name: "Dining", slug: "dining", icon: "fa-utensils", color: "#EC4899" },
  { name: "Entertainment", slug: "entertainment", icon: "fa-film", color: "#06B6D4" },
  { name: "Fitness", slug: "fitness", icon: "fa-dumbbell", color: "#10B981" },
  { name: "Healthcare", slug: "healthcare", icon: "fa-heart", color: "#F43F5E" },
  { name: "Shopping", slug: "shopping", icon: "fa-bag-shopping", color: "#A855F7" },
  { name: "Insurance", slug: "insurance", icon: "fa-shield", color: "#6366F1" },
  { name: "Income", slug: "income", icon: "fa-money-bill", color: "#16A34A" },
  { name: "Cash", slug: "cash", icon: "fa-money-bills", color: "#84CC16" },
  { name: "Transfers", slug: "transfers", icon: "fa-exchange-alt", color: "#64748B" },
  { name: "Other", slug: "other", icon: "fa-tag", color: "#6B7280" },
];

export interface CategorizationResult {
  categorySlug: string;
  categoryName: string;
  confidence: number;
  matchedPattern?: string;
}

export class CategorizationService {
  static categorizeTransaction(description: string, merchantName?: string): CategorizationResult {
    const textToMatch = `${description} ${merchantName || ""}`.toLowerCase();
    
    for (const rule of CATEGORY_RULES) {
      for (const pattern of rule.patterns) {
        if (pattern.test(textToMatch)) {
          const category = DEFAULT_CATEGORIES.find(c => c.slug === rule.categorySlug);
          return {
            categorySlug: rule.categorySlug,
            categoryName: category?.name || rule.categorySlug,
            confidence: 0.85,
            matchedPattern: pattern.source
          };
        }
      }
    }
    
    return {
      categorySlug: "other",
      categoryName: "Other",
      confidence: 0.5
    };
  }

  static categorizeTransactions(transactions: Partial<BankTransaction>[]): Map<number, CategorizationResult> {
    const results = new Map<number, CategorizationResult>();
    
    for (const tx of transactions) {
      if (tx.id) {
        const result = this.categorizeTransaction(
          tx.description || "",
          tx.merchantName || undefined
        );
        results.set(tx.id, result);
      }
    }
    
    return results;
  }

  static detectDirection(description: string, amount: number): "in" | "out" {
    const incomePatterns = [/salary|wages|payroll|income|payment received|transfer in|deposit|refund|cashback/i];
    
    for (const pattern of incomePatterns) {
      if (pattern.test(description)) {
        return "in";
      }
    }
    
    return amount >= 0 ? "out" : "in";
  }

  static getCategoryBySlug(slug: string) {
    return DEFAULT_CATEGORIES.find(c => c.slug === slug);
  }

  static getAllCategories() {
    return DEFAULT_CATEGORIES;
  }
}
