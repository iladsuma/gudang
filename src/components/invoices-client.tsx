'use client';

import * as React from 'react';
import type { Checkout, Shipment } from '@/lib/types';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
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
import { ArrowRight } from 'lucide-react';

interface jsPDFWithAutoTable extends jsPDF {
  autoTable: (options: any) => jsPDF;
}

export function InvoicesClient({ batches: initialBatches }: { batches: Checkout[] }) {
  const { user } = useAuth();
  const [batches, setBatches] = React.useState(initialBatches);
  const [allShipments, setAllShipments] = React.useState<Shipment[]>([]);

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

  const handleCreateInvoice = async (batch: Checkout) => {
    const doc = new jsPDF() as jsPDFWithAutoTable;
    
    // 1. Get full shipment details for the batch
    const shipmentDetails = allShipments.filter(s => 
      batch.processedShipments.some(ps => ps.shipmentId === s.id)
    );

    if (shipmentDetails.length === 0) {
      alert("Detail pengiriman untuk batch ini tidak ditemukan.");
      return;
    }

    // 2. Aggregate all products from all shipments in the batch
    const allProducts = shipmentDetails.flatMap(s => s.products);


    // --- PDF Generation ---
    const pageHeight = doc.internal.pageSize.height || doc.internal.pageSize.get('height');
    const pageWidth = doc.internal.pageSize.width || doc.internal.pageSize.get('width');

    doc.setFont('helvetica');
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('FAKTUR GABUNGAN (BATCH)', 14, 20);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('GudangCheckout', 14, 26);
    doc.text('Jl. Raya Aplikasi No. 1, Jakarta', 14, 31);
    
    const infoX = pageWidth - 90;
    doc.text(`No. Batch`, infoX, 20);
    doc.text(`: ${batch.id}`, infoX + 25, 20);
    
    doc.text(`Tgl. Dibuat`, infoX, 25);
    doc.text(`: ${format(new Date(batch.createdAt), 'dd/MM/yyyy HH:mm')}`, infoX + 25, 25);

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
    doc.text(`: ${formatRupiah(batch.totalBatchAmount)}`, summaryX + 25, footerY + 5);
    doc.setFont('helvetica', 'normal');

    const signatureY = pageHeight - 40;
    doc.text('Hormat Kami', 20, signatureY);
    doc.text('Penerima', 150, signatureY);
    doc.text('(..................)', 14, signatureY + 20);
    doc.text('(..................)', 144, signatureY + 20);

    doc.save(`faktur-batch-${batch.id}.pdf`);
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Detail Batch</TableHead>
            <TableHead>User Pemroses</TableHead>
            <TableHead>Tanggal Diproses</TableHead>
            <TableHead className="text-right">Total Nilai Batch</TableHead>
            <TableHead className="text-right">Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {batches.length > 0 ? (
            batches.map((batch) => (
              <TableRow key={batch.id}>
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
                  <Button variant="outline" size="sm" onClick={() => handleCreateInvoice(batch)}>
                    <Download className="mr-2 h-4 w-4" />
                    Buat Faktur Batch
                  </Button>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={5} className="h-24 text-center">
                Tidak ada batch yang telah diproses untuk dibuatkan faktur.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
        {batches.length > 0 && <TableCaption>Daftar batch pemrosesan yang siap dibuatkan faktur gabungan.</TableCaption>}
      </Table>
    </div>
  );
}
