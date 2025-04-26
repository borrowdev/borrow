<p align="center">
  <img src="https://borrow.dev/opengraph-image.png" alt="Borrow Logo" width="600" height="300" />
</p>

<h3 align="center">We automate the boring stuff for you</h3>

<p align="center">
  <b>Simple, open-source, powerful tools for modern serverless applications</b><br>
</p>

<p align="center" style="font-size:12px">
  All tools are easily self-hostable, fully typed, and designed for serverless-first environments.
</p>

## Authentication
[Follow this guide to authenticate if using our managed service.](https://borrow.dev/docs/limiter/quick-start#authentication)

## Documentation
[Read the full documentation for Borrow.](https://borrow.dev/docs)

## Limiter
Self-hostable rate limiting API for protecting regular service usage.

### Usage

Let's use the [fixed window](https://borrow.dev/docs/limiter/algorithms#fixed-window) algorithm to rate limit our login endpoint to 10 requests per minute.

```javascript
import { borrow } from "@borrowdev/node";

const { success, timeLeft } = await borrow.limiter("my-limiter-id", "current-user-id", {
	limiters: [{
		maxRequests: 10,
		interval: "minute",
		type: "fixed",
	}]
});
if (!success) {
	return { message: "Rate limit exceeded." + timeLeft !== null ? ` You can try again in ${timeLeft} seconds.` : "" };
}
```

### Self host
To self-host the Limiter API, follow the [self-hosting guide](https://borrow.dev/docs/limiter/self-hosting).