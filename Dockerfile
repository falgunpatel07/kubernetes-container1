FROM node:16-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Create a volume mount point
RUN mkdir -p /Falgun_PV_dir

ENV STORAGE_DIR=/Falgun_PV_dir
ENV PORT=3000
ENV CONTAINER2_URL=http://container2-service:3001

EXPOSE 3000

CMD ["node", "app.js"]