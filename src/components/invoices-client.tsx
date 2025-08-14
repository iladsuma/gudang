'use client';

import * as React from 'react';
import type { Checkout, Shipment } from '@/lib/types';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { Button } from '@/components/ui/button';
import { Download, Printer } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableCaption,
} from '@/components/ui/table';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion"
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { useAuth } from '@/context/auth-context';
import { getCheckoutHistory, getShipments } from '@/lib/data';
import { ArrowRight, Loader2 } from 'lucide-react';
import { Checkbox } from './ui/checkbox';
import { useToast } from '@/hooks/use-toast';

interface jsPDFWithAutoTable extends jsPDF {
  autoTable: (options: any) => jsPDF;
}

export function InvoicesClient({ batches: initialBatches }: { batches: Checkout[] }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [batches, setBatches] = React.useState(initialBatches);
  const [allShipments, setAllShipments] = React.useState<Shipment[]>([]);
  const [selectedBatches, setSelectedBatches] = React.useState<string[]>([]);
  const [isProcessing, setIsProcessing] = React.useState(false);


  React.useEffect(() => {
    // Fetch fresh data on client mount to ensure it's up to date
    getCheckoutHistory().then(setBatches);
    getShipments().then(setAllShipments);
  }, []);
  
  React.useEffect(() => {
    setBatches(initialBatches);
  }, [initialBatches]);
  
  const formatRupiah = (number: number) => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
    }).format(number);
  };
  
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedBatches(batches.map((b) => b.id));
    } else {
      setSelectedBatches([]);
    }
  };

  const handleSelectSingle = (batchId: string, checked: boolean) => {
    if (checked) {
      setSelectedBatches((prev) => [...prev, batchId]);
    } else {
      setSelectedBatches((prev) => prev.filter((id) => id !== batchId));
    }
  };


  const generateCombinedInvoice = async (batchesToProcess: Checkout[]) => {
    if (batchesToProcess.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Tidak Ada Batch Terpilih',
        description: 'Pilih setidaknya satu batch untuk diproses.'
      });
      return;
    }

    setIsProcessing(true);
    
    try {
        const doc = new jsPDF() as jsPDFWithAutoTable;
        
        // 1. Get all shipment IDs from all selected batches
        const allShipmentIdsInBatches = batchesToProcess.flatMap(
            batch => batch.processedShipments?.map(ps => ps.shipmentId) || []
        );

        // 2. Get full shipment details for the batch
        const shipmentDetails = allShipments.filter(s => 
            allShipmentIdsInBatches.includes(s.id)
        );

        if (shipmentDetails.length === 0) {
          toast({ variant: 'destructive', title: 'Kesalahan', description: 'Detail pengiriman untuk batch yang dipilih tidak ditemukan.'});
          return;
        }

        // 3. Aggregate all products from all shipments in the batch
        const allProducts = shipmentDetails.flatMap(s => s.products);
        
        const totalAmount = batchesToProcess.reduce((sum, batch) => sum + batch.totalBatchAmount, 0);


        // --- PDF Generation ---
        const pageHeight = doc.internal.pageSize.height || doc.internal.pageSize.get('height');
        const pageWidth = doc.internal.pageSize.width || doc.internal.pageSize.get('width');

        doc.setFont('helvetica');
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text('FAKTUR GABUNGAN', 14, 20);

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text('GudangCheckout', 14, 26);
        
        const infoX = pageWidth - 90;
        doc.text(`No. Referensi`, infoX, 20);
        const batchIds = batchesToProcess.map(b => b.id.substring(b.id.length-4)).join(', ');
        doc.text(`: #${batchIds}`, infoX + 25, 20);
        
        doc.text(`Tgl. Dibuat`, infoX, 25);
        doc.text(`: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, infoX + 25, 25);

        doc.text(`Kasir`, infoX, 30);
        doc.text(`: ${user?.name || '-'}`, infoX + 25, 30);

        // Table data
        const tableData = allProducts.map((item, index) => {
           const subtotal = item.price * item.quantity * (1 - (item.discount || 0) / 100);
           return [
            index + 1,
            item.name,
            `${item.quantity}`,
            'PCS',
            item.price.toLocaleString('id-ID'),
            `${item.discount || 0}%`,
            subtotal.toLocaleString('id-ID'),
           ]
        });

        doc.autoTable({
          head: [['No.', 'Nama Item', 'Jml', 'Satuan', 'Harga', 'Diskon', 'Total']],
          body: tableData,
          startY: 45,
          headStyles: { fillColor: [34, 197, 94] },
          theme: 'grid',
          columnStyles: {
            0: { cellWidth: 10, halign: 'center' },
            2: { cellWidth: 15, halign: 'center' },
            3: { cellWidth: 15, halign: 'center' },
            4: { halign: 'right' },
            5: { halign: 'right' },
            6: { halign: 'right' },
          }
        });

        const finalY = doc.autoTable.previous.finalY;

        // Footer
        const footerY = finalY + 10;
        doc.setFontSize(10);

        const summaryX = pageWidth - 80;
        doc.setFont('helvetica', 'bold');
        doc.text(`Total Akhir`, summaryX, footerY + 5);
        doc.text(`: ${formatRupiah(totalAmount)}`, summaryX + 25, footerY + 5);
        doc.setFont('helvetica', 'normal');

        const signatureY = pageHeight - 40;
        doc.text('Hormat Kami', 20, signatureY);
        doc.text('Penerima', 150, signatureY);
        doc.text('(..................)', 14, signatureY + 20);
        doc.text('(..................)', 144, signatureY + 20);

        doc.save(`faktur-gabungan-${Date.now()}.pdf`);
        setSelectedBatches([]);
    } catch (error) {
        console.error("Failed to generate invoice", error);
        toast({ variant: 'destructive', title: 'Gagal', description: 'Terjadi kesalahan saat membuat PDF.' });
    } finally {
        setIsProcessing(false);
    }
  };

  return (
    <div className='space-y-4'>
       <div className="flex justify-end gap-2">
        <Button onClick={() => generateCombinedInvoice(batches.filter(b => selectedBatches.includes(b.id)))} disabled={selectedBatches.length === 0 || isProcessing}>
            {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Printer className="mr-2 h-4 w-4" />}
            Cetak Faktur Terpilih ({selectedBatches.length})
        </Button>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">
                  <Checkbox
                      checked={batches.length > 0 && selectedBatches.length === batches.length}
                      onCheckedChange={handleSelectAll}
                      aria-label="Pilih semua"
                  />
              </TableHead>
              <TableHead>Detail Batch</TableHead>
              <TableHead>User Pemroses</TableHead>
              <TableHead>Tanggal Diproses</TableHead>
              <TableHead className="text-right">Total Nilai</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {batches.length > 0 ? (
              batches.map((batch) => (
                <TableRow key={batch.id} data-state={selectedBatches.includes(batch.id) ? "selected" : undefined}>
                   <TableCell>
                      <Checkbox
                        checked={selectedBatches.includes(batch.id)}
                        onCheckedChange={(checked) => handleSelectSingle(batch.id, !!checked)}
                        aria-label={`Pilih batch ${batch.id}`}
                      />
                  </TableCell>
                  <TableCell className="font-medium">
                    <Accordion type="single" collapsible className="w-full">
                          <AccordionItem value="item-1" className='border-b-0'>
                              <AccordionTrigger className='py-0 font-normal hover:no-underline'>
                                  {(batch.processedShipments && batch.processedShipments.length > 0) 
                                      ? `${batch.processedShipments.length} pengiriman`
                                      : 'Detail tidak tersedia'
                                  }
                              </AccordionTrigger>
                              <AccordionContent className='pt-2'>
                                <div className='flex flex-col gap-1 text-xs text-muted-foreground'>
                                  {batch.processedShipments && batch.processedShipments.map(shipment => (
                                      <div key={shipment.transactionId} className='flex items-center gap-2'>
                                          <ArrowRight className='h-3 w-3'/>
                                          <span>{shipment.transactionId} ({formatRupiah(shipment.totalAmount)})</span>
                                      </div>
                                  ))}
                                </div>
                              </AccordionContent>
                          </AccordionItem>
                      </Accordion>
                  </TableCell>
                  <TableCell>{batch.processorName}</TableCell>
                  <TableCell>{format(new Date(batch.createdAt), 'PPpp', { locale: id })}</TableCell>
                  <TableCell className="text-right font-medium">{formatRupiah(batch.totalBatchAmount)}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" onClick={() => generateCombinedInvoice([batch])} disabled={isProcessing}>
                      <Download className="mr-2 h-4 w-4" />
                      Buat Faktur
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  Tidak ada batch yang telah diproses untuk dibuatkan faktur.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
          {batches.length > 0 && <TableCaption>Daftar batch pemrosesan yang siap dibuatkan faktur.</TableCaption>}
        </Table>
      </div>
    </div>
  );
}
