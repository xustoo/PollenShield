#!/usr/bin/env sh
set -u

echo "PollenShield health check"
echo "========================="

check() {
  name="$1"
  url="$2"
  printf "\n[%s]\n%s\n" "$name" "$url"
  if curl -fsS "$url"; then
    printf "\n%s OK\n" "$name"
  else
    printf "\n%s FAILED\n" "$name"
    exit 1
  fi
}

check "API Gateway" "http://localhost:3000/health"
check "User Profile Service" "http://localhost:3001/health"
check "Environmental Data Service" "http://localhost:3002/health"
check "Symptom Report Service" "http://localhost:3003/health"
check "Allergy Risk Service" "http://localhost:3004/health"
check "Route Recommendation Service" "http://localhost:3005/health"
check "Notification Service" "http://localhost:3006/health"

echo "\nAll PollenShield services are healthy."

