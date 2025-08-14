'use server';

import { z } from 'zod';
import { addOrUpdateProduct, addShipment, deleteShipment, deleteProduct, handleCheckout as performCheckout } from '@/lib/data';
import { revalidatePath } from 'next/cache';
import type { Product, Checkout } from './types';
import { ingestTransactionData } from '@/ai/flows/ingest-transaction-data';

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

const productFormSchema = z.object({
    id: z.string().optional(),
    code: z.string().min(1, 'Kode produk harus diisi'),
    name: z.string().min(1, 'Nama produk harus diisi'),
    stock: z.coerce.number().int().min(0, 'Stok tidak boleh negatif'),
});

export async function handleAddOrUpdateProduct(formData: unknown): Promise<{success: boolean; message: string; data?: Product}> {
    const parsed = productFormSchema.safeParse(formData);
    if (!parsed.success) {
        const errorMessages = parsed.error.issues.map(issue => issue.message).join(', ');
        return { success: false, message: `Data formulir tidak valid: ${errorMessages}` };
    }
    try {
        const updatedProduct = await addOrUpdateProduct(parsed.data);
        revalidatePath('/products');
        return { success: true, message: `Produk berhasil ${parsed.data.id ? 'diperbarui' : 'ditambahkan'}.`, data: updatedProduct };
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Terjadi kesalahan yang tidak diketahui.';
        return { success: false, message };
    }
}

export async function handleDeleteProduct(productId: string) {
    try {
        await deleteProduct(productId);
        revalidatePath('/products');
        return { success: true, message: 'Produk berhasil dihapus.' };
    } catch (error) {
        return { success: false, message: 'Gagal menghapus produk.' };
    }
}

const checkoutItemSchema = z.object({
  code: z.string().min(1, 'Kode produk harus diisi'),
  name: z.string().min(1, 'Nama produk harus diisi'),
  quantity: z.coerce.number().int().min(1, 'Kuantitas minimal 1'),
  stock: z.number(),
  price: z.number(),
});

const checkoutFormSchema = z.object({
  customerName: z.string().min(1, 'Nama pelanggan harus diisi'),
  items: z.array(checkoutItemSchema).min(1, 'Harus ada minimal 1 item'),
});

export async function handleCheckout(formData: unknown) {
    const parsed = checkoutFormSchema.safeParse(formData);
    if (!parsed.success) {
        const errorMessages = parsed.error.issues.map(issue => issue.message).join(', ');
        return { success: false, message: `Data formulir tidak valid: ${errorMessages}` };
    }

    try {
        const newCheckout = await performCheckout(parsed.data);
        revalidatePath('/');
        revalidatePath('/history');
        revalidatePath('/products');
        revalidatePath('/invoices');
        return { success: true, message: 'Checkout berhasil!', data: newCheckout };
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Terjadi kesalahan yang tidak diketahui.';
        return { success: false, message };
    }
}


export async function handleScanReceipt(receiptDataUrl: string) {
  try {
    const transactionData = await ingestTransactionData({
      receipt: receiptDataUrl,
    });
    return { success: true, data: transactionData };
  } catch (error) {
    console.error('AI receipt scan failed:', error);
    const message = error instanceof Error ? error.message : 'Gagal memindai struk.';
    return { success: false, message };
  }
}
