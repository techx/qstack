#!/bin/bash

# Usage: bash scripts/deploy.sh
# Description: Deploy the latest version the remote main branch.

echo "This script is not up-to-date!"
# ssh -i ~/.ssh/techx-general.pem ubuntu@3.92.255.125 << EOF # replace ~/.ssh/techx-general.pem with the path to your SSH key
#     cd ~/qstack;
#     git pull;
#     cd client;
#     npm build;
#     sudo systemctl restart qstack;
# EOF