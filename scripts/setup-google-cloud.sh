#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🔧 MARMAR PillSight Google Cloud Setup${NC}\n"

# Check if google-credentials.json exists
if [ -f "google-credentials.json" ]; then
    echo -e "${GREEN}✅ Found google-credentials.json${NC}"
else
    echo -e "${RED}❌ google-credentials.json not found${NC}"
    echo -e "Please follow these steps to set up your Google Cloud credentials:\n"
    echo "1. Go to Google Cloud Console (https://console.cloud.google.com)"
    echo "2. Create a new project or select 'intimitymaster'"
    echo "3. Enable these APIs:"
    echo "   - Vertex AI API"
    echo "   - Speech-to-Text API"
    echo "   - Text-to-Speech API"
    echo "4. Create a service account:"
    echo "   - Go to IAM & Admin > Service Accounts"
    echo "   - Click 'Create Service Account'"
    echo "   - Name: pillsight-vertex-ai"
    echo "   - Grant these roles:"
    echo "     * Vertex AI User"
    echo "     * Cloud Speech-to-Text User"
    echo "     * Cloud Text-to-Speech User"
    echo "5. Create a key:"
    echo "   - Select JSON format"
    echo "   - Download and rename to 'google-credentials.json'"
    echo "   - Place in project root directory"
    echo -e "\n${YELLOW}After completing these steps, run this script again${NC}"
    exit 1
fi

# Check if key.json exists and is different
if [ -f "key.json" ] && ! cmp -s "key.json" "google-credentials.json"; then
    echo -e "${YELLOW}⚠️ Found different key.json file${NC}"
    echo -e "Would you like to:"
    echo "1. Replace key.json with google-credentials.json"
    echo "2. Keep both files"
    echo "3. Exit"
    read -p "Choose (1-3): " choice
    
    case $choice in
        1)
            cp google-credentials.json key.json
            echo -e "${GREEN}✅ Replaced key.json with google-credentials.json${NC}"
            ;;
        2)
            echo -e "${YELLOW}ℹ️ Keeping both files${NC}"
            ;;
        3)
            echo "Exiting..."
            exit 0
            ;;
        *)
            echo -e "${RED}Invalid choice. Exiting...${NC}"
            exit 1
            ;;
    esac
fi

# Test Google Cloud APIs
echo -e "\n${YELLOW}🔍 Testing Google Cloud APIs...${NC}"

# Make the script executable
chmod +x scripts/setup-google-cloud.sh

echo -e "\n${GREEN}✅ Setup complete!${NC}"
echo -e "You can now use Google Cloud services in MARMAR PillSight"
echo -e "To test the services, try:"
echo "1. Voice search for medications"
echo "2. Chat with the AI about medications"
echo "3. Listen to medication information" 