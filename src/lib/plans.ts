export const PLANS = {
  free: {
    name: "Free",
    maxSavedViews: 3,
    presaleCodes: false,
    emailNotifications: false,
    smsNotifications: false,
    priorityScoring: false,
  },
  pro: {
    name: "Pro",
    maxSavedViews: Infinity,
    presaleCodes: true,
    emailNotifications: true,
    smsNotifications: true,
    priorityScoring: true,
  },
} as const;

export type PlanId = keyof typeof PLANS;
export type Feature = keyof (typeof PLANS)["free"];

export const STRIPE_CONFIG = {
  proMonthlyPriceId: process.env.STRIPE_PRO_MONTHLY_PRICE_ID ?? "",
  proYearlyPriceId: process.env.STRIPE_PRO_YEARLY_PRICE_ID ?? "",
  trialDays: 7,
} as const;

export const PRO_PRICE = {
  monthly: 4.99,
  yearly: 49,
} as const;
