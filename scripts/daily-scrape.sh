#!/bin/bash
# Daily scraper wrapper for launchd. launchd runs with a minimal environment,
# so we set PATH explicitly and cd into the project before running the scrape.
set -euo pipefail

export PATH="/opt/homebrew/bin:/usr/bin:/bin:/usr/sbin:/sbin"
cd "$(dirname "$0")/.." || exit 1

mkdir -p logs
echo "===== scrape run: $(date '+%Y-%m-%d %H:%M:%S') =====" >> logs/scrape.log
npm run scrape >> logs/scrape.log 2>&1
echo "" >> logs/scrape.log
