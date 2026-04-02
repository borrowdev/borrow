<div align="center">
  <img src="https://borrow.dev/opengraph.png" alt="Borrow OpenGraph Image" width="200" height="100" />
</div>

<h3 align="center">⇀ DX-First Tools for 10x Developers ⇀</h3>

<p align="center">
  <b>Simple, open-source, self-hostable</b><br>
</p>

<p align="center" style="font-size:12px">
  MIT license, 0 lock-in and built with ❤️ by <a href="https://borrow.dev">Borrow</a>
</p>

## 🔑 Authentication

[Follow this guide to authenticate if using our managed service.](https://borrow.dev/docs/limiter/quick-start#authentication)

## 📚 Documentation

[Read the full documentation for Borrow.](https://borrow.dev/docs)

## 🌎 Borrow Ms

Measure the latency of your API around the world in 1 command.

### Usage

```bash
cargo install borrow-dev

export BORROW_API_KEY=your_borrow_api_key

borrow ms https://api.example.com/data \
  -m POST \
  --header "Authorization: Bearer token" \
  --header "Content-Type: application/json" \
  -d '{"key": "value"}'
```

## 🚪 Borrow Limiter

Self-hostable rate limiting API for protecting regular service usage.

### Usage

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
      "Rate limit exceeded." + timeLeft !== null
        ? ` You can try again in ${timeLeft} seconds.`
        : "",
  };
}
```

### Self-host

To self-host the Limiter API, follow the [self-hosting guide](https://borrow.dev/docs/limiter/self-hosting).

## 🛠 Borrow CLI

### Install

```bash
cargo install borrow-dev
```

### Borrow Start

Borrow Start is a command-line tool that helps you quickly set up common boilerplate code with pre-defined templates and placeholders.

Templates are downloaded from the [Borrow registry](https://github.com/borrowdev/registry), or you can create your own templates
and refer to them locally by using the `local:` prefix before `<template>`.

#### Usage

```bash
# Download and install a template
borrow start new -t <template> -o <output_dir>
# Delete a template from the cache
borrow start del -t <template>
```

#### Example

```bash
borrow start new -t supabase-proxy -o ~/my-awesome-project
```

#### Roadmap

- [ ] Add support for self-hosted GitHub templates.
- [ ] Add support for package metadata.
- [ ] Add support for sandboxed template code execution with hooks.
- [ ] Add support for per-file config with frontmatter.
- [ ] Write documentation for how to create your own templates.
