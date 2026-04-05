# Valid TypeScript Tests

## Simple

```typescript docval
const message: string = "Hello, world!";
console.log(message);
```

## Import

### Static

```typescript docval
import React from "react";
import { limiter } from "@borrowdev/limiter";
```

### Dynamic

```typescript docval
import("@borrowdev/limiter");
```

### Environment variable

```typescript docval env="tests/fixtures/.env.docs"
import { equal } from "assert";
equal(process.env.FOO, "BAR");
```

### Short name

```ts docval
const x = 42;
console.log(x);
```
