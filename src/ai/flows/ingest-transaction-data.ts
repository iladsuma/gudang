'use server';
/**
 * @fileOverview A Genkit flow for ingesting transaction data from a receipt.
 *
 * This file defines a Genkit flow that takes a receipt image as input and
 * extracts structured transaction data from it.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

// Define the schema for a single item in the transaction.
const TransactionItemSchema = z.object({
  name: z.string().describe('The name of the item'),
  quantity: z.number().describe('The quantity of the item purchased'),
  price: z.number().describe('The price of a single unit of the item'),
});

// Define the schema for the overall transaction data.
const TransactionDataSchema = z.object({
  items: z.array(TransactionItemSchema).describe('An array of items in the transaction'),
  total: z.number().optional().describe('The total amount of the transaction'),
  tax: z.number().optional().describe('The tax amount of the transaction'),
  tip: z.number().optional().describe('The tip amount of the transaction'),
  currency: z.string().optional().describe('The currency of the transaction (e.g., USD, IDR)'),
  transactionDate: z.string().optional().describe('The date of the transaction in YYYY-MM-DD format'),
  merchantName: z.string().optional().describe('The name of the merchant'),
});
export type TransactionData = z.infer<typeof TransactionDataSchema>;

// Define the input schema for the flow, which is the receipt image.
const IngestTransactionInputSchema = z.object({
  receipt: z.string().describe(
    "A photo of a receipt, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
  ),
});
export type IngestTransactionInput = z.infer<typeof IngestTransactionInputSchema>;


/**
 * A Genkit flow that ingests transaction data from a receipt image.
 * @param input - The input object containing the receipt data URI.
 * @returns A promise that resolves to the extracted transaction data.
 */
export async function ingestTransactionData(input: IngestTransactionInput): Promise<TransactionData> {
  return ingestTransactionFlow(input);
}


// Define the Genkit prompt for extracting transaction data.
const ingestTransactionPrompt = ai.definePrompt({
  name: 'ingestTransactionPrompt',
  input: { schema: IngestTransactionInputSchema },
  output: { schema: TransactionDataSchema },
  prompt: `You are an expert receipt scanner. Extract the transaction details from the following receipt image.
  
  Receipt: {{media url=receipt}}`,
});

// Define the Genkit flow that orchestrates the data extraction.
const ingestTransactionFlow = ai.defineFlow(
  {
    name: 'ingestTransactionFlow',
    inputSchema: IngestTransactionInputSchema,
    outputSchema: TransactionDataSchema,
  },
  async (input) => {
    const { output } = await ingestTransactionPrompt(input);
    return output!;
  }
);
