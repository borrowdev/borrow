# Invalid JSX Tests

## Simple

```jsx docval
const element = <div>Hello, world!</div>;
syntax error!
```

## Import

### Static

```jsx docval
import React from "rea-ct";
import { limiter } from "@borrowdev/limiter";
```

### Dynamic

```jsx docval
import("@borrowdev-limiter");
```

### Environment variable

```jsx docval env="tests/fixtures/.env.docs"
import { equal } from "assert";
equal(process.env.FOO, "FOO");
```
