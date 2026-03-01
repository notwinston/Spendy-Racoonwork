#!/bin/bash
set -e
for flow in flows/*.yaml; do
  echo "Running $flow..."
  maestro test "$flow" || echo "FAILED: $flow"
done
echo "All flows complete."
