'use server';

import { FONNTE_TOKEN, ADMIN_PHONE } from './secrets';

/**
 * Membersihkan dan memformat nomor telepon ke format internasional (62...)
 */
const formatPhoneNumber = (phone: string | null | undefined) => {
  if (!phone || phone === 'N/A' || phone.trim() === '') return null;
  
  // Ambil hanya angka
  let cleaned = phone.replace(/\D/g, '');
  
  if (cleaned.length < 9) return null;

  // Ubah 08... ke 628...
  if (cleaned.startsWith('0')) {
    cleaned = '62' + cleaned.substring(1);
  } else if (cleaned.startsWith('8')) {
    cleaned = '62' + cleaned;
  }

  return cleaned;
};

/**
 * Fungsi inti untuk mengirim pesan WhatsApp menggunakan API Fonnte.
 * Diimplementasikan sebagai Server Action agar identik dengan cURL PHP dan aman dari CORS.
 */
export async function sendWhatsApp(target: string, message: string) {
  if (!FONNTE_TOKEN) {
    console.warn("WA Skip: Token Fonnte belum dikonfigurasi.");
    return { success: false, message: "Token missing" };
  }

  const formattedTarget = formatPhoneNumber(target);
  if (!formattedTarget) {
    return { success: false, message: "Invalid target number" };
  }

  console.log(`[WA] Mengirim ke ${formattedTarget}...`);

  try {
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
    console.log(`[WA] Respon API Fonnte untuk ${formattedTarget}:`, result);
    return result;
  } catch (error) {
    console.error("[WA] Fatal error saat mengirim pesan:", error);
    return { success: false, error };
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
 * Notifikasi Pesanan Baru (Laporan Otomatis ke Admin dan Pelanggan)
 */
export async function sendNewOrderNotification(shipment: any, customer: any) {
    const remaining = shipment.totalAmount - (shipment.downPayment || 0);
    
    const messageContent = `👗 *PESANAN BARU*
No: ${shipment.transactionId}
Pelanggan: ${customer.name}
Total: ${formatRupiahText(shipment.totalAmount)}
DP: ${formatRupiahText(shipment.downPayment || 0)}
Sisa: ${formatRupiahText(remaining)}`;

    // 1. Kirim Laporan ke Admin (Fixed & Sederhana)
    if (ADMIN_PHONE) {
        await sendWhatsApp(ADMIN_PHONE, `📢 *LAPORAN BUTIK*\n${messageContent}`);
    }

    // 2. Kirim Notifikasi ke Pelanggan (Jika ada nomor valid)
    if (customer.phone && customer.phone !== 'N/A') {
        const welcomeMsg = `Halo ${customer.name}, terima kasih telah memesan di Butik Anita!\n\n${messageContent}`;
        await sendWhatsApp(customer.phone, welcomeMsg);
    }
}

/**
 * Notifikasi Pesanan Selesai (Saat ditandai Selesai oleh Penjahit)
 */
export async function sendOrderFinishedNotification(shipment: any, customer: any) {
    const remaining = shipment.totalAmount - (shipment.downPayment || 0);
    
    const messageContent = `✅ *PESANAN SELESAI*
Halo *${customer.name}*, baju Anda (*${shipment.transactionId}*) sudah selesai dijahit dan siap diambil.
Sisa Pelunasan: ${formatRupiahText(remaining)}`;

    // 1. Laporan ke Admin
    if (ADMIN_PHONE) {
        await sendWhatsApp(ADMIN_PHONE, `📢 *INFO SELESAI*\n${messageContent}`);
    }

    // 2. Kabar ke Pelanggan
    if (customer.phone && customer.phone !== 'N/A') {
        const fullMsg = `${messageContent}\n\nSilakan kunjungi Butik Anita untuk pengambilan. Terima kasih!`;
        await sendWhatsApp(customer.phone, fullMsg);
    }
}
