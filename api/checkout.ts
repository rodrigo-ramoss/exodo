import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const secretKey = process.env.STRIPE_SECRET_KEY;
  const priceId = process.env.STRIPE_MONTHLY_PRICE_ID;

  if (!secretKey || !priceId) {
    console.error('[checkout] Variáveis de ambiente do Stripe não configuradas.');
    return res.status(503).json({ error: 'Pagamento temporariamente indisponível.' });
  }

  const stripe = new Stripe(secretKey, { apiVersion: '2025-02-24.acacia' as any });

  let email: string;
  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    email = ((body?.email as string) ?? '').trim().toLowerCase();
  } catch {
    return res.status(400).json({ error: 'Corpo inválido.' });
  }

  if (email && !EMAIL_REGEX.test(email)) {
    return res.status(400).json({ error: 'E-mail inválido.' });
  }

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? process.env.APP_URL ?? 'https://exodo-app.vercel.app';
  const successUrl = `${baseUrl}/?plan=mensal&session_id={CHECKOUT_SESSION_ID}`;
  const cancelUrl = `${baseUrl}/`;

  try {
    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
      allow_promotion_codes: true,
      ...(email ? { customer_email: email } : {}),
      metadata: { source: 'exodo-app' },
    };

    const session = await stripe.checkout.sessions.create(sessionParams);
    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error('[checkout] Erro ao criar sessão Stripe:', err);
    return res.status(500).json({ error: 'Não foi possível iniciar o pagamento.' });
  }
}
