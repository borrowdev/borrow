import process from "node:process";

function isSupabaseEdgeFunction(): boolean {
  const requiredEnvVars = [
    "SUPABASE_URL",
    "SUPABASE_ANON_KEY",
    "SUPABASE_SERVICE_ROLE_KEY",
    "SUPABASE_DB_URL",
  ];

  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      return false;
    }
  }

  return true;
}

export function getIsomorphicEnvVariable(variableName: string, env: any): string | undefined {
  if (env) {
    return env[variableName];
  }

  // @ts-expect-error We're checking for Deno env
  if (typeof Deno !== "undefined" && Deno.env?.get) {
    // @ts-expect-error We're checking for Deno env
    return Deno.env.get(variableName);
  } else if (typeof process !== "undefined" && process.env) {
    return process.env[variableName];
  }
  return undefined;
}

/**
 * Extracts relevant information from a request object. Returns both the user ID
 * (if available) and the request URL (if available).
 *
 * @param {Request} req - The request object
 * @param {boolean} debug - Whether to log debug information
 * @returns {Promise<{ userId: string | null; url: string | null }>}
 */
export async function getRequestInfo(
  req: Request,
  debug?: boolean,
): Promise<{ userId: string | null; url: string | null }> {
  const result = {
    userId: null as string | null,
    url: null as string | null,
  };

  // Extract user ID if in a Supabase environment
  if (isSupabaseEdgeFunction()) {
    const supabase = await import("@supabase/supabase-js").then((mod) =>
      mod.createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!),
    );
    const authHeader = req.headers.get("Authorization")!;
    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const { error, data } = await supabase.auth.getUser(token);

      if (!error && data?.user?.id) {
        result.userId = data.user.id;

        if (debug) {
          console.log("Found Supabase user with ID: ", result.userId);
        }
      } else {
        if (debug) {
          console.warn("Failed to get Supabase user: ", error);
        }
      }
    }

    // Extract URL from request if available
    if (req.url) {
      try {
        const urlObj = new URL(req.url);
        result.url = `${urlObj.hostname}${urlObj.pathname}`;

        if (debug) {
          console.log("Extracted URL from request: ", result.url);
        }
      } catch {
        if (debug) {
          console.warn("Failed to parse URL from request: ", req.url);
        }
      }
    }
  } else {
    throw new Error(
      "You passed a Request object but we're not in a Supabase Edge Function environment",
    );
  }

  return result;
}

/**
 * @param fn - The function to call when this property is being called.
 * @param obj - An object with the properties to attach to the function when
 *   it's not being called.
 */
export function createHybridObject<F extends (...args: any[]) => any, O extends object>(
  fn: F,
  obj: O,
): F & O {
  const newFn = fn;
  for (const prop in obj) {
    if (!fn.hasOwnProperty(prop)) {
      // @ts-expect-error It seems TypeScript doesn't currently have a way of telling we're safely attaching O to F.
      newFn[prop] = obj[prop];
    }
  }

  return newFn as F & O;
}
