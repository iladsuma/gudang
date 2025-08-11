'use server';

/**
 * @fileOverview An AI agent to ingest transaction data from a photo of a transaction code or receipt.
 *
 * - ingestTransactionData - A function that handles the transaction data ingestion process.
 * - IngestTransactionDataInput - The input type for the ingestTransactionData function.
 * - IngestTransactionDataOutput - The return type for the ingestTransactionData function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const IngestTransactionDataInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of a transaction code or receipt, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type IngestTransactionDataInput = z.infer<typeof IngestTransactionDataInputSchema>;

const IngestTransactionDataOutputSchema = z.object({
  transactionData: z.record(z.string(), z.any()).describe('The extracted transaction data as a key-value record.'),
});
export type IngestTransactionDataOutput = z.infer<typeof IngestTransactionDataOutputSchema>;

export async function ingestTransactionData(input: IngestTransactionDataInput): Promise<IngestTransactionDataOutput> {
  return ingestTransactionDataFlow(input);
}

const prompt = ai.definePrompt({
  name: 'ingestTransactionDataPrompt',
  input: {schema: IngestTransactionDataInputSchema},
  output: {schema: IngestTransactionDataOutputSchema},
  prompt: `You are an expert data extraction specialist.  Your job is to extract data from transaction documents.

  The user will provide a photo of the transaction.  Extract all relevant data from the transaction and return it as a JSON object.

  Here is the photo: {{media url=photoDataUri}}
  `,
});

const ingestTransactionDataFlow = ai.defineFlow(
  {
    name: 'ingestTransactionDataFlow',
    inputSchema: IngestTransactionDataInputSchema,
    outputSchema: IngestTransactionDataOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
