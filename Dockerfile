FROM node:22-alpine

WORKDIR /app

COPY . .

RUN npm install

RUN npx prisma generate || true

RUN npm run build

EXPOSE 8080

CMD ["npm", "start"]