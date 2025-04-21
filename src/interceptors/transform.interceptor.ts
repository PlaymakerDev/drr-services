import { 
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

export interface Response<T> {
  data: T;
  success: boolean;
}

@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, Response<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<Response<T>> {
    return next
      .handle()
      .pipe(map((res: unknown) => this.responseHandler(res, context)));
    //return next.handle().pipe(map((data) => ({ data })));
  }

  responseHandler(res: any, context: ExecutionContext) {
    //const ctx = context.switchToHttp();
    //const response = ctx.getResponse();
    //const statusCode = response.statusCode;
    return {
      success: true,
      data: res,
    };
  }

  /*errorHandler(exception: HttpException, context: ExecutionContext) {
    const ctx = context.switchToHttp();
    const response = ctx.getResponse();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    response.status(status).json({
      status: false,
      statusCode: status,

      message: exception.message,
      result: exception,
    });
  }*/
}
