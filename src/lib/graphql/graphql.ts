import { initGraphQLTada } from 'gql.tada';
import type { introspection } from './graphql-env.d.ts';

/**
 * The typed `graphql` tag for the Magento schema.
 *
 * gql.tada reads `schema.graphql` (introspected from the live instance with
 * `npm run schema:generate`) and infers result and variable types straight from
 * the document text — there is no generated-hooks step to keep in sync, and an
 * invalid field name is a type error in the editor rather than a runtime 400.
 */
export const graphql = initGraphQLTada<{
  introspection: introspection;
  scalars: {
    ID: string;
  };
}>();

export type { FragmentOf, ResultOf, VariablesOf } from 'gql.tada';
export { readFragment } from 'gql.tada';
