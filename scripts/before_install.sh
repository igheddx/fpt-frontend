#!/bin/bash
#echo "Running Before Install"
#sudo apt-get update
#sudo apt-get install -y nginx
#sudo systemctl stop nginx

# echo "Running Before Install..."
# # Clean existing files
# rm -rf /var/www/html/fpt-app/*


# Dynamically get the deployment directory
DEPLOYMENT_DIR=$(pwd)  # This is the current directory where the app was unpacked

# Find the fpt-app.zip file in the deployment directory
ZIP_FILE=$(find $DEPLOYMENT_DIR -name "fpt-app.zip" -print -quit)

# Extract the zip file if it exists
if [ -n "$ZIP_FILE" ]; then
    echo "Found fpt-app.zip, extracting..."
    unzip "$ZIP_FILE" -d /var/www/html/fpt-app
    echo "Extraction complete!"
else
    echo "fpt-app.zip not found in deployment directory."
    exit 1
fi
