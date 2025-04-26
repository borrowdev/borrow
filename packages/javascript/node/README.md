# Borrow Node.js SDK

<p align="center">
  <a href="https://www.npmjs.com/package/@borrowdev/node"><img src="https://img.shields.io/npm/v/@borrowdev/node" alt="NPM version"></a>
  <a href="https://jsr.io/@borrow/node"><img src="https://jsr.io/badges/@borrow/node" alt="JSR version"></a>
  <a href="https://github.com/borrowdev/borrow/blob/main/LICENSE"><img src="https://img.shields.io/github/license/borrowdev/borrow" alt="License"></a>
</p>

> [!WARNING]  
> This package is NOT stable yet. There may be breaking changes with every minor release.
>
> It is recommended to wait for the 1.0.0 release before using this package in production.

## Features

- **Self-hostable** - Easily deploy on your own infrastructure
- **Minimal dependencies** - Lightweight and secure
- **Fully typed** - Complete TypeScript + JSDoc support
- **Simple API** - Intuitive interfaces for all tools
- **Serverless-first** - [Integration](https://borrow.dev/docs/limiter/integrations/supabase) with modern cloud environments

## Installation

```bash
# npm
npm install @borrowdev/node

# pnpm
pnpm add @borrowdev/node

# yarn
yarn add @borrowdev/node

# bun
bun add @borrowdev/node
```

## Authentication
[Follow this guide.](https://borrow.dev/docs/limiter/quick-start#authentication)

## Usage

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

## Documentation
[Read the full documentation for Limiter](https://borrow.dev/docs/limiter)