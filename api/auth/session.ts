import type { VercelRequest, VercelResponse } from '@vercel/node';
import { clearSessionCookie, getSessionFromRequest } from '../_lib/auth';
import { hasActiveSubscriptionByEmail } from '../_lib/stripe';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const session = getSessionFromRequest(req);
  if (!session) {
    return res.status(200).json({ isLoggedIn: false, isSubscriber: false, email: '' });
  }

  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeSecretKey) {
    console.error('[auth/session] STRIPE_SECRET_KEY não configurada.');
    clearSessionCookie(res);
    return res.status(200).json({ isLoggedIn: false, isSubscriber: false, email: '' });
  }

  try {
    const isSubscriber = await hasActiveSubscriptionByEmail(session.email, stripeSecretKey);
    if (!isSubscriber) {
      clearSessionCookie(res);
      return res.status(200).json({ isLoggedIn: false, isSubscriber: false, email: '' });
    }

    return res.status(200).json({
      isLoggedIn: true,
      isSubscriber: true,
      email: session.email,
    });
  } catch (error) {
    console.error('[auth/session] erro:', error);
    return res.status(500).json({ isLoggedIn: false, isSubscriber: false, email: '' });
  }
}

