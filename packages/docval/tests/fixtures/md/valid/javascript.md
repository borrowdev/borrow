# Valid JavaScript Tests

## Simple

```javascript docval
console.log("Hello, world!");
```

## Import

### Static

```javascript docval
import React from "react";
import { limiter } from "@borrowdev/limiter";
```

### Dynamic

```javascript docval
import("@borrowdev/limiter");
```

### Environment variable

```javascript docval env="tests/fixtures/.env.docs"
import { equal } from "assert";
equal(process.env.FOO, "BAR");
```

### Short name

```js docval
console.log("Hi JS!");
```
