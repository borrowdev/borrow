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
