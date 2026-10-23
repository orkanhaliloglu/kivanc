# Ritim: Supabase kurulumu

Bu sürüm Supabase Auth ile e-posta/şifre girişi, kullanıcıya özel günlük kayıtlar, yönetici paneli ve düzenlenebilir antrenman planları kullanır.

## Mevcut proje kurulumu

- Supabase projesi: `ritim-tracker` (`wqbysotxdyynxmjbbhkk`, Central EU).
- `supabase/schema.sql` çalıştırıldı. `profiles`, `daily_records`, `workout_plans`, RLS politikaları ve hafta içi antrenman planları kuruldu.
- İlk kullanıcı Supabase Authentication'da oluşturuldu ve `profiles.role` değeri `admin` olarak ayarlandı.
- `admin-create-user` Edge Function Supabase Dashboard üzerinden dağıtıldı. Kaynak kodu `supabase/functions/admin-create-user/index.ts` dosyasında tutulur. Bu fonksiyon çağıranın oturumunu ve admin rolünü doğrular; `service_role` anahtarı yalnızca sunucu tarafında kullanılır.
- `config.js` içinde proje URL'si ve tarayıcı için güvenli publishable anahtar ayarlı. `service_role` anahtarını buraya veya Git'e koyma.

## Kalan yayın adımları

1. Git'teki uygulama değişikliklerini `main` dalına gönder. Vercel projesi bu depoya bağlıysa yeni dağıtımı otomatik başlatır.
2. Yeni dağıtımda yönetici hesabıyla giriş yap. Yönetim panelinden bir sporcu hesabı oluştur; bu işlem dağıtılmış `admin-create-user` fonksiyonunu kullanır.
3. Eski tarayıcıdaki yerel kayıtları taşımak için aynı tarayıcıda ve aynı site adresinde yönetim panelindeki aktarım düğmesini kullan. Aktarım, mevcut tarihlerdeki bulut kayıtlarını ezmez.

Genel kullanıcı kaydı Supabase Authentication > Sign In / Providers > **Allow new users to sign up** ayarından kapatıldı. Yeni hesapları yalnızca admin oluşturabilir.
