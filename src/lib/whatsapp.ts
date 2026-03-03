'use server';

import { FONNTE_TOKEN, ADMIN_PHONE } from './secrets';

/**
 * Membersihkan dan memformat nomor telepon ke format internasional (62...)
 */
const formatPhoneNumber = (phone: string | null | undefined) => {
  if (!phone || phone === 'N/A' || phone.trim() === '') return null;
  
  let cleaned = phone.replace(/\D/g, '');
  if (cleaned.length < 9) return null;

  if (cleaned.startsWith('0')) {
    cleaned = '62' + cleaned.substring(1);
  } else if (cleaned.startsWith('8')) {
    cleaned = '62' + cleaned;
  }

  return cleaned;
};

/**
 * Fungsi inti untuk mengirim pesan WhatsApp menggunakan API Fonnte.
 * Menggunakan URLSearchParams untuk stabilitas maksimal di sisi server.
 */
export async function sendWhatsApp(target: string, message: string) {
  if (!FONNTE_TOKEN) {
    return { success: false, message: "Token Fonnte belum diisi di secrets.ts" };
  }

  const formattedTarget = formatPhoneNumber(target);
  if (!formattedTarget) {
    return { success: false, message: "Nomor target tidak valid" };
  }

  try {
    // Menggunakan URLSearchParams agar identik dengan pengiriman form standar
    const params = new URLSearchParams();
    params.append('target', formattedTarget);
    params.append('message', message);
    params.append('countryCode', '62');

    const response = await fetch('https://api.fonnte.com/send', {
      method: 'POST',
      headers: {
        'Authorization': FONNTE_TOKEN,
      },
      body: params,
    });

    const result = await response.json();
    
    // Log di terminal server untuk debugging mendalam
    console.log(`[WA Server] Kirim ke ${formattedTarget}:`, result);
    
    return result; 
  } catch (error) {
    console.error("[WA Server] Fatal error:", error);
    return { success: false, error: String(error) };
  }
}

/**
 * Notifikasi Pesanan Baru (Fixed ke Admin)
 */
export async function sendNewOrderNotification(shipment: any, customer: any) {
    const formatRupiah = (n: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);
    
    const messageContent = `👗 *PESANAN BARU MASUK*
No: ${shipment.transactionId}
Nama: ${customer.name}
Total: ${formatRupiah(shipment.totalAmount)}
DP: ${formatRupiah(shipment.downPayment || 0)}
Sisa: ${formatRupiah(shipment.totalAmount - (shipment.downPayment || 0))}`;

    // 1. Laporan Wajib ke Admin
    const adminResult = await sendWhatsApp(ADMIN_PHONE, messageContent);

    // 2. Notifikasi ke Pelanggan (Hanya jika ada nomor valid)
    let customerResult = null;
    const custPhone = formatPhoneNumber(customer.phone);
    if (custPhone) {
        const welcomeMsg = `Halo ${customer.name}, pesanan Anda (${shipment.transactionId}) telah kami terima. Terima kasih!`;
        customerResult = await sendWhatsApp(custPhone, welcomeMsg);
    }

    return { adminResult, customerResult };
}

/**
 * Notifikasi Pesanan Selesai
 */
export async function sendOrderFinishedNotification(shipment: any, customer: any) {
    const formatRupiah = (n: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);
    
    const messageContent = `✅ *JAHITAN SELESAI*
No: ${shipment.transactionId}
Nama: ${customer.name} sudah selesai dan siap diambil.
Sisa: ${formatRupiah(shipment.totalAmount - (shipment.downPayment || 0))}`;

    // 1. Laporan ke Admin
    const adminResult = await sendWhatsApp(ADMIN_PHONE, messageContent);

    // 2. Kabar ke Pelanggan
    let customerResult = null;
    const custPhone = formatPhoneNumber(customer.phone);
    if (custPhone) {
        const fullMsg = `Halo ${customer.name}, baju Anda (${shipment.transactionId}) sudah selesai dijahit dan siap diambil. Silakan mampir ke Butik Anita.`;
        customerResult = await sendWhatsApp(custPhone, fullMsg);
    }

    return { adminResult, customerResult };
}
