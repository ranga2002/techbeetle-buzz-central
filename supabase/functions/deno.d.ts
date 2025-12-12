// Minimal type stubs so the TypeScript language service can understand our Deno-edge function files.
// These are intentionally lightweight; runtime types come from Deno at deploy time.

declare namespace Deno {
  namespace env {
    function get(key: string): string | undefined;
  }
}

declare module "https://deno.land/std@0.168.0/http/server.ts" {
  export function serve(
    handler: (req: Request) => Response | Promise<Response>,
    options?: { port?: number; signal?: AbortSignal },
  ): void;
}

declare module "https://esm.sh/apify-client@2.9.1?target=deno" {
  type ActorRun = {
    status?: string;
    defaultDatasetId?: string;
    data?: {
      status?: string;
      defaultDatasetId?: string;
    };
  };

  type DatasetClient = {
    listItems: (options?: { limit?: number }) => Promise<{ items: Array<Record<string, unknown>> }>;
  };

  export class ApifyClient {
    constructor(config: { token: string });
    actor: (id: string) => { call: (options: { input: unknown; waitSecs?: number }) => Promise<ActorRun> };
    dataset: (id: string) => DatasetClient;
  }
}

declare module "https://esm.sh/@supabase/supabase-js@2" {
  export function createClient<Database = unknown>(
    url: string,
    key: string,
  ): {
    from: (table: string) => any;
    auth: { admin: { createUser: (input: Record<string, unknown>) => Promise<any> } };
  };
}
