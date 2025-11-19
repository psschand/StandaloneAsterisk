#!/bin/bash
# Helper script to get authentication token without subshell in command line

curl -s -X POST http://138.2.68.107:8443/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@callcenter.com","password":"Password123!","tenant_id":"demo-tenant"}' \
  | jq -r '.data.access_token'
