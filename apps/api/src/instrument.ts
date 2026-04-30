import * as Sentry from '@sentry/nestjs';

// Inicializado antes de qualquer outro import para garantir instrumentação completa.
// SENTRY_DSN deve ser definido em .env; se ausente, o Sentry fica desativado silenciosamente.
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV ?? 'development',
  enabled: !!process.env.SENTRY_DSN,
  tracesSampleRate: 0.1,
});
