type ApiPath = "/limiter";
import process from "node:process";

class BorrowClient {
  #endpoint: string = "https://api.borrow.dev/v1";

  #apiKey: string | undefined;
  get apiKey(): string | undefined {
    return this.#apiKey || process.env.BORROW_API_KEY;
  }
  set apiKey(apiKey: string | undefined) {
    this.#apiKey = apiKey;
  }

  constructor(apiKey?: string, endpoint?: string, isSingleton?: boolean) {
    if (
      // @ts-expect-error We're checking for the browser environment, so it makes sense TypeScript would complain since this is a Node.js package
      typeof window === "object" &&
      typeof process !== "object" &&
      // @ts-expect-error We're checking for the Deno environment, so it makes sense TypeScript would complain since this is a Node.js package
      typeof Deno !== "object"
    ) {
      console.warn(
        "@borrowdev/node should NOT be used in a browser environment, you might end up exposing your secret token!"
      );
    }

    const finalSecret = apiKey || process.env.BORROW_API_KEY;

    // Sometimes the borrow singleton might be imported before the environment variables are loaded
    // so we just issue a warning and check for them when calling the API
    if (!finalSecret && !isSingleton) {
      console.warn(
        "BORROW_API_KEY environment variable not set or 'apiKey' not provided at instantiation time, Borrow will attempt to get it when calling the API..."
      );
    }

    this.apiKey = finalSecret;

    // Used for testing
    if (endpoint) {
      this.#endpoint = endpoint;
    }
  }

  #call(method: string, path: string, options: RequestInit = {}) {
    const url = new URL(this.#endpoint + path);

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (!this.apiKey) {
      throw new Error("Couldn't find secret when calling " + this.#endpoint);
    }
    headers["X-Borrow-Api-Key"] = this.apiKey;

    return fetch(url.toString(), {
      ...options,
      method,
      headers,
    });
  }

  async get(path: ApiPath, options: RequestInit = {}) {
    return this.#call("GET", path, options);
  }
  async post(path: ApiPath, options: RequestInit = {}) {
    return this.#call("POST", path, options);
  }
}

export const borrow = new BorrowClient(undefined, undefined, true);
export { BorrowClient };
export default borrow;
