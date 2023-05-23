#!/usr/bin/env bash

# Save the directory passed in absolute path, otherwise use current directory
DIR=$(realpath "${1:-.}")

# Save script's absolute path, even if it's called using a symlink
SCRIPT_DIR="$(dirname "$(readlink -f "$0")")"

# Start the stream
node "$SCRIPT_DIR/index.js" "$DIR"
