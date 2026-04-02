# Changelog

## [2.0.0](https://github.com/borrowdev/borrow/compare/@borrowdev/limiter-v1.2.0...@borrowdev/limiter-v2.0.0) (2026-04-02)


### ⚠ BREAKING CHANGES

* **limiter:** Deprecate @borrowdev/node & create tool-scoped package instead (@borrowdev/limiter)
* **limiter:** Remove "borrow" wrapper from default export
* **limiter:** Deprecate @borrowdev/node & create tool-scoped package instead (@borrowdev/limiter)

### Features

* **ms:** Create Cloudflare Worker orchestrator ([7983c1b](https://github.com/borrowdev/borrow/commit/7983c1b6074c0d2e7a4de03cc2f288a3fb803459))
* **ms:** Create input/output data shape with zod ([e70ad74](https://github.com/borrowdev/borrow/commit/e70ad74fb0c924bc7702c3ebfeffc2a87eed1020))
* **ms:** Create measure Worker and Workers deploy script to deploy on every region ([af4c69f](https://github.com/borrowdev/borrow/commit/af4c69f4b94e76ab9a2222c8a7d83ad01ce3195b))


### Code Refactoring

* **limiter:** Remove "borrow" wrapper from default export ([49f9ec4](https://github.com/borrowdev/borrow/commit/49f9ec4db07f5e69201c740711cd9d2d411185dc))


### Build System

* **limiter:** Deprecate @borrowdev/node & create tool-scoped package instead (@borrowdev/limiter) ([c741db6](https://github.com/borrowdev/borrow/commit/c741db6cb34a5a02c3f924014322d5d43f526eab))
* **limiter:** Deprecate @borrowdev/node & create tool-scoped package instead (@borrowdev/limiter) ([58a93de](https://github.com/borrowdev/borrow/commit/58a93de9ac89be6835a9d6aeb494c1b2840a9f48))

## [1.2.0](https://github.com/borrowdev/borrow/compare/@borrowdev/node-v1.1.0...@borrowdev/node-v1.2.0) (2026-04-01)

### Features

- Export Limiters TypeScript type ([336678d](https://github.com/borrowdev/borrow/commit/336678d804f1965470a033f7f9dca198ee9a07e4))

## [1.1.0](https://github.com/borrowdev/borrow/compare/@borrowdev/node-v1.0.0...@borrowdev/node-v1.1.0) (2026-04-01)

### Features

- Export ErrorCode TypeScript type ([94e117e](https://github.com/borrowdev/borrow/commit/94e117e6648b6a98d006afcaf2d4ee79bd3680e3))

## [1.0.0](https://github.com/borrowdev/borrow/compare/@borrowdev/node-v0.2.0...@borrowdev/node-v1.0.0) (2026-04-01)

### ⚠ BREAKING CHANGES

- **limiter:** Remove support for JSR packages
- **limiter:** Change Limiter token refill global input shape for consistency
- **limiter:** Change Limiter client input shape from variable strings to object
- **limiter:** Change client API shape and bundling strategy (use tsdown)

### Features

- **limiter:** Export common Limiter TypeScript types ([7536346](https://github.com/borrowdev/borrow/commit/7536346c71f68fe21244b3866460e3ef81ef5bfc))

### Bug Fixes

- Attempt NPM publish with CI/CD retry ([3967b86](https://github.com/borrowdev/borrow/commit/3967b86d6a320d61436113b95c62142ebcd2026f))

### Code Refactoring

- **limiter:** Change client API shape and bundling strategy (use tsdown) ([8b35545](https://github.com/borrowdev/borrow/commit/8b35545d23b00e2b237f616b84e7e9ce2a0eba3c))
- **limiter:** Change Limiter client input shape from variable strings to object ([bbdc509](https://github.com/borrowdev/borrow/commit/bbdc50905aa2cc108b7b7d09d4d0cb46dc7e8abb))
- **limiter:** Change Limiter token refill global input shape for consistency ([afe72ac](https://github.com/borrowdev/borrow/commit/afe72ac667b9d2587875f0d880c2663ca9fdd39e))

### Build System

- **limiter:** Remove support for JSR packages ([86bd52f](https://github.com/borrowdev/borrow/commit/86bd52f2d2bf6ec2c079245b898f0edbd92d5137))

## [1.0.0](https://github.com/borrowdev/borrow/compare/@borrowdev/node-v0.2.0...@borrowdev/node-v1.0.0) (2026-04-01)

### ⚠ BREAKING CHANGES

- **limiter:** Remove support for JSR packages
- **limiter:** Change Limiter token refill global input shape for consistency
- **limiter:** Change Limiter client input shape from variable strings to object
- **limiter:** Change client API shape and bundling strategy (use tsdown)

### Features

- **limiter:** Export common Limiter TypeScript types ([7536346](https://github.com/borrowdev/borrow/commit/7536346c71f68fe21244b3866460e3ef81ef5bfc))

### Bug Fixes

- Attempt NPM publish with CI/CD retry ([3967b86](https://github.com/borrowdev/borrow/commit/3967b86d6a320d61436113b95c62142ebcd2026f))

### Code Refactoring

- **limiter:** Change client API shape and bundling strategy (use tsdown) ([8b35545](https://github.com/borrowdev/borrow/commit/8b35545d23b00e2b237f616b84e7e9ce2a0eba3c))
- **limiter:** Change Limiter client input shape from variable strings to object ([bbdc509](https://github.com/borrowdev/borrow/commit/bbdc50905aa2cc108b7b7d09d4d0cb46dc7e8abb))
- **limiter:** Change Limiter token refill global input shape for consistency ([afe72ac](https://github.com/borrowdev/borrow/commit/afe72ac667b9d2587875f0d880c2663ca9fdd39e))

### Build System

- **limiter:** Remove support for JSR packages ([86bd52f](https://github.com/borrowdev/borrow/commit/86bd52f2d2bf6ec2c079245b898f0edbd92d5137))

## [1.0.0](https://github.com/borrowdev/borrow/compare/node-v0.2.0...node-v1.0.0) (2026-04-01)

### ⚠ BREAKING CHANGES

- **limiter:** Change Limiter token refill global input shape for consistency
- **limiter:** Change Limiter client input shape from variable strings to object
- **limiter:** Change client API shape and bundling strategy (use tsdown)

### Features

- **limiter:** Export common Limiter TypeScript types ([7536346](https://github.com/borrowdev/borrow/commit/7536346c71f68fe21244b3866460e3ef81ef5bfc))

### Bug Fixes

- Attempt NPM publish with CI/CD retry ([3967b86](https://github.com/borrowdev/borrow/commit/3967b86d6a320d61436113b95c62142ebcd2026f))

### Code Refactoring

- **limiter:** Change client API shape and bundling strategy (use tsdown) ([8b35545](https://github.com/borrowdev/borrow/commit/8b35545d23b00e2b237f616b84e7e9ce2a0eba3c))
- **limiter:** Change Limiter client input shape from variable strings to object ([bbdc509](https://github.com/borrowdev/borrow/commit/bbdc50905aa2cc108b7b7d09d4d0cb46dc7e8abb))
- **limiter:** Change Limiter token refill global input shape for consistency ([afe72ac](https://github.com/borrowdev/borrow/commit/afe72ac667b9d2587875f0d880c2663ca9fdd39e))

## [1.0.0](https://github.com/borrowdev/borrow/compare/node-v0.2.0...node-v1.0.0) (2026-04-01)

### ⚠ BREAKING CHANGES

- **limiter:** Change Limiter token refill global input shape for consistency
- **limiter:** Change Limiter client input shape from variable strings to object
- **limiter:** Change client API shape and bundling strategy (use tsdown)

### Features

- **limiter:** Export common Limiter TypeScript types ([7536346](https://github.com/borrowdev/borrow/commit/7536346c71f68fe21244b3866460e3ef81ef5bfc))

### Code Refactoring

- **limiter:** Change client API shape and bundling strategy (use tsdown) ([8b35545](https://github.com/borrowdev/borrow/commit/8b35545d23b00e2b237f616b84e7e9ce2a0eba3c))
- **limiter:** Change Limiter client input shape from variable strings to object ([bbdc509](https://github.com/borrowdev/borrow/commit/bbdc50905aa2cc108b7b7d09d4d0cb46dc7e8abb))
- **limiter:** Change Limiter token refill global input shape for consistency ([afe72ac](https://github.com/borrowdev/borrow/commit/afe72ac667b9d2587875f0d880c2663ca9fdd39e))
