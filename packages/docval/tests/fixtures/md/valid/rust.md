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

## Environment

```rust docval environment=tests/fixtures/environments/rust
fn main() {
    println!("Hello from custom environment!");
}
```
