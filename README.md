# Polkadot js example

## ※注意事項※

1. astar collator のバージョンが 4.33 じゃないと動かない
2. Shibuya だとうまく動かない・・。
3. ローカルノード立ち上げ後は資産が 0 なので Extention 内のアカウントに資産を送ってあげる必要あり。

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
