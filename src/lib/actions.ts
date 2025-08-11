'use server';

import { z } from 'zod';
import { ingestTransactionData } from '@/ai/flows/ingest-transaction-data';
import { addCheckout } from '@/lib/data';
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
    return { success: false, message: 'Failed to process checkout.' };
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
