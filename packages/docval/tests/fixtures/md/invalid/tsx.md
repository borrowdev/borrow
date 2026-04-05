# Invalid TSX Tests

## Simple

```tsx docval
const element: JSX.Element = <div>Hello, world!</div>;
syntax error!
```

## Import

### Static

```tsx docval
import React from "rea-ct";
import { limiter } from "@borrowdev/limiter";
```

### Dynamic

```tsx docval
import("@borrowdev-limiter");
```

### Environment variable

```tsx docval env="tests/fixtures/.env.docs"
import { equal } from "assert";
equal(process.env.FOO, "FOO");
```
