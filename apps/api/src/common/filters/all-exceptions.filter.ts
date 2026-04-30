import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import * as Sentry from '@sentry/nestjs';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('ExceptionFilter');

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const req = ctx.getRequest<Request>();
    const res = ctx.getResponse<Response>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    if (status >= 500) {
      this.logger.error(
        `${req.method} ${req.url} → ${status}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
      Sentry.captureException(exception);
      res.status(status).json({ statusCode: status, message: 'Erro interno do servidor' });
      return;
    }

    this.logger.warn(`${req.method} ${req.url} → ${status}`);

    if (!(exception instanceof HttpException)) {
      res.status(status).json({ statusCode: status, message: 'Erro interno do servidor' });
      return;
    }

    const response = exception.getResponse();

    // Erros de validação (400) devolvem array de mensagens — necessário para o frontend
    if (status === HttpStatus.BAD_REQUEST && typeof response === 'object') {
      res.status(status).json(response);
      return;
    }

    // Restantes 4xx: mensagem normalizada (sem expor detalhes de implementação)
    const message =
      typeof response === 'string'
        ? response
        : typeof response === 'object' && 'message' in (response as object)
          ? (response as { message: string }).message
          : HttpStatus[status] ?? 'Erro';

    res.status(status).json({ statusCode: status, message });
  }
}
