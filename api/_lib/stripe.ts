import Stripe from 'stripe';

function createStripe(secretKey: string): Stripe {
  return new Stripe(secretKey, { apiVersion: '2025-02-24.acacia' as any });
}

const ACCESS_SUBSCRIPTION_STATUSES = new Set<Stripe.Subscription.Status>(['active', 'trialing']);

export async function hasActiveSubscriptionByEmail(
  email: string,
  secretKey: string
): Promise<boolean> {
  const stripe = createStripe(secretKey);
  const customers = await stripe.customers.list({ email, limit: 5 });

  if (customers.data.length === 0) return false;

  for (const customer of customers.data) {
    const subscriptions = await stripe.subscriptions.list({
      customer: customer.id,
      status: 'all',
      limit: 10,
    });

    if (subscriptions.data.some((subscription) => ACCESS_SUBSCRIPTION_STATUSES.has(subscription.status))) {
      return true;
    }
  }

  return false;
}
