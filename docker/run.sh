#!/bin/bash

# 设置 Kong Admin API 的地址
KONG_ADMIN_URL="http://kong.kong:8001"

# 设置服务的配置信息
SERVICE_NAME="tcl-front"
SERVICE_URL="http://tcl-front:8008"
ROUTE_PATH="/"

# 发送注册请求到 Kong
curl -X POST "$KONG_ADMIN_URL/services" -d "name=$SERVICE_NAME" -d "url=$SERVICE_URL"
curl -X POST "$KONG_ADMIN_URL/services/$SERVICE_NAME/routes" -d "paths[]=$ROUTE_PATH"

nginx -g "daemon off;"
