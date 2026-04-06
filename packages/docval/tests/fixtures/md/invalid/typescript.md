# Invalid TypeScript Tests

## Simple

```typescript docval
const message: string = "Hello, world!";
syntax error!
```

## Import

### Static

```typescript docval
import React from "rea-ct";
import { limiter } from "@borrowdev/limiter";
```

### Dynamic

```typescript docval
import("@borrowdev-limiter");
```

### Environment variable

```typescript docval env="tests/fixtures/.env.docs"
import { equal } from "assert";
equal(process.env.FOO, "FOO");
```
