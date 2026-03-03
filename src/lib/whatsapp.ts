'use server';

import { FONNTE_TOKEN, ADMIN_PHONE } from './secrets';

/**
 * Memastikan nomor telepon dalam format yang benar (hanya angka)
 * Mengembalikan null jika nomor tidak valid
 */
const formatPhoneNumber = (phone: string | null | undefined) => {
  if (!phone) return null;
  // Hapus semua karakter selain angka
  let cleaned = phone.replace(/\D/g, '');
  
  // Jika nomor terlalu pendek atau tidak ada angka, anggap tidak valid
  if (cleaned.length < 9) return null;

  // Jika dimulai dengan 08, ganti jadi 628
  if (cleaned.startsWith('08')) {
    cleaned = '62' + cleaned.substring(1);
  }
  
  // Jika dimulai dengan 8 saja, tambahkan 62
  if (cleaned.startsWith('8') && cleaned.length >= 9 && cleaned.length <= 13) {
    cleaned = '62' + cleaned;
  }

  return cleaned;
};

/**
 * Fungsi inti untuk mengirim pesan WhatsApp menggunakan API Fonnte.
 */
export async function sendWhatsApp(target: string, message: string) {
  if (!FONNTE_TOKEN) {
    console.warn("WhatsApp tidak terkirim: Token Fonnte belum dikonfigurasi.");
    return { success: false, message: "Token missing" };
  }

  const formattedTarget = formatPhoneNumber(target);
  if (!formattedTarget) {
    // Return diam-diam jika nomor target "N/A" atau tidak valid
    return { success: false, message: "Invalid target number" };
  }

  try {
    const formData = new URLSearchParams();
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

    return await response.json();
  } catch (error) {
    console.error("Error API Fonnte:", error);
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
 * Notifikasi Pesanan Baru (Fixed ke Admin dan Pelanggan jika ada nomor)
 */
export async function sendNewOrderNotification(shipment: any, customer: any) {
    const remaining = shipment.totalAmount - (shipment.downPayment || 0);
    
    // Pesan Sederhana
    const message = 
`👗 *PESANAN BARU - BUTIK ANITA*

📌 *No:* ${shipment.transactionId}
👤 *Nama:* ${customer.name}
💰 *Total:* ${formatRupiahText(shipment.totalAmount)}
💳 *DP:* ${formatRupiahText(shipment.downPayment || 0)}
📉 *Sisa:* ${formatRupiahText(remaining)}

_Pesanan telah berhasil dicatat ke sistem._`;

    // Kirim ke Admin (Pasti)
    if (ADMIN_PHONE) {
        await sendWhatsApp(ADMIN_PHONE, `📢 *LAPORAN ADMIN*\n${message}`);
    }

    // Kirim ke Pelanggan (Jika ada nomor)
    if (customer.phone && customer.phone !== 'N/A') {
        await sendWhatsApp(customer.phone, `Halo ${customer.name}, Terima kasih sudah memesan!\n\n${message}`);
    }
}

/**
 * Notifikasi Pesanan Selesai
 */
export async function sendOrderFinishedNotification(shipment: any, customer: any) {
    const remaining = shipment.totalAmount - (shipment.downPayment || 0);
    
    const message = 
`✅ *PESANAN SELESAI - BUTIK ANITA*

Baju Anda (*${shipment.transactionId}*) atas nama *${customer.name}* sudah selesai dijahit dan siap diambil.

💰 *Sisa Bayar:* ${formatRupiahText(remaining)}

Silakan kunjungi Butik Anita untuk pengambilan. Terima kasih!`;

    // Kirim ke Admin
    if (ADMIN_PHONE) {
        await sendWhatsApp(ADMIN_PHONE, `📢 *INFO SELESAI*\n${message}`);
    }

    // Kirim ke Pelanggan
    if (customer.phone && customer.phone !== 'N/A') {
        await sendWhatsApp(customer.phone, message);
    }
}
