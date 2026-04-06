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

### Static with path

```javascript docval
import { defineConfig, defineDocs } from "fumadocs-mdx/config";
```

### Static with scope and path

```javascript docval
import { limiter } from "@borrowdev/limiter/host";
```

### Dynamic

```javascript docval
import("@borrowdev/limiter");
```

### Dynamic with path

```javascript docval
import("@borrowdev/limiter/host");
```

### Dynamic with scope and path

```javascript docval
import("@borrowdev/limiter/host").then((module) => {
  const limiter = module.limiter;
});
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
