'use server';

import { z } from 'zod';
import { ingestTransactionData } from '@/ai/flows/ingest-transaction-data';
import { addCheckout, addOrUpdateProduct, getProducts, addShipment, deleteShipment, deleteProduct, getShipments } from '@/lib/data';
import { revalidatePath } from 'next/cache';
import type { Product } from './types';

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
    const newTransaction = await addCheckout(parsed.data);
    revalidatePath('/history');
    revalidatePath('/');
    revalidatePath('/products');
    return { success: true, message: 'Checkout berhasil!', data: newTransaction };
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
  expedition: z.string().min(1, 'Ekspedisi harus diisi'),
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
        revalidatePath('/'); // Revalidate checkout page as products might have changed
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
        revalidatePath('/');
        return { success: true, message: 'Produk berhasil dihapus.' };
    } catch (error) {
        return { success: false, message: 'Gagal menghapus produk.' };
    }
}
