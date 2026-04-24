#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
VENDOR_DIR="$ROOT_DIR/vendor/hermes-agent"
PATCH_DIR="$ROOT_DIR/patches/hermes-agent"

if [[ ! -d "$VENDOR_DIR/.git" ]]; then
  echo "Missing vendor tree. Run scripts/vendor-hermes.sh first." >&2
  exit 1
fi

shopt -s nullglob
patches=("$PATCH_DIR"/*.patch)

if [[ ${#patches[@]} -eq 0 ]]; then
  echo "No Hermes patches to apply."
  exit 0
fi

for patch in "${patches[@]}"; do
  echo "Applying $(basename "$patch")"
  git -C "$VENDOR_DIR" apply "$patch"
done

