#!/bin/bash
# Test Animal GraphQL API with seeded data

API_URL="http://localhost:4000/graphql"

# Check if server is running by sending a trivial POST query
HEALTH_JSON=$(curl -s -X POST -H "Content-Type: application/json" --data '{"query":"{ __typename }"}' "$API_URL")
if ! echo "$HEALTH_JSON" | jq -e .data > /dev/null; then
  echo "❌ API server is not running or not responding correctly at $API_URL"
  exit 1
fi

# Query all animals and extract IDs
ANIMALS_JSON=$(curl -s -X POST -H "Content-Type: application/json" --data '{
  "query": "{ animals { id name category species habitat diet conservation_status } }"
}' $API_URL)
echo "All animals:"
echo "$ANIMALS_JSON" | jq .

# Extract IDs for each category
declare -A CATEGORY_IDS
for CATEGORY in mammals birds reptiles amphibians fish insects; do
  ID=$(echo "$ANIMALS_JSON" | jq -r ".data.animals[] | select(.category==\"$CATEGORY\") | .id" | head -n1)
  CATEGORY_IDS[$CATEGORY]=$ID
done

# Query by each category's animal ID
echo "\nQuerying one animal from each category:"
for CATEGORY in "${!CATEGORY_IDS[@]}"; do
  ID=${CATEGORY_IDS[$CATEGORY]}
  if [ -n "$ID" ]; then
    echo "- $CATEGORY (id=$ID):"
    curl -s -X POST -H "Content-Type: application/json" --data '{
      "query": "{ animal(id: '$ID') { id name category species habitat diet conservation_status } }"
    }' $API_URL | jq .
  fi
done

# Update the first animal (mammals)
MAMMAL_ID=${CATEGORY_IDS[mammals]}
if [ -n "$MAMMAL_ID" ]; then
  echo "\nUpdating mammal (id=$MAMMAL_ID)..."
  curl -s -X POST -H "Content-Type: application/json" --data '{
    "query": "mutation { updateAnimal(id: '$MAMMAL_ID', name: \"Elephant Updated\") { id name category } }"
  }' $API_URL | jq .
fi

# Delete the first animal (mammals)
if [ -n "$MAMMAL_ID" ]; then
  echo "\nDeleting mammal (id=$MAMMAL_ID)..."
  curl -s -X POST -H "Content-Type: application/json" --data '{
    "query": "mutation { deleteAnimal(id: '$MAMMAL_ID') { id name } }"
  }' $API_URL | jq .
fi
