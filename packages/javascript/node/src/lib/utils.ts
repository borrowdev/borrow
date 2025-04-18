import type { User } from "@supabase/supabase-js";
import process from "node:process";

export function isBorrowEnv(): boolean {
  return process.env.BORROW_ENV === "borrow";
}

export function isSupabaseEdgeFunction(): boolean {
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

// TODO: Find a way to import the Deno Request type (only for this function) without all the declaration types
export async function getSupabaseUser(
  req: Request,
  debug?: boolean
): Promise<User | null> {
  if (!isSupabaseEdgeFunction()) {
    return null;
  }
  const supabase = await import("@supabase/supabase-js").then((mod) =>
    mod.createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
  );
  const authHeader = req.headers.get("Authorization")!;
  const token = authHeader.replace("Bearer ", "");
  const { error, data } = await supabase.auth.getUser(token);

  if (error || !data?.user) {
    return null;
  }

  if (debug) {
    console.log("Found Supabase user with ID: ", data.user?.id);
  }

  return data.user || null;
}

/**
 * Extracts relevant information from a Supabase request object.
 * Returns both the user ID (if available) and the request URL (if available).
 * 
 * @param {Request} req - The Supabase request object
 * @param {boolean} debug - Whether to log debug information
 * @returns {Promise<{userId: string | null, url: string | null}>}
 */
export async function getSupabaseRequestInfo(
  req: Request,
  debug?: boolean
): Promise<{userId: string | null, url: string | null}> {
  const result = {
    userId: null as string | null,
    url: null as string | null
  };
    
  // Extract user ID if in a Supabase environment
  if (isSupabaseEdgeFunction()) {
    const supabase = await import("@supabase/supabase-js").then((mod) =>
      mod.createClient(
        process.env.SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      )
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
      } catch (error) {
        if (debug) {
          console.warn("Failed to parse URL from request: ", req.url);
        }
      }
    }
  } else {
    throw new Error("You passed a Request object but we're not in a Supabase Edge Function environment");
  }

  return result;
}
