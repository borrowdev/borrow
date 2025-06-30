# Borrow CLI - The Developer Toolkit

## Install
```bash
cargo install borrow-dev
```

## Start
Borrow Start is a command-line tool that helps you quickly set up common boilerplate code with pre-defined templates and placeholders.

Templates are downloaded from the [Borrow registry](https://github.com/borrowdev/registry), or you can create your own templates
and refer to them locally by using the `local:` prefix before `<template>`.

### Usage
```bash
# Download and install a template
borrow start new -t <template> -o <output_dir>
# Delete a template from the cache
borrow start del -t <template>
```

### Example
```bash
borrow start new -t supabase-proxy -o ~/my-awesome-project
```

### Roadmap
- [ ] Add support for self-hosted GitHub templates.
- [ ] Add support for package metadata.
- [ ] Add support for sandboxed template code execution with hooks.
- [ ] Write documentation for how to create your own templates.