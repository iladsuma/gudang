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
  quantity: z.coerce.number().min(1, 'Quantity must be at least 1'),
});

const checkoutFormSchema = z.object({
  customerName: z.string().min(1, 'Customer name is required'),
  items: z.array(checkoutItemSchema).min(1, 'At least one item is required for checkout'),
});

export async function handleCheckout(formData: unknown) {
  const parsed = checkoutFormSchema.safeParse(formData);

  if (!parsed.success) {
    const errorMessages = parsed.error.issues.map(issue => issue.message).join(' ');
    return { success: false, message: `Invalid form data. ${errorMessages}` };
  }
  
  try {
    await addCheckout(parsed.data);
    revalidatePath('/history');
    revalidatePath('/');
    return { success: true, message: 'Checkout successful!' };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to process checkout.';
    return { success: false, message };
  }
}

export async function handleAIIngestion(photoDataUri: string) {
  if (!photoDataUri.startsWith('data:image/')) {
    return { success: false, message: 'Invalid image data URI.' };
  }
  
  try {
    const result = await ingestTransactionData({ photoDataUri });
    return { success: true, data: result.transactionData };
  } catch (error) {
    console.error('AI Ingestion Error:', error);
    return { success: false, message: 'Failed to extract data from image.' };
  }
}

const productFormSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Product name is required'),
  code: z.string().min(1, 'Product code is required'),
  stock: z.coerce.number().int().min(0, 'Stock cannot be negative'),
});

export async function handleAddOrUpdateProduct(formData: unknown) {
  const parsed = productFormSchema.safeParse(formData);
  if (!parsed.success) {
    const errorMessages = parsed.error.issues.map(issue => issue.message).join(' ');
    return { success: false, message: `Invalid form data. ${errorMessages}` };
  }
  try {
    await addOrUpdateProduct(parsed.data);
    revalidatePath('/products');
    revalidatePath('/');
    const products = await getProducts();
    return { success: true, message: `Product ${parsed.data.id ? 'updated' : 'added'}.`, products };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'An unknown error occurred.';
    return { success: false, message };
  }
}

export async function handleDeleteProduct(productId: string) {
    try {
        await deleteProduct(productId);
        revalidatePath('/products');
        revalidatePath('/');
        return { success: true, message: 'Product deleted.' };
    } catch (error) {
        return { success: false, message: 'Failed to delete product.' };
    }
}
