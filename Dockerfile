# Stage 1: Build TypeScript Application
# pull official base image
FROM node:20-alpine3.17 as builder

#META
LABEL version='1.0.0'
LABEL description="Image for Hyre Cargo"

#RUN mkdir -p app/node_modules && chown -R node:node app

# set working directory
WORKDIR /app

# install app dependencies
COPY package*.json ./

RUN npm install

# add app
COPY . .

# export port 5000 of the container

# compile typescript code to javascript
# Only needed for typescript code
RUN npm run build


# Stage 2: Create a clean production image
FROM node:20-slim AS production
WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev
COPY --from=builder /app/build ./build

# Stage 3: Final image with the built application
FROM node:20
WORKDIR /app
COPY --from=production /app .
CMD [ "node", "build/app.js" ]



