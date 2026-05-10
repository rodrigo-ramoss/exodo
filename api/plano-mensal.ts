import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    console.error('[plano-mensal] STRIPE_SECRET_KEY não configurado');
    return res.status(200).json({ isMonthly: false, checked: false });
  }

  const stripe = new Stripe(secretKey, { apiVersion: '2025-02-24.acacia' as any });

  let email: string;
  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    email = ((body?.email as string) ?? '').trim().toLowerCase();
  } catch {
    return res.status(400).json({ error: 'Corpo inválido' });
  }

  if (!EMAIL_REGEX.test(email)) {
    return res.status(400).json({ error: 'E-mail inválido' });
  }

  try {
    const customers = await stripe.customers.list({ email, limit: 5 });

    if (customers.data.length === 0) {
      return res.status(200).json({ isMonthly: false, checked: true });
    }

    for (const customer of customers.data) {
      const subscriptions = await stripe.subscriptions.list({
        customer: customer.id,
        status: 'active',
        limit: 5,
      });

      if (subscriptions.data.length > 0) {
        return res.status(200).json({ isMonthly: true, checked: true });
      }
    }

    return res.status(200).json({ isMonthly: false, checked: true });
  } catch (err) {
    console.error('[plano-mensal] Erro ao consultar Stripe:', err);
    return res.status(200).json({ isMonthly: false, checked: false });
  }
}
