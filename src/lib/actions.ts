'use server';

import { z } from 'zod';
import { addShipment, deleteShipment, processAndAddToHistory } from '@/lib/data';
import { revalidatePath } from 'next/cache';
import type { Checkout, Shipment } from '@/lib/types';

const shipmentProductSchema = z.object({
  name: z.string().min(1, 'Nama produk harus diisi'),
  quantity: z.coerce.number().int().min(1, 'Kuantitas min 1'),
});

const shipmentFormSchema = z.object({
  user: z.string().min(1, 'User harus diisi'),
  transactionId: z.string().min(1, 'No. Transaksi harus diisi'),
  expedition: z.string().min(1, 'Nama ekspedisi harus diisi'),
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
        const newShipment = await addShipment(parsed.data);
        revalidatePath('/shipments');
        return { success: true, message: 'Data pengiriman berhasil ditambahkan.', data: newShipment };
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

export async function handleProcessShipments(shipmentIds: string[]) {
    try {
        const newHistoryItems = await processAndAddToHistory(shipmentIds);
        if (newHistoryItems.length === 0 && shipmentIds.length > 0) {
           return { success: true, message: 'Pengiriman sudah pernah diproses sebelumnya.' };
        }
        revalidatePath('/shipments');
        revalidatePath('/history');
        revalidatePath('/invoices');
        return { success: true, message: 'Pengiriman berhasil diproses dan ditambahkan ke riwayat.' };
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Terjadi kesalahan saat memproses pengiriman.';
        return { success: false, message };
    }
}

    