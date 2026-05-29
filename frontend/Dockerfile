FROM node:20-slim

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install

COPY . .

# VITE_API_URL is baked at build time; compose passes it as a build arg.
ARG VITE_API_URL=http://127.0.0.1:8000
ARG VITE_CLERK_PUBLISHABLE_KEY
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_CLERK_PUBLISHABLE_KEY=$VITE_CLERK_PUBLISHABLE_KEY
RUN npm run build

EXPOSE 5173
# Serve the production build; --host so it's reachable outside the container
CMD ["npx", "vite", "preview", "--host", "0.0.0.0", "--port", "5173"]
