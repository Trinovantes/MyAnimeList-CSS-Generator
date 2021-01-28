#!/usr/bin/env sh

HOST=`cat /run/secrets/MYSQL_HOST`
USER=`cat /run/secrets/MYSQL_USER`
PASSWORD=`cat /run/secrets/MYSQL_PASSWORD`

export MYSQL_PWD=${PASSWORD}

mysqldump -h ${HOST} -u ${USER} --single-transaction --all-databases > "./backups/$(date --utc +%FT%TZ).sql"
