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
