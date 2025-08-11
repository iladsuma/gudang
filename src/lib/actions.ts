'use server';

import { z } from 'zod';
import { ingestTransactionData } from '@/ai/flows/ingest-transaction-data';
import { addCheckout, getProducts, addShipment, deleteShipment } from '@/lib/data';
import { revalidatePath } from 'next/cache';

const checkoutItemSchema = z.object({
  id: z.string(),
  code: z.string(),
  name: z.string(),
  stock: z.number(),
  quantity: z.coerce.number().min(1, 'Kuantitas minimal 1'),
});

const checkoutFormSchema = z.object({
  customerName: z.string().min(1, 'Nama pelanggan harus diisi'),
  items: z.array(checkoutItemSchema).min(1, 'Minimal satu item diperlukan untuk checkout'),
});

export async function handleCheckout(formData: unknown) {
  const parsed = checkoutFormSchema.safeParse(formData);

  if (!parsed.success) {
    const errorMessages = parsed.error.issues.map(issue => issue.message).join(' ');
    return { success: false, message: `Data formulir tidak valid. ${errorMessages}` };
  }
  
  try {
    await addCheckout(parsed.data);
    revalidatePath('/history');
    revalidatePath('/');
    return { success: true, message: 'Checkout berhasil!' };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Gagal memproses checkout.';
    return { success: false, message };
  }
}

export async function handleAIIngestion(photoDataUri: string) {
  if (!photoDataUri.startsWith('data:image/')) {
    return { success: false, message: 'URI data gambar tidak valid.' };
  }
  
  try {
    const result = await ingestTransactionData({ photoDataUri });
    return { success: true, data: result.transactionData };
  } catch (error) {
    console.error('Kesalahan Ingest AI:', error);
    return { success: false, message: 'Gagal mengekstrak data dari gambar.' };
  }
}

const shipmentProductSchema = z.object({
  name: z.string().min(1, 'Nama produk harus diisi'),
  quantity: z.coerce.number().int().min(1, 'Kuantitas min 1'),
});

const shipmentFormSchema = z.object({
  user: z.string().min(1, 'User harus diisi'),
  transactionId: z.string().min(1, 'No. Transaksi harus diisi'),
  receipt: z.object({
      fileName: z.string().min(1, 'Nama file resi harus ada'),
      dataUrl: z.string().min(1, 'Data resi harus ada'),
  }),
  products: z.array(shipmentProductSchema).min(1, 'Minimal harus ada satu produk'),
});

export async function handleAddShipment(formData: unknown) {
    const parsed = shipmentFormSchema.safeParse(formData);
    if (!parsed.success) {
        console.error(parsed.error.issues);
        const errorMessages = parsed.error.issues.map(issue => issue.message).join(', ');
        return { success: false, message: `Data formulir tidak valid: ${errorMessages}` };
    }
    try {
        await addShipment(parsed.data);
        revalidatePath('/shipments');
        return { success: true, message: 'Data pengiriman berhasil ditambahkan.' };
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Terjadi kesalahan yang tidak diketahui.';
        return { success: false, message };
    }
}

export async function handleDeleteShipment(shipmentId: string) {
    try {
        await deleteShipment(shipmentId);
        revalidatePath('/shipments');
        return { success: true, message: 'Pengiriman berhasil dihapus.' };
    } catch (error) {
        return { success: false, message: 'Gagal menghapus pengiriman.' };
    }
}
