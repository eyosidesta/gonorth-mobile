#!/bin/bash
# Usage:
#   sh update-ip.sh           → sets 10.0.2.2 (Android emulator, permanent)
#   sh update-ip.sh device    → sets current LAN IP (physical device on same WiFi)

if [ "$1" = "device" ]; then
  IP=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | head -1)
  if [ -z "$IP" ]; then
    echo "Could not detect LAN IP"
    exit 1
  fi
  echo "Setting LAN IP for physical device: $IP"
else
  IP="10.0.2.2"
  echo "Setting Android emulator address: $IP"
fi

sed -i '' "s|EXPO_PUBLIC_API_URL=http://[^:]*:3000|EXPO_PUBLIC_API_URL=http://$IP:3000|" .env
echo "Done: EXPO_PUBLIC_API_URL=http://$IP:3000"
