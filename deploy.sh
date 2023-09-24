ssh -i ~/.ssh/techx-general.pem ubuntu@3.92.255.125 << EOF # replace ~/.ssh/techx-general.pem with the path to your SSH key
    cd ~/qstack;
    git pull;
    cd client;
    yarn build;
    sudo systemctl restart ballot-v2;
EOF