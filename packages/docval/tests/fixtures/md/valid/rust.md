# Valid Rust Tests

## Simple

```rust docval
fn main() {
    println!("Hello, world!");
}
```

### Short name

```rs docval
fn main() {
    let x = 42;
    println!("{}", x);
}
```

### Environment

```rust docval environment=tests/fixtures/environments/rust
fn main() {
    println!("Hello world!");
}
```

### Import

```rust docval
use rand::RngExt;

fn main() {
    let mut rng = rand::rng();
    let n: u32 = rng.random();
    println!("{}", n);
}
```

### Scoped import

```rust docval
fn main() {
    use std::collections::HashMap;
    let mut map = HashMap::new();
    map.insert("key", "value");
    println!("{:?}", map);
}
```

### Multiple imports

```rust docval
use std::collections::HashMap;
use rand::RngExt;

fn main() -> std::io::Result<()> {
    let mut rng = rand::rng();
    let n: u32 = rng.random();
    println!("Random number: {}", n);
    Ok(())
}
```
