#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LOCK_FILE="$ROOT_DIR/hermes-version.lock"
VENDOR_DIR="$ROOT_DIR/vendor/hermes-agent"

if [[ ! -f "$LOCK_FILE" ]]; then
  echo "Missing $LOCK_FILE" >&2
  exit 1
fi

repo="$(awk -F= '$1 == "repo" {print $2}' "$LOCK_FILE")"
ref="$(awk -F= '$1 == "ref" {print $2}' "$LOCK_FILE")"
commit="$(awk -F= '$1 == "commit" {print $2}' "$LOCK_FILE")"

if [[ -z "$repo" || -z "$ref" ]]; then
  echo "hermes-version.lock must define repo and ref" >&2
  exit 1
fi

rm -rf "$VENDOR_DIR"
mkdir -p "$(dirname "$VENDOR_DIR")"

git clone --depth 1 --recurse-submodules --shallow-submodules --branch "$ref" "$repo" "$VENDOR_DIR"

if [[ -n "$commit" ]]; then
  git -C "$VENDOR_DIR" fetch --depth 1 origin "$commit"
  git -C "$VENDOR_DIR" checkout --detach "$commit"
  git -C "$VENDOR_DIR" submodule update --init --recursive --depth 1
fi

if ! command -v uv >/dev/null 2>&1; then
  echo "uv is required to prepare the managed Hermes runtime." >&2
  echo "Install uv first: https://docs.astral.sh/uv/getting-started/installation/" >&2
  exit 1
fi

(
  cd "$VENDOR_DIR"
  uv venv venv --python 3.11
  export VIRTUAL_ENV="$VENDOR_DIR/venv"
  uv pip install -e ".[all,dev]"

  if [[ -d "$VENDOR_DIR/tinker-atropos" ]]; then
    uv pip install -e "./tinker-atropos"
  fi
)

echo "Hermes vendored at $(git -C "$VENDOR_DIR" rev-parse HEAD)"
echo "Managed Hermes CLI: $VENDOR_DIR/venv/bin/hermes"
