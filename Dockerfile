FROM node:22-bookworm-slim

WORKDIR /srv/lawtech

ENV NODE_ENV=production \
    PORT=3000

ENV ADMIN_EMAIL=admin@lawtech.com \
    ADMIN_PASSWORD=admin123

COPY package*.json ./
RUN npm ci --omit=dev

COPY public ./public
COPY server.js .
COPY database.js .
COPY public/data.js ./public/data.js
COPY public/main.js ./public/main.js
COPY public/styles.css ./public/styles.css

RUN mkdir -p data && chown -R node:node /srv/lawtech
USER node

EXPOSE 3000
CMD ["node", "server.js"]
