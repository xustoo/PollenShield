#!/usr/bin/env sh
set -eu

BASE_URL="${BASE_URL:-http://localhost:3000}"
LOCATION_ID="ankara-bahcelievler"
REGION_ID="ankara"

print_step() {
  printf "\n\n%s\n" "$1"
  printf "%s\n" "----------------------------------------"
}

post_json() {
  path="$1"
  body="$2"
  curl -fsS -X POST "$BASE_URL$path" \
    -H "Content-Type: application/json" \
    -d "$body"
}

get_json() {
  path="$1"
  curl -fsS "$BASE_URL$path"
}

extract_user_id() {
  node -e "const fs=require('fs'); const j=JSON.parse(fs.readFileSync(0,'utf8')); const d=j.data||j; console.log(d.id || (d.user && d.user.id) || '');"
}

print_step "1. Register demo user"
REGISTER_RESPONSE="$(post_json "/api/users/register" '{
  "name": "Salih Demo",
  "email": "salih.demo@example.com",
  "password": "123456",
  "allergyTypes": ["tree_pollen", "grass_pollen"],
  "sensitivityLevel": "High",
  "notificationEnabled": true
}')"
echo "$REGISTER_RESPONSE"
USER_ID="$(printf "%s" "$REGISTER_RESPONSE" | extract_user_id)"

if [ -z "$USER_ID" ]; then
  echo "Could not extract userId from register response."
  exit 1
fi

print_step "2. Create environmental report"
post_json "/api/environment/report" "{
  \"locationId\": \"$LOCATION_ID\",
  \"temperature\": 24,
  \"humidity\": 38,
  \"windSpeed\": 12,
  \"pollenIndex\": 72
}"

print_step "3. Create symptom report"
post_json "/api/symptoms" "{
  \"userId\": \"$USER_ID\",
  \"locationId\": \"$LOCATION_ID\",
  \"regionId\": \"$REGION_ID\",
  \"symptoms\": [\"sneezing\", \"itchy_eyes\"],
  \"intensity\": 7
}"

print_step "4. Recalculate risk"
post_json "/api/risk/recalculate" "{
  \"locationId\": \"$LOCATION_ID\",
  \"pollenIndex\": 72,
  \"humidity\": 38,
  \"windSpeed\": 12,
  \"averageSymptomIntensity\": 6
}"

print_step "5. Get risk by location"
get_json "/api/risk/location/$LOCATION_ID"

print_step "6. Recommend route"
post_json "/api/routes/recommend" '{
  "startLocation": "home",
  "destinationLocation": "gazi-university",
  "candidateLocationIds": [
    "ankara-bahcelievler",
    "ankara-emek",
    "ankara-bestepe"
  ]
}'

print_step "7. Get notifications"
get_json "/api/notifications/user/$USER_ID"

echo "\n\nDemo seed flow completed."

