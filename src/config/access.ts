/**
 * Mantém todo o acervo aberto durante a fase gratuita do aplicativo.
 * Quando a assinatura for lançada, defina VITE_CONTENT_PAYWALL_ENABLED="true".
 */
export const CONTENT_PAYWALL_ENABLED =
  import.meta.env.VITE_CONTENT_PAYWALL_ENABLED === 'true';
