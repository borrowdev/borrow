# Valid TSX Tests

## Simple

```tsx docval
const message = "Hello, world!";
console.log(message);
```

## Import

### Static

```tsx docval
import React from "react";
import { limiter } from "@borrowdev/limiter";
```

### Dynamic

```tsx docval
import("@borrowdev/limiter");
```

### Environment variable

```tsx docval env="tests/fixtures/.env.docs"
import { equal } from "assert";
equal(process.env.FOO, "BAR");
```

## React

```tsx docval
import React from "react";
const App = (): React.JSX.Element => {
  return (
    <div>
      <h1>Hello, world!</h1>
      <p>This is a TSX component.</p>
    </div>
  );
};
```
