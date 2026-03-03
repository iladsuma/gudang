
import { FONNTE_TOKEN, ADMIN_PHONE } from './secrets';

/**
 * Memastikan nomor telepon dalam format yang benar (hanya angka)
 */
const formatPhoneNumber = (phone: string) => {
  if (!phone) return "";
  // Hapus semua karakter selain angka
  let cleaned = phone.replace(/\D/g, '');
  // Jika dimulai dengan 08, ganti jadi 628
  if (cleaned.startsWith('08')) {
    cleaned = '62' + cleaned.substring(1);
  }
  return cleaned;
};

/**
 * Fungsi untuk mengirim pesan WhatsApp menggunakan API Fonnte.
 */
export async function sendWhatsApp(target: string, message: string) {
  if (!FONNTE_TOKEN || FONNTE_TOKEN === "YOUR_FONNTE_TOKEN_HERE") {
    console.warn("WhatsApp tidak terkirim: Token Fonnte belum dikonfigurasi.");
    return;
  }

  const formattedTarget = formatPhoneNumber(target);
  if (!formattedTarget) {
    console.error("WhatsApp tidak terkirim: Nomor target tidak valid.");
    return;
  }

  try {
    // Menggunakan FormData agar sesuai dengan perilaku array di PHP cURL
    const formData = new FormData();
    formData.append('target', formattedTarget);
    formData.append('message', message);
    formData.append('countryCode', '62');

    const response = await fetch('https://api.fonnte.com/send', {
      method: 'POST',
      headers: {
        'Authorization': FONNTE_TOKEN,
      },
      body: formData,
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Error API Fonnte:", error);
  }
}

const formatRupiahText = (number: number) => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
    }).format(number);
};

/**
 * Notifikasi untuk Pelanggan (Pesanan Baru)
 */
export const sendNewOrderNotification = (shipment: any, customer: any) => {
    const remaining = shipment.totalAmount - (shipment.downPayment || 0);
    const productList = shipment.products.map((p: any) => `- ${p.name} (x${p.quantity})`).join('\n');
    
    const message = 
`Halo *${customer.name}*, 

Terima kasih telah memesan di *Butik Anita*. Pesanan Anda telah kami catat:

📌 *No. Transaksi:* ${shipment.transactionId}
👗 *Item:*
${productList}

💰 *Total:* ${formatRupiahText(shipment.totalAmount)}
💳 *DP:* ${formatRupiahText(shipment.downPayment || 0)}
📉 *Sisa:* *${formatRupiahText(remaining)}*

Pesanan sedang dalam antrean pengerjaan. Simpan pesan ini sebagai bukti. Terima kasih! 🙏`;

    return sendWhatsApp(customer.phone, message);
};

/**
 * Notifikasi untuk Pelanggan (Pesanan Selesai)
 */
export const sendOrderFinishedNotification = (shipment: any, customer: any) => {
    const remaining = shipment.totalAmount - (shipment.downPayment || 0);
    const message = 
`Halo *${customer.name}*, 

Kabar gembira! 🎉
Jahitan Anda (*${shipment.transactionId}*) telah *SELESAI* dan siap diambil.

💰 *Sisa Pelunasan:* *${formatRupiahText(remaining)}*

Silakan kunjungi Butik Anita untuk pengambilan. 👋`;

    return sendWhatsApp(customer.phone, message);
};

/**
 * Notifikasi untuk Admin/Pemilik (Setiap ada pesanan baru)
 */
export const sendAdminOrderAlert = (shipment: any, customer: any) => {
    if (!ADMIN_PHONE) return;
    const message = `📢 *NOTIFIKASI ADMIN*\nAda pesanan baru masuk!\n\nNo: ${shipment.transactionId}\nPelanggan: ${customer.name}\nTotal: ${formatRupiahText(shipment.totalAmount)}\nDP: ${formatRupiahText(shipment.downPayment || 0)}`;
    return sendWhatsApp(ADMIN_PHONE, message);
};
