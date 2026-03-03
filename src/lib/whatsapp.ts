
import { FONNTE_TOKEN } from './secrets';

/**
 * Fungsi untuk mengirim pesan WhatsApp menggunakan API Fonnte.
 * @param target Nomor WhatsApp tujuan (contoh: 08123456789 atau 628123456789)
 * @param message Isi pesan yang akan dikirim
 */
export async function sendWhatsApp(target: string, message: string) {
  if (!FONNTE_TOKEN || FONNTE_TOKEN === "YOUR_FONNTE_TOKEN_HERE") {
    console.warn("WhatsApp tidak terkirim: Token Fonnte belum dikonfigurasi di src/lib/secrets.ts");
    return;
  }

  try {
    const formData = new URLSearchParams();
    formData.append('target', target);
    formData.append('message', message);
    formData.append('countryCode', '62'); // Default Indonesia

    const response = await fetch('https://api.fonnte.com/send', {
      method: 'POST',
      headers: {
        'Authorization': FONNTE_TOKEN,
      },
      body: formData,
    });

    const result = await response.json();
    if (!result.status) {
      console.error("Gagal mengirim WhatsApp:", result.reason || "Unknown error");
    }
    return result;
  } catch (error) {
    console.error("Error API Fonnte:", error);
  }
}

/**
 * Format angka ke Rupiah untuk pesan teks
 */
const formatRupiahText = (number: number) => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
    }).format(number);
};

/**
 * Template pesan untuk pesanan baru
 */
export const sendNewOrderNotification = (shipment: any, customer: any) => {
    const remaining = shipment.totalAmount - (shipment.downPayment || 0);
    const productList = shipment.products.map((p: any) => `- ${p.name} (x${p.quantity})`).join('\n');
    
    const message = 
`Halo *${customer.name}*, 

Terima kasih telah memesan di *Butik Anita*. Pesanan Anda telah kami catat dengan rincian sebagai berikut:

📌 *No. Transaksi:* ${shipment.transactionId}
👗 *Item Pesanan:*
${productList}

💰 *Total Biaya:* ${formatRupiahText(shipment.totalAmount)}
💳 *DP Masuk:* ${formatRupiahText(shipment.downPayment || 0)}
📉 *Sisa Pelunasan:* *${formatRupiahText(remaining)}*

Pesanan Anda sekarang sedang dalam antrean pengerjaan oleh tim penjahit kami. Simpan pesan ini sebagai bukti pesanan Anda.

Terima kasih! 🙏`;

    return sendWhatsApp(customer.phone, message);
};

/**
 * Template pesan untuk pesanan selesai
 */
export const sendOrderFinishedNotification = (shipment: any, customer: any) => {
    const remaining = shipment.totalAmount - (shipment.downPayment || 0);
    
    const message = 
`Halo *${customer.name}*, 

Kabar gembira! 🎉
Jahitan Anda dengan nomor transaksi *${shipment.transactionId}* telah *SELESAI* dikerjakan dan siap untuk diambil.

💰 *Sisa Pelunasan:* *${formatRupiahText(remaining)}*

Silakan kunjungi Butik Anita pada jam operasional untuk pengambilan. Sampai jumpa! 👋`;

    return sendWhatsApp(customer.phone, message);
};
