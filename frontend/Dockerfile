# frontend/Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3000

# Для разработки используем Vite dev server
CMD ["npm", "run", "dev", "--", "--host"]