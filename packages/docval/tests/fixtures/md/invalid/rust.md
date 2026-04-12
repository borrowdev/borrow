# Invalid Rust Tests

## Simple

```rust docval
fn main() {
    println!("Hello, world!")
    syntax error!
}
```

## Types

```rust docval
fn main() {
    let x: i32 = "not a number";
}
```

## Missing function

```rust docval
fn main() {
    nonexistent_function();
}
```

### Short name

```rs docval
fn main() {
    let x = 42
    syntax error!
}
```

### Internal import - crate

```rust docval
use crate::my_module;
fn main() {
    my_module::my_function();
}
```

### Internal import - super

```rust docval
use super::my_module;
fn main() {
    my_module::my_function();
}
```

### Internal import - self

```rust docval
use self::my_module;
fn main() {
    my_module::my_function();
}
```

### Directive - cargo-add-options

```rust docval
// @docval-cargo-add-options serde nonexistent_feature
use serde::Serialize;

#[derive(Serialize)]
struct Point {
    x: i32,
    y: i32,
}

fn main() {
    let point = Point { x: 1, y: 2 };
    println!("Created point with x={}, y={}", point.x, point.y);
}
```

### Directive - hidden code still validates

```rust docval
fn main() {
    // @docval-hidden
    nonexistent_function();
}
```
