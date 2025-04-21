###################
# BUILD FOR LOCAL DEVELOPMENT
###################

FROM zenika/alpine-chrome:with-node AS base

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD 1
ENV PUPPETEER_EXECUTABLE_PATH /usr/bin/chromium-browser

FROM base As development

EXPOSE 3001

WORKDIR /usr/src/app

COPY --chown=chrome package*.json ./

RUN npm ci

COPY --chown=chrome . .

USER node

###################
# BUILD FOR PRODUCTION
###################

FROM base As build

WORKDIR /usr/src/app

COPY --chown=chrome package*.json ./

COPY --chown=chrome --from=development /usr/src/app/node_modules ./node_modules

COPY --chown=chrome . .

RUN npm run build

ENV NODE_ENV production

# RUN npm ci --only=production && npm cache clean --force

USER node

###################
# PRODUCTION
###################

FROM base As production

COPY --chown=chrome --from=build /usr/src/app/node_modules ./node_modules
COPY --chown=chrome --from=build /usr/src/app/dist ./dist
COPY --chown=chrome --from=build /usr/src/app/views ./views
COPY --chown=chrome --from=build /usr/src/app/public ./public

ENTRYPOINT ["tini", "--"]
CMD [ "node", "dist/main.js" ]