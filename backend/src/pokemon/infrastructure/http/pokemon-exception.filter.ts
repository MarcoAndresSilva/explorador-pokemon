import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Response } from 'express';
import {
  ExternalServiceError,
  PokemonNotFoundError,
} from '../../domain/pokemon.errors';

interface ErrorBody {
  code: string;
  message: string;
}

interface HttpError {
  status: number;
  body: ErrorBody;
}

@Catch()
export class PokemonExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(PokemonExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    const { status, body } = this.toHttpError(exception);
    response.status(status).json(body);
  }

  private toHttpError(exception: unknown): HttpError {
    if (exception instanceof PokemonNotFoundError) {
      return error(
        HttpStatus.NOT_FOUND,
        'POKEMON_NOT_FOUND',
        exception.message,
      );
    }

    if (exception instanceof ExternalServiceError) {
      this.logger.warn(exception.message);
      return error(
        HttpStatus.BAD_GATEWAY,
        'EXTERNAL_SERVICE_ERROR',
        exception.message,
      );
    }

    // Errores que Nest ya trae con su status, como el 400 del ValidationPipe.
    if (exception instanceof HttpException) {
      return error(
        exception.getStatus(),
        'INVALID_REQUEST',
        describeHttpException(exception),
      );
    }

    this.logger.error(exception);
    return error(
      HttpStatus.INTERNAL_SERVER_ERROR,
      'INTERNAL_ERROR',
      'Unexpected error',
    );
  }
}

function error(status: number, code: string, message: string): HttpError {
  return { status, body: { code, message } };
}

// El ValidationPipe entrega un arreglo de mensajes; se unen en uno solo.
function describeHttpException(exception: HttpException): string {
  const response = exception.getResponse();
  if (typeof response === 'object' && 'message' in response) {
    const { message } = response as { message: string | string[] };
    return Array.isArray(message) ? message.join('; ') : message;
  }
  return exception.message;
}
