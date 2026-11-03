# Salinan konfigurasi environment lokal
cp .env.example .env.local
# Edit .env.local, set MONGODB_URI menggunakan Atlas URI
nvm use
npm install
npm run dev
# Di terminal lain:
npm test
npm run test:postman
