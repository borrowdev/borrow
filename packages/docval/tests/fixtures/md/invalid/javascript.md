# Invalid JavaScript Tests

## Simple

```javascript docval
console.log("Hello, world!");
syntax error!
```

## Import

### Static

```javascript docval
import React from "rea-ct";
import { limiter } from "@borrowdev/limiter";
```

### Dynamic

```javascript docval
import("@borrowdev-limiter");
```

### Environment variable

```javascript docval env="tests/fixtures/.env.docs"
import { equal } from "assert";
equal(process.env.FOO, "FOO");
```
