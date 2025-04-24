import { BorrowClient, borrow } from "./client.js";

describe("BorrowClient", () => {
  const secret = "test_secret";

  beforeEach(() => {
    vi.stubEnv("BORROW_API_KEY", secret);
  });

  test("should export a singleton", () => {
    const client = new BorrowClient();
    expect(borrow).toBeInstanceOf(BorrowClient);
    expect(borrow).not.toBe(client);
  });

  test("should create a new instance every time the class is instantiated", () => {
    const newClient = new BorrowClient();
    const client = new BorrowClient();
    expect(newClient).toBeInstanceOf(BorrowClient);
    expect(newClient).not.toBe(client);
  });

  test("should detect secret from environment variable", () => {
    const client = new BorrowClient();
    expect(client.apiKey).toEqual(secret);
    expect(borrow.apiKey).toEqual(secret);
  });

  test("should detect endpoint from constructor", () => {
    const customEndpoint = "https://custom-endpoint.com/api/v1";
    const client = new BorrowClient(undefined, customEndpoint);
    expect(client.endpoint).toEqual(customEndpoint);
  });

  test("should prioritize secret from constructor", () => {
    const constructorSecret = "constructor_secret";
    const client = new BorrowClient(constructorSecret);
    expect(client.apiKey).toEqual(constructorSecret);
  });
});
