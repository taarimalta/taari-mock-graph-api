#!/bin/bash
# Test Country GraphQL API with seeded data

API_URL="http://localhost:4000/graphql"


# Check if server is running by sending a trivial POST query
HEALTH_JSON=$(curl -s -X POST -H "Content-Type: application/json" --data '{"query":"{ __typename }"}' "$API_URL")
if ! echo "$HEALTH_JSON" | jq -e .data > /dev/null; then
  echo "❌ API server is not running or not responding correctly at $API_URL"
  exit 1
fi

# Query all countries and extract IDs
COUNTRIES_JSON=$(curl -s -X POST -H "Content-Type: application/json" --data '{
  "query": "{ countriesPaginated(args: { first: 1000 }) { data { id name continent capital population area currency } } }"
}' $API_URL)
echo "All countries:"
echo "$COUNTRIES_JSON" | jq .

# Extract IDs for each continent
declare -A CONTINENT_IDS
for CONTINENT in africa asia europe northamerica southamerica oceania; do
  ID=$(echo "$COUNTRIES_JSON" | jq -r ".data.countries[] | select(.continent==\"$CONTINENT\") | .id" | head -n1)
  CONTINENT_IDS[$CONTINENT]=$ID
done

# Query by each continent's country ID
echo "\nQuerying one country from each continent:"
for CONTINENT in "${!CONTINENT_IDS[@]}"; do
  ID=${CONTINENT_IDS[$CONTINENT]}
  if [ -n "$ID" ]; then
    echo "- $CONTINENT (id=$ID):"
    curl -s -X POST -H "Content-Type: application/json" --data '{
      "query": "{ country(id: '$ID') { id name continent capital population area currency } }"
    }' $API_URL | jq .
  fi
done

# Update the first country (africa)
AFRICA_ID=${CONTINENT_IDS[africa]}
if [ -n "$AFRICA_ID" ]; then
  echo "\nUpdating African country (id=$AFRICA_ID)..."
  curl -s -X POST -H "Content-Type: application/json" --data '{
    "query": "mutation { updateCountry(id: '$AFRICA_ID', name: \"Nigeria Updated\") { id name continent } }"
  }' $API_URL | jq .
fi

# Delete the first country (africa)
if [ -n "$AFRICA_ID" ]; then
  echo "\nDeleting African country (id=$AFRICA_ID)..."
  curl -s -X POST -H "Content-Type: application/json" --data '{
    "query": "mutation { deleteCountry(id: '$AFRICA_ID') { id name } }"
  }' $API_URL | jq .
fi
