#!/bin/bash

echo "Starting nginx..."
sudo systemctl start nginx

# Optional: wait a few seconds to ensure it starts
sleep 2

# Log status for debugging
sudo systemctl status nginx | tee /tmp/nginx-status.log

# Explicitly exit with success
exit 0


