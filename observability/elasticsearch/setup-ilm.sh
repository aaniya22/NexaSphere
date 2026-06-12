#!/bin/bash
set -euo pipefail

ES_URL="${ES_URL:-http://elasticsearch:9200}"

echo "Waiting for Elasticsearch at ${ES_URL}..."
until curl -sf "${ES_URL}/_cluster/health" > /dev/null; do
  sleep 5
done

echo "Applying ILM policies..."

curl -sf -X PUT "${ES_URL}/_ilm/policy/nexasphere-logs-30d" \
  -H 'Content-Type: application/json' \
  -d @/templates/logs-30d-policy.json

curl -sf -X PUT "${ES_URL}/_ilm/policy/nexasphere-compliance-365d" \
  -H 'Content-Type: application/json' \
  -d @/templates/logs-compliance-365d-policy.json

curl -sf -X PUT "${ES_URL}/_index_template/nexasphere-logs" \
  -H 'Content-Type: application/json' \
  -d @/templates/logs-30d.json

curl -sf -X PUT "${ES_URL}/_index_template/nexasphere-compliance" \
  -H 'Content-Type: application/json' \
  -d @/templates/logs-compliance-365d.json

echo "ILM policies and index templates applied."
