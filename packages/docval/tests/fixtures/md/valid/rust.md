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

### Multiple imports of the same crate

```rust docval
use rand::RngExt;
use rand::SeedableRng;

fn main() {
    let mut rng = rand::rng();
    let n: u32 = rng.random();
    println!("{}", n);
}
```

### Cargo add options

```rust docval
// @docval-cargo-add-options serde --features derive,std
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

```rust docval
// @docval-cargo-add-options tokio --features full
// Test comment
use serde::Serialize;
use tokio::runtime::Runtime;

fn main() {
    let rt = Runtime::new().unwrap();
    rt.block_on(async {
        println!("Hello, world!");
    });
}
```

### Multiple directives of the same type

```rust docval
// @docval-cargo-add-options serde --features derive,std
// @docval-cargo-add-options tokio --features full
use serde::Serialize;
use tokio::runtime::Runtime;

fn main() {
    let rt = Runtime::new().unwrap();
    rt.block_on(async {
        println!("Hello, world!");
    });
}
```
