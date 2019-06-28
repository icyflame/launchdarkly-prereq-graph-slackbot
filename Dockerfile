FROM node:10.16.0-alpine

RUN apk add graphviz

WORKDIR /app
COPY . ./

RUN npm i

ENTRYPOINT ["node", "index.js"]
