# Hermes Studio

Desktop application shell for Hermes Agent.

This repository treats `hermes-agent` as a vendored runtime rather than as the
main application source. The desktop app owns the product UI, packaging,
bridge layer, and release flow. Hermes Agent stays pinned to an explicit
upstream version under `vendor/hermes-agent`.

## Repository Layout

```text
apps/
  desktop/              Desktop application shell
packages/
  bridge/               Frontend-to-Hermes runtime bridge
vendor/
  hermes-agent/         Pinned upstream Hermes Agent source
patches/
  hermes-agent/         Versioned patches applied after vendoring
scripts/
  vendor-hermes.sh      Fetch the pinned Hermes source
  apply-patches.sh      Apply local patches to the vendor tree
hermes-version.lock     Upstream source lock
```

## Vendor Flow

1. Update `hermes-version.lock` with the upstream repo and ref.
2. Run `scripts/vendor-hermes.sh`.
3. Run `scripts/apply-patches.sh`.
4. Run desktop integration tests before committing the vendor update.

The vendor tree should be considered generated. Prefer changing Hermes through
patch files in `patches/hermes-agent` so upgrades stay reviewable.

## Desktop Development

Hermes Studio uses Electron, React, TypeScript, and Vite.

```bash
pnpm install
pnpm dev
```

Useful checks:

```bash
pnpm typecheck
pnpm --filter @hermes-studio/desktop build
```
