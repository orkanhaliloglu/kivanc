# Ritim — Uyku & Antrenman Takvimi (React)

Ritim, sporcular ve antrenörler için geliştirilmiş kişisel uyku, antrenman ve ders takip uygulamasıdır.

## Özellikler

- **Aylık Takvim ve Ritim**: 42 günlük takvim matrisi, uyku hedefi (21:30) göstergesi, antrenman tamamlama durumu ve seriler (🔥).
- **Kıvanç'ın Güncel Antrenman Programı**:
  - **Pazartesi & Perşembe (Üst Vücut + Core)**: 90 sn ip atlama, Cabukluluk ve sıçrama, Geniş kol şınav (10X2), Dar kol şınav (8X2), Arka kol (10X2), Barfiks (3X2), Üst karın (25 sn), Yan karın (25 sn), Alt karın (25 sn), Plank 1 (20 sn), Plank 2 (20 sn), Plank 3 (20 sn), Flaxbility ve mobilitiy.
  - **Salı & Cuma (Denge + Alt Vücut)**: 90 sn ip atlama, Denge ve koordinasyon, Kalça (10X2), On bacak [quadriceps] (10X2), Arka bacak [hamstring] (10X2), Calf (10X2), Plank 1 (20 sn), Plank 2 (20 sn), Plank 3 (20 sn), Flaxbility ve mobilitiy.
  - **Çarşamba**: Flaxbility ve mobilitiy.
  - **Hafta sonu**: Dinlenme günü.
- **Kişisel Program Düzenleyici**: Sporcuların haftalık antrenmanlarını gün gün özelleştirebilmesi, hareket ekleyip çıkarabilmesi veya dinlenme günü yapabilmesi.
- **Antrenör Yönetim Paneli**: Sporcu kullanıcı oluşturma, sporcu listesi inceleme, sporcu şifrelerini güncelleme ve sporcuların antrenman programlarını düzenleme.
- **Antrenörle Paylaş**: Haftalık özeti panoya kopyalama, metin dosyası indirme, tek tıkla HTML antrenör raporu oluşturma ve yazdırma/PDF desteği.
- **Ders & Günlük Notlar**: Günlük ders başlığı ve çalışma notları, enerji/uyku durumu notları.

## Teknoloji Altyapısı

- React 19 + TypeScript
- Vite
- Supabase (Kimlik doğrulama, `profiles`, `daily_records`, `user_workout_plans`, `ritim-avatars`)
- DM Sans & Manrope tipografisi
