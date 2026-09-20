import { print } from 'graphql';
import type { TadaDocumentNode } from 'gql.tada';
import { cacheGet, cacheSet } from '../cache/redis';

/** A single error entry as Magento returns it. */
export interface MagentoGraphQLError {
  message: string;
  path?: readonly (string | number)[];
  extensions?: { category?: string; [key: string]: unknown };
}

export class GraphQLRequestError extends Error {
  readonly errors: readonly MagentoGraphQLError[];
  readonly status: number;

  constructor(message: string, errors: readonly MagentoGraphQLError[], status: number) {
    super(message);
    this.name = 'GraphQLRequestError';
    this.errors = errors;
    this.status = status;
  }

  /** True when Magento rejected the customer token and the caller should re-auth. */
  get isUnauthorized(): boolean {
    return (
      this.status === 401 ||
      this.errors.some((error) => error.extensions?.category === 'graphql-authorization')
    );
  }
}

export interface ExecuteOptions<TVariables> {
  variables?: TVariables;
  /** Server-side cache policy. `false` (the default for mutations) bypasses it. */
  cache?: { ttl?: number; key?: string } | false;
  /** Customer bearer token, when the query needs an authenticated context. */
  token?: string | null | undefined;
  storeCode?: string;
  signal?: AbortSignal;
  headers?: Record<string, string>;
}

/**
 * When a document declares no variables, the options argument is optional;
 * when it does, TypeScript demands `variables`. This is the whole point of the
 * gql.tada setup — a missing or misspelt variable fails at compile time.
 */
// `{} extends T` is the idiomatic test for "this document declares no required
// variables", which is exactly what makes the options argument optional below.
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
type ExecuteArgs<TVariables> = {} extends TVariables
  ? [options?: ExecuteOptions<TVariables>]
  : [options: ExecuteOptions<TVariables> & { variables: TVariables }];

const printed = new WeakMap<object, string>();

function printDocument(document: TadaDocumentNode<unknown, unknown>): string {
  const cached = printed.get(document);
  if (cached) return cached;
  const text = print(document);
  printed.set(document, text);
  return text;
}

function endpoint(): string {
  return (
    process.env['PUBLIC_MAGENTO_GRAPHQL_ENDPOINT'] ??
    import.meta.env['PUBLIC_MAGENTO_GRAPHQL_ENDPOINT'] ??
    'https://magento.test/graphql'
  );
}

function defaultStoreCode(): string {
  return (
    process.env['PUBLIC_MAGENTO_STORE_CODE'] ??
    import.meta.env['PUBLIC_MAGENTO_STORE_CODE'] ??
    'default'
  );
}

function defaultTtl(): number {
  return Number(process.env['GRAPHQL_CACHE_TTL'] ?? 300);
}

/** Stable cache key: store + query text + variables, hashed to keep keys short. */
async function buildCacheKey(
  query: string,
  variables: unknown,
  storeCode: string,
  operationName: string,
): Promise<string> {
  const payload = `${storeCode}|${query}|${JSON.stringify(variables ?? {})}`;
  const digest = await crypto.subtle.digest('SHA-1', new TextEncoder().encode(payload));
  const hex = Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
  return `gql:${operationName}:${hex}`;
}

function operationNameOf(document: TadaDocumentNode<unknown, unknown>): string {
  for (const definition of document.definitions) {
    if (definition.kind === 'OperationDefinition' && definition.name) {
      return definition.name.value;
    }
  }
  return 'anonymous';
}

function isMutation(document: TadaDocumentNode<unknown, unknown>): boolean {
  return document.definitions.some(
    (definition) =>
      definition.kind === 'OperationDefinition' && definition.operation === 'mutation',
  );
}

/**
 * Execute a typed document against Magento.
 *
 * Reads are cached in valkey when a `cache` policy is given; writes never are.
 * A cache outage is invisible to callers by design.
 */
export async function execute<TResult, TVariables>(
  document: TadaDocumentNode<TResult, TVariables>,
  ...args: ExecuteArgs<TVariables>
): Promise<TResult> {
  const options = (args[0] ?? {}) as ExecuteOptions<TVariables>;
  const query = printDocument(document as TadaDocumentNode<unknown, unknown>);
  const operationName = operationNameOf(document as TadaDocumentNode<unknown, unknown>);
  const storeCode = options.storeCode ?? defaultStoreCode();

  // Only anonymous reads are cacheable: a customer token makes the response
  // personal, and caching it would leak one shopper's data to another.
  const cacheable =
    options.cache !== false &&
    options.cache !== undefined &&
    !options.token &&
    !isMutation(document as TadaDocumentNode<unknown, unknown>);

  const cacheKey = cacheable
    ? (options.cache !== false && options.cache?.key) ||
      (await buildCacheKey(query, options.variables, storeCode, operationName))
    : null;

  if (cacheKey) {
    const hit = await cacheGet<TResult>(cacheKey);
    if (hit !== null) return hit;
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    Store: storeCode,
    ...options.headers,
  };
  if (options.token) headers['Authorization'] = `Bearer ${options.token}`;

  const response = await fetch(endpoint(), {
    method: 'POST',
    headers,
    body: JSON.stringify({ query, variables: options.variables ?? {}, operationName }),
    signal: options.signal ?? AbortSignal.timeout(15_000),
  });

  const text = await response.text();

  let payload: { data?: TResult; errors?: MagentoGraphQLError[] };
  try {
    payload = JSON.parse(text) as typeof payload;
  } catch {
    // Magento in developer mode can append a PHP notice after the JSON body;
    // surface that as a clear error instead of an opaque parse failure.
    throw new GraphQLRequestError(
      `Magento returned a non-JSON response (${response.status}): ${text.slice(0, 200)}`,
      [],
      response.status,
    );
  }

  if (payload.errors?.length) {
    throw new GraphQLRequestError(
      payload.errors.map((error) => error.message).join('; '),
      payload.errors,
      response.status,
    );
  }

  if (!response.ok || payload.data === undefined) {
    throw new GraphQLRequestError(
      `Magento request failed with status ${response.status}`,
      [],
      response.status,
    );
  }

  if (cacheKey) {
    const ttl = (options.cache !== false && options.cache?.ttl) || defaultTtl();
    await cacheSet(cacheKey, payload.data, ttl);
  }

  return payload.data;
}
