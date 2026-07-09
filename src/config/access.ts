/**
 * Mantém todo o acervo aberto durante a fase gratuita do aplicativo.
 * Quando a assinatura for lançada, defina VITE_CONTENT_PAYWALL_ENABLED="true".
 */
export const CONTENT_PAYWALL_ENABLED =
  import.meta.env.VITE_CONTENT_PAYWALL_ENABLED === 'true';

/**
 * Mantém a seção Bíblia fora da navegação até que seu conteúdo esteja pronto.
 * Para publicá-la, defina VITE_BIBLE_SECTION_VISIBLE="true".
 */
export const BIBLE_SECTION_VISIBLE =
  import.meta.env.VITE_BIBLE_SECTION_VISIBLE === 'true';
