#!/bin/bash
# Creates Kibana index pattern and saved searches for NexaSphere logs.
set -euo pipefail

KIBANA_URL="${KIBANA_URL:-http://kibana:5601}"
ES_URL="${ES_URL:-http://elasticsearch:9200}"

echo "Waiting for Kibana at ${KIBANA_URL}..."
until curl -sf "${KIBANA_URL}/api/status" > /dev/null 2>&1; do
  sleep 5
done

echo "Creating index pattern nexasphere-logs-*..."
curl -sf -X POST "${KIBANA_URL}/api/index_patterns/index_pattern" \
  -H 'kbn-xsrf: true' \
  -H 'Content-Type: application/json' \
  -d '{
    "index_pattern": {
      "title": "nexasphere-logs-*",
      "timeFieldName": "@timestamp"
    }
  }' || echo "Index pattern may already exist."

echo "Creating saved search: errors by service..."
curl -sf -X POST "${KIBANA_URL}/api/saved_objects/search/nexasphere-errors" \
  -H 'kbn-xsrf: true' \
  -H 'Content-Type: application/json' \
  -d '{
    "attributes": {
      "title": "NexaSphere Errors",
      "columns": ["@timestamp", "level", "service", "message", "traceId", "userId"],
      "sort": [["@timestamp", "desc"]],
      "kibanaSavedObjectMeta": {
        "searchSourceJSON": "{\"index\":\"nexasphere-logs-*\",\"query\":{\"language\":\"kuery\",\"query\":\"level:error\"},\"filter\":[]}"
      }
    }
  }' || echo "Saved search may already exist."

echo "Kibana setup complete."
