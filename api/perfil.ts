import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    return res.status(500).json({ error: 'Configuração ausente' });
  }

  const stripe = new Stripe(secretKey, { apiVersion: '2025-02-24.acacia' as any });

  const email = ((req.query.email as string) ?? '').trim().toLowerCase();
  if (!email) {
    return res.status(400).json({ error: 'E-mail obrigatório' });
  }

  try {
    const customers = await stripe.customers.list({ email, limit: 5 });

    if (customers.data.length === 0) {
      return res.status(404).json({ error: 'Assinante não encontrado' });
    }

    const customer = customers.data[0] as Stripe.Customer;

    const subscriptions = await stripe.subscriptions.list({
      customer: customer.id,
      limit: 10,
    });

    const active = subscriptions.data.find((s) => s.status === 'active');
    const sub = active ?? subscriptions.data[0] ?? null;
    const interval = sub?.items?.data?.[0]?.price?.recurring?.interval ?? 'month';

    return res.status(200).json({
      name: customer.name ?? '',
      email: customer.email ?? email,
      plan: sub
        ? {
            status: sub.status,
            cancelAtPeriodEnd: sub.cancel_at_period_end,
            currentPeriodEnd: sub.current_period_end,
            interval,
          }
        : null,
    });
  } catch (err) {
    console.error('[perfil] Erro ao consultar Stripe:', err);
    return res.status(500).json({ error: 'Erro interno' });
  }
}
