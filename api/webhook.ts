import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';

// Lista Brevo: "Assinantes Êxodo" — ajuste o ID conforme sua lista no Brevo
const BREVO_PAID_LIST_ID = 3;

async function addSubscriberToBrevo(email: string, name?: string): Promise<void> {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    console.warn('[webhook] BREVO_API_KEY não configurado.');
    return;
  }

  const body: Record<string, unknown> = {
    email,
    listIds: [BREVO_PAID_LIST_ID],
    updateEnabled: true,
  };

  if (name) {
    const parts = name.trim().split(' ');
    body.attributes = {
      FIRSTNAME: parts[0] ?? '',
      LASTNAME: parts.slice(1).join(' ') ?? '',
    };
  }

  const response = await fetch('https://api.brevo.com/v3/contacts', {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
      'api-key': apiKey,
    },
    body: JSON.stringify(body),
  });

  if (response.ok || response.status === 201 || response.status === 204) {
    console.log('[webhook] Assinante adicionado no Brevo:', email);
  } else {
    const err = await response.json().catch(() => ({}));
    console.error('[webhook] Erro ao adicionar no Brevo:', response.status, err);
  }
}

export const config = { api: { bodyParser: false } };

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const secretKey = process.env.STRIPE_SECRET_KEY;

  if (!webhookSecret || !secretKey) {
    console.error('[webhook] Variáveis de ambiente não configuradas.');
    return res.status(500).json({ error: 'Webhook não configurado.' });
  }

  const stripe = new Stripe(secretKey, { apiVersion: '2025-02-24.acacia' as any });

  // Lê o raw body para validar a assinatura do Stripe
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  const rawBody = Buffer.concat(chunks).toString('utf8');
  const sig = (req.headers['stripe-signature'] as string) ?? '';

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (err) {
    console.error('[webhook] Assinatura inválida:', err);
    return res.status(400).json({ error: 'Assinatura inválida.' });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode !== 'subscription') break;
        const email = session.customer_email ?? session.customer_details?.email ?? '';
        const name = session.customer_details?.name ?? '';
        if (email) await addSubscriberToBrevo(email, name);
        break;
      }
      case 'customer.subscription.created': {
        const subscription = event.data.object as Stripe.Subscription;
        if (subscription.status !== 'active') break;
        const customerId =
          typeof subscription.customer === 'string'
            ? subscription.customer
            : subscription.customer.id;
        const customer = await stripe.customers.retrieve(customerId);
        if (customer.deleted) break;
        const c = customer as Stripe.Customer;
        if (c.email) await addSubscriberToBrevo(c.email, c.name ?? '');
        break;
      }
      default:
        break;
    }
  } catch (err) {
    console.error('[webhook] Erro ao processar evento:', event.type, err);
  }

  return res.status(200).json({ received: true });
}
