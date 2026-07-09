import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getSessionFromRequest } from '../_lib/auth.js';
import { hasActiveSubscriptionByEmail } from '../_lib/stripe.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const session = getSessionFromRequest(req);
  if (!session) {
    return res.status(200).json({ isLoggedIn: false, isSubscriber: false, email: '' });
  }

  let isSubscriber = session.tier === 'subscriber';
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  if (stripeSecretKey) {
    try {
      isSubscriber = await hasActiveSubscriptionByEmail(session.email, stripeSecretKey);
    } catch (error) {
      console.error('[auth/session] falha ao consultar assinatura:', error);
    }
  }

  return res.status(200).json({
    isLoggedIn: true,
    isSubscriber,
    email: session.email,
  });
}
