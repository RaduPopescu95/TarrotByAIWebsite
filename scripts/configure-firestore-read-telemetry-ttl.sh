#!/usr/bin/env bash
set -euo pipefail

PROJECT_ID="${1:-tarrot-590ee}"

gcloud firestore fields ttls update expiresAt \
  --collection-group=FirestoreReadTelemetryDaily \
  --project="$PROJECT_ID" \
  --enable-ttl

gcloud firestore fields ttls update expiresAt \
  --collection-group=ReadTelemetryDaily \
  --project="$PROJECT_ID" \
  --enable-ttl
