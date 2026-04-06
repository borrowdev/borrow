# Valid JSX Tests

## Simple

```jsx docval
console.log("Hello, world!");
```

## Import

### Static

```jsx docval
import React from "react";
import { limiter } from "@borrowdev/limiter";
```

### Dynamic

```jsx docval
import("@borrowdev/limiter");
```

### Environment variable

```jsx docval env="tests/fixtures/.env.docs"
import { equal } from "assert";
equal(process.env.FOO, "BAR");
```

## React

```jsx docval
import React from "react";
const App = () => {
  return (
    <div>
      <h1>Hello, world!</h1>
      <p>This is a JSX component.</p>
    </div>
  );
};
```
