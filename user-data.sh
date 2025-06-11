#!/bin/bash
yum update -y
yum install -y docker
service docker start
usermod -a -G docker ec2-user
yum install -y git
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-linux-x86_64" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose
