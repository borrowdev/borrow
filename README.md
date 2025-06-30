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

## Borrow Limiter
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

## Borrow CLI - The Developer Toolkit

### Install
```bash
cargo install borrow-dev
```

### Start
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