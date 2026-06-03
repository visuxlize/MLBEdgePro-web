import 'server-only';

import { createHydrationHelpers } from '@trpc/react-query/rsc';
import { cache } from 'react';
import { createCallerFactory } from '@/server/trpc';
import { createTRPCContext } from '@/server/context';
import { makeQueryClient } from './query-client';
import { appRouter, type AppRouter } from '@/server/routers';

export const getQueryClient = cache(makeQueryClient);

const caller = createCallerFactory(appRouter)(createTRPCContext);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const { trpc, HydrateClient } = createHydrationHelpers<AppRouter>(
  caller as any,
  getQueryClient,
);
