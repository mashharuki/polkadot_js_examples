# Polkadot js example

## 動かし方

- フロントエンド

```bash
cd frontend && yarn
yarn dev
```

- バックエンド

1. テストコマンド

```bash
cd flipper && cargo +nightly contract test
```

2. ビルドコマンド

```bash
cd flipper && cargo +nightly contract build
```

result

```bash
~/polkadot_js_examples/flipper/target/ink

  - flipper.contract (code + metadata)
  - flipper.wasm (the contract's code)
  - metadata.json (the contract's metadata)
```
