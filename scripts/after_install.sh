#!/bin/bash

DEPLOYMENT_BASE="/home/ubuntu/myDeployment"
BUILD_SOURCE="$DEPLOYMENT_BASE/build"
TARGET_DIR="/var/www/html/fpt-app"

# Ensure the deployment base directory exists
if [ ! -d "$DEPLOYMENT_BASE" ]; then
  echo "Creating deployment directory at $DEPLOYMENT_BASE..."
  mkdir -p "$DEPLOYMENT_BASE"
fi

# Ensure the target directory exists
if [ ! -d "$TARGET_DIR" ]; then
  echo "Creating target directory at $TARGET_DIR..."
  sudo mkdir -p "$TARGET_DIR"
fi

# Copy build files to the target directory
echo "Copying build files from $BUILD_SOURCE to $TARGET_DIR..."
sudo cp -r "$BUILD_SOURCE"/* "$TARGET_DIR/"

echo "Build files deployed successfully."
