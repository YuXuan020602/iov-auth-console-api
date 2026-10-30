import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('HTTP');

  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();
    const res = exception.getResponse() as any;

    this.logger.warn(`${request.method} ${request.url} → ${status} ${exception.message}`);

    response.status(status).json({
      code: status,
      message: res?.message || exception.message,
      error: res?.error || exception.name,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
