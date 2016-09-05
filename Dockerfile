FROM node:6
MAINTAINER hey@vito.io

ENV LANG en_US.UTF-8
ENV LANGUAGE en_US:en
ENV LC_ALL en_US.UTF-8
ENV APP_HOME /app

RUN apt-get update -qq && apt-get install -y \
    git-core \
    locales \
&& rm -rf /var/lib/apt/lists/*

RUN locale-gen en_US.UTF-8

RUN mkdir $APP_HOME
WORKDIR $APP_HOME

ADD package.json $APP_HOME

RUN npm install

COPY . $APP_HOME

EXPOSE 2708
CMD [ "node", "/app/src/index.js" ]
