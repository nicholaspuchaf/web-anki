export type HttpEvent = {
  headers?: Record<string, string | undefined>;
  body?: string | null;
  isBase64Encoded?: boolean;
  queryStringParameters?: Record<string, string | undefined>;
  requestContext: { http: { method: string; path: string } };
  rawPath?: string;
};
export type HttpResponse = {
  statusCode: number;
  headers: Record<string, string>;
  body: string;
};
export function reply(statusCode: number, body: unknown): HttpResponse {
  return {
    statusCode,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
    },
    body: statusCode === 204 ? '' : JSON.stringify(body),
  };
}

export type HttpRequest = {
  event: HttpEvent;
  method: string;
  path: string;
  headers: Record<string, string | undefined>;
};

export function readRequest(event: HttpEvent): HttpRequest {
  return {
    event,
    method: event.requestContext.http.method,
    path: event.rawPath ?? event.requestContext.http.path,
    headers: Object.fromEntries(
      Object.entries(event.headers ?? {}).map(([key, value]) => [
        key.toLowerCase(),
        value,
      ]),
    ),
  };
}

export function requestFailure(error: unknown): HttpResponse {
  const name = error instanceof Error ? error.name : 'UnknownError';
  if (
    [
      'ProvisionedThroughputExceededException',
      'ThrottlingException',
      'RequestLimitExceeded',
    ].includes(name)
  )
    return reply(429, {
      error: 'Muitas operações. Aguarde um momento e tente novamente.',
    });
  console.error('Flashcard request failed', { name });
  return reply(500, { error: 'Não foi possível acessar os cartões agora.' });
}
