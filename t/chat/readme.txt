# start chat server
node char-server.js

http://localhost:8088/javascript/websocket_chat_node/frontend.html

======db
wget http://nodejs.tchol.org/repocfg/el/nodejs-stable-release.noarch.rpm
yum localinstall --nogpgcheck nodejs-stable-release.noarch.rpm

sudo yum install nodejs npm

/usr/lib/node_modules
======
Firefox 10+ (Protocol Version 13)
Chrome 14,15 (Old) (Protocol Version 8)
Chrome 16+ (Protocol Version 13)
Internet Explorer 10 (Preview) (Protocol Version 13)
Safari 6 (Protocol Version 13)

GRANT ALL PRIVILEGES  ON node_chat.* TO  'node_chat'@'localhost' IDENTIFIED BY 'node_chat'
    WITH MAX_QUERIES_PER_HOUR 0 MAX_CONNECTIONS_PER_HOUR 0 MAX_UPDATES_PER_HOUR 0 MAX_USER_CONNECTIONS 0 ;
===========
rsync -arz --delete --progress --exclude=misc /var/www/html/javascript/websocket_chat_node/ twang@icareauto.ca:/var/www/icareauto/t/chat