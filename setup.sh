#!/bin/bash
# ============================================================
# GÖCEK BOT TAKSİ — Proje Kurulum Scripti
# Çalıştır: chmod +x setup.sh && ./setup.sh
# ============================================================

set -e  # Hata olursa dur

BLUE='\033[0;34m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}"
echo "  ⚓  GÖCEK BOT TAKSİ — Proje Kurulumu"
echo "======================================${NC}"
echo ""

# 1. Node.js versiyon kontrolü
echo -e "${YELLOW}▸ Node.js sürümü kontrol ediliyor...${NC}"
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 20 ]; then
  echo "❌ Node.js 20+ gerekli. Mevcut: $(node -v)"
  echo "   https://nodejs.org adresinden güncelleyin."
  exit 1
fi
echo -e "${GREEN}✓ Node.js $(node -v)${NC}"

# 2. Supabase CLI kontrol
echo -e "${YELLOW}▸ Supabase CLI kontrol ediliyor...${NC}"
if ! command -v supabase &> /dev/null; then
  echo "⚠ Supabase CLI bulunamadı. Kuruluyor..."
  brew install supabase/tap/supabase || npm install -g supabase
fi
echo -e "${GREEN}✓ Supabase CLI hazır${NC}"

# 3. Bağımlılıkları yükle
echo -e "${YELLOW}▸ npm bağımlılıkları yükleniyor...${NC}"
npm install
echo -e "${GREEN}✓ Bağımlılıklar yüklendi${NC}"

# 4. .env.local dosyalarını oluştur
echo -e "${YELLOW}▸ Ortam değişken dosyaları oluşturuluyor...${NC}"
for app in web captain dispatcher; do
  if [ ! -f "apps/$app/.env.local" ]; then
    cp "apps/$app/.env.example" "apps/$app/.env.local" 2>/dev/null || true
    echo "  → apps/$app/.env.local oluşturuldu"
  else
    echo "  → apps/$app/.env.local zaten mevcut, atlandı"
  fi
done
echo -e "${GREEN}✓ Ortam dosyaları hazır${NC}"

# 5. Supabase local başlat
echo -e "${YELLOW}▸ Supabase local ortam başlatılıyor...${NC}"
echo "  (Docker Desktop çalışıyor olmalı)"
supabase start || echo "⚠ Supabase local başlatılamadı — Docker çalışıyor mu?"

# 6. Migration çalıştır
echo -e "${YELLOW}▸ Veritabanı migration çalıştırılıyor...${NC}"
supabase db push || echo "⚠ Migration çalıştırılamadı — önce supabase start'ı tamamlayın"

# 7. TypeScript tiplerini üret
echo -e "${YELLOW}▸ Supabase TypeScript tipleri üretiliyor...${NC}"
supabase gen types typescript --local > packages/db/src/database.types.ts && \
  echo -e "${GREEN}✓ Tipler üretildi${NC}" || \
  echo "⚠ Tip üretimi başarısız — Supabase local çalışıyor mu?"

echo ""
echo -e "${GREEN}============================================"
echo "  ✅  Kurulum tamamlandı!"
echo "============================================${NC}"
echo ""
echo -e "Geliştirmeyi başlatmak için:"
echo -e "  ${BLUE}npm run dev${NC}              → tüm uygulamaları başlatır"
echo -e "  ${BLUE}npm run dev:web${NC}          → sadece müşteri arayüzü (:3000)"
echo -e "  ${BLUE}npm run dev:captain${NC}      → kaptan paneli (:3001)"
echo -e "  ${BLUE}npm run dev:dispatcher${NC}   → dispatcher paneli (:3002)"
echo ""
echo -e "⚠  ${YELLOW}Unutma: .env.local dosyalarını gerçek API anahtarlarınla doldur!${NC}"
echo ""
