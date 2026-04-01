# Borrow Node.js SDK

<div align="center">
  <a href="https://www.npmjs.com/package/@borrowdev/limiter"><img src="https://img.shields.io/npm/v/@borrowdev/limiter" alt="NPM version"></a>
  <a href="https://github.com/borrowdev/borrow/blob/main/LICENSE"><img src="https://img.shields.io/github/license/borrowdev/borrow" alt="License"></a>
</div>

## Features

- **Self-hostable** - Easily deploy on your own infrastructure
- **Minimal dependencies** - Lightweight and secure
- **Fully typed** - Complete TypeScript + JSDoc support
- **Simple API** - Intuitive interfaces for all tools
- **Serverless-first** - [Integration](https://borrow.dev/docs/limiter/integrations/supabase) with modern cloud environments

## Installation

```bash
# npm
npm install @borrowdev/limiter

# pnpm
pnpm add @borrowdev/limiter

# yarn
yarn add @borrowdev/limiter

# bun
bun add @borrowdev/limiter
```

## Authentication

[Follow this guide.](https://borrow.dev/docs/limiter/quick-start#authentication)

## Usage

Let's use the [fixed window](https://borrow.dev/docs/limiter/algorithms#fixed-window) algorithm to rate limit our login endpoint to 10 requests per minute.

```javascript
import { limiter } from "@borrowdev/limiter";

const { success, timeLeft } = await limiter(
  {
    key: "my-limiter-id",
    userId: "current-user-id",
  },
  {
    limiters: [
      {
        maxRequests: 10,
        interval: "minute",
        type: "fixed",
      },
    ],
  },
);
if (!success) {
  return {
    message:
      "Rate limit exceeded." +
      (timeLeft !== null ? ` You can try again in ${timeLeft} seconds.` : ""),
  };
}
```

## Documentation

[Read the full documentation for Limiter](https://borrow.dev/docs/limiter)
