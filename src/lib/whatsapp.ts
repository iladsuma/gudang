
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
 * Menggunakan URLSearchParams sesuai standar kestabilan Node.js.
 */
export async function sendWhatsApp(target: string, message: string) {
  if (!FONNTE_TOKEN) {
    console.error("[WA] Token Fonnte tidak ditemukan di .env");
    return { status: false, reason: "Token Fonnte belum dikonfigurasi" };
  }

  const formattedTarget = formatPhoneNumber(target);
  if (!formattedTarget) {
    return { status: false, reason: "Nomor target tidak valid" };
  }

  try {
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
    console.log(`[WA Server] Kirim ke ${formattedTarget}:`, JSON.stringify(result));
    return result; 
  } catch (error) {
    console.error("[WA Server] Fatal error:", error);
    return { status: false, reason: String(error) };
  }
}

/**
 * Notifikasi Pesanan Baru ke Admin
 */
export async function sendNewOrderNotification(shipment: any, customer: any) {
    const formatRupiah = (n: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);
    
    const messageContent = `👗 *PESANAN BARU*
No: ${shipment.transactionId}
Nama: ${customer.name}
Total: ${formatRupiah(shipment.totalAmount)}
DP: ${formatRupiah(shipment.downPayment || 0)}
Sisa: ${formatRupiah(shipment.totalAmount - (shipment.downPayment || 0))}`;

    // Laporan ke Admin adalah prioritas utama
    const adminResult = await sendWhatsApp(ADMIN_PHONE, messageContent);

    // Notifikasi ke Pelanggan (Hanya jika ada nomor valid)
    let customerResult = null;
    const custPhone = formatPhoneNumber(customer.phone);
    if (custPhone && custPhone !== formatPhoneNumber(ADMIN_PHONE)) {
        const welcomeMsg = `Halo ${customer.name}, pesanan baju Anda (${shipment.transactionId}) telah kami terima. Sisa tagihan: ${formatRupiah(shipment.totalAmount - (shipment.downPayment || 0))}. Terima kasih!`;
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
Nama: ${customer.name}
Status: Selesai & Siap Diambil.
Sisa Bayar: ${formatRupiah(shipment.totalAmount - (shipment.downPayment || 0))}`;

    const adminResult = await sendWhatsApp(ADMIN_PHONE, messageContent);

    let customerResult = null;
    const custPhone = formatPhoneNumber(customer.phone);
    if (custPhone && custPhone !== formatPhoneNumber(ADMIN_PHONE)) {
        const fullMsg = `Halo ${customer.name}, jahitan baju Anda (${shipment.transactionId}) sudah selesai dan siap diambil. Silakan mampir ke Butik Anita. Terima kasih!`;
        customerResult = await sendWhatsApp(custPhone, fullMsg);
    }

    return { adminResult, customerResult };
}

/**
 * Notifikasi Penugasan Penjahit
 */
export async function sendTailorAssignmentNotification(shipment: any, tailor: any) {
    if (!tailor.phone) return null;

    const itemsList = shipment.products.map((p: any) => `- ${p.name} (x${p.quantity})`).join('\n');
    
    const messageContent = `✂️ *TUGAS JAHITAN BARU*
Halo ${tailor.username}, Anda mendapatkan tugas jahitan baru.

No Pesanan: ${shipment.transactionId}
Pelanggan: ${shipment.customerName}

Daftar Item:
${itemsList}

Silakan cek menu 'Pekerjaan Saya' di aplikasi untuk detail ukuran. Semangat bekerja!`;

    return await sendWhatsApp(tailor.phone, messageContent);
}
