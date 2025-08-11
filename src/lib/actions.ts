'use server';

import { z } from 'zod';
import { ingestTransactionData } from '@/ai/flows/ingest-transaction-data';
import { addCheckout, getProducts, addOrUpdateProduct, deleteProduct } from '@/lib/data';
import { revalidatePath } from 'next/cache';

const checkoutItemSchema = z.object({
  id: z.string(),
  code: z.string(),
  name: z.string(),
  stock: z.number(),
  quantity: z.coerce.number().min(1, 'Kuantitas minimal 1'),
  receiptNumber: z.string(),
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

const productFormSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Nama produk harus diisi'),
  code: z.string().min(1, 'Kode produk harus diisi'),
  stock: z.coerce.number().int().min(0, 'Stok tidak boleh negatif'),
  receiptNumber: z.string().min(1, "Nomor resi harus diisi"),
});

export async function handleAddOrUpdateProduct(formData: unknown) {
  const parsed = productFormSchema.safeParse(formData);
  if (!parsed.success) {
    const errorMessages = parsed.error.issues.map(issue => issue.message).join(' ');
    return { success: false, message: `Data formulir tidak valid. ${errorMessages}` };
  }
  try {
    await addOrUpdateProduct(parsed.data);
    revalidatePath('/products');
    revalidatePath('/');
    const products = await getProducts();
    return { success: true, message: `Produk berhasil ${parsed.data.id ? 'diperbarui' : 'ditambahkan'}.`, products };
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
