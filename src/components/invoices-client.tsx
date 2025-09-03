

'use client';

import * as React from 'react';
import type { Customer, Shipment } from '@/lib/types';
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
import { ArrowRight, FileDown, Loader2 } from 'lucide-react';
import { Badge } from './ui/badge';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { useToast } from '@/hooks/use-toast';
import { Button } from './ui/button';
import { Checkbox } from './ui/checkbox';
import { getUsers } from '@/lib/data';


// Extend jsPDF with autoTable, which is a plugin.
interface jsPDFWithAutoTable extends jsPDF {
  autoTable: (options: any) => jsPDF;
}


export function InvoicesClient({ shipments: initialShipments }: { shipments: Shipment[] }) {
  const [shipments, setShipments] = React.useState(initialShipments);
  const [selectedShipments, setSelectedShipments] = React.useState<string[]>([]);
  const [isPrinting, setIsPrinting] = React.useState(false);

  const { toast } = useToast();

  React.useEffect(() => {
    setShipments(initialShipments);
  }, [initialShipments]);
  
  
  const formatRupiah = (number: number) => {
    return new Intl.NumberFormat('id-ID', {
    }).format(number);
  };
  
  const getStatusVariant = (status: Shipment['status']) => {
    switch (status) {
        case 'Proses': return 'secondary';
        case 'Pengemasan': return 'default';
        case 'Terkirim': return 'outline';
        default: return 'secondary';
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if(checked) {
        setSelectedShipments(shipments.map(s => s.id));
    } else {
        setSelectedShipments([]);
    }
  }

  const handleSelectSingle = (shipmentId: string, checked: boolean) => {
    if(checked) {
        setSelectedShipments(prev => [...prev, shipmentId]);
    } else {
        setSelectedShipments(prev => prev.filter(id => id !== shipmentId));
    }
  }

  const handlePrintInvoices = async () => {
    const shipmentsToPrint = shipments.filter(s => selectedShipments.includes(s.id));
    if (shipmentsToPrint.length === 0) {
      toast({
        variant: 'destructive',
        title: "Tidak ada data terpilih",
        description: "Silakan pilih setidaknya satu pengiriman untuk dicetak."
      });
      return;
    }

    setIsPrinting(true);

    try {
      const allUsers = await getUsers();
      const doc = new jsPDF('p', 'pt', 'a4') as jsPDFWithAutoTable;
      const pageWidth = doc.internal.pageSize.getWidth();
      let isFirstPage = true;

      shipmentsToPrint.forEach(shipment => {
        if (!isFirstPage) {
          doc.addPage();
        }
        
        const user = allUsers.find(u => u.id === shipment.userId);

        // Header
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('FAKTUR PENJUALAN', 20, 30);
        
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.text("Fam's Warehouse", 20, 45);
        doc.text("Srengat", 20, 55);

        // Right side header
        const rightX = pageWidth - 20;
        doc.text(`No Transaksi : ${shipment.transactionId}`, rightX, 45, { align: 'right' });
        doc.text(`Pelanggan    : ${shipment.customerName}`, rightX, 55, { align: 'right' });
        doc.text(`Tgl    : ${format(new Date(shipment.createdAt), 'dd/MM/yyyy HH:mm')}`, rightX, 65, { align: 'right' });
        doc.text(`Kasir  : ${user ? user.username.toUpperCase() : 'N/A'}`, rightX, 75, { align: 'right' });


        // Table
        const tableColumn = ["No.", "Nama Item", "Jml Satuan", "Harga", "Diskon", "Total"];
        const tableRows: any[] = [];
        
        shipment.products.forEach((product, index) => {
            const subtotal = product.quantity * product.price;
            const productData = [
                index + 1,
                product.name,
                `${product.quantity} PCS`, // Assuming unit is PCS
                formatRupiah(product.price),
                0, // Discount is 0 for now
                formatRupiah(subtotal),
            ];
            tableRows.push(productData);
        });

        doc.autoTable({
            startY: 90,
            head: [tableColumn],
            body: tableRows,
            theme: 'striped',
            headStyles: { fillColor: [255, 255, 255], textColor: 0, lineWidth: 0.5, lineColor: [0,0,0] },
            styles: { fontSize: 8, cellPadding: 2, overflow: 'linebreak' },
            columnStyles: {
                0: { cellWidth: 25, halign: 'center' },
                1: { cellWidth: 'auto' },
                2: { cellWidth: 50, halign: 'center' },
                3: { cellWidth: 60, halign: 'right' },
                4: { cellWidth: 40, halign: 'right' },
                5: { cellWidth: 70, halign: 'right' },
            },
        });

        // Summary
        const finalY = doc.autoTable.previous.finalY;
        let summaryY = finalY + 15;
        const summaryRightX = pageWidth - 20;
        const summaryLeftX = pageWidth - 150;
        
        doc.setFontSize(9);
        doc.text('Jml Item', summaryLeftX, summaryY);
        doc.text(String(shipment.totalItems), summaryRightX, summaryY, { align: 'right' });

        summaryY += 12;
        doc.text('Sub Total', summaryLeftX, summaryY);
        doc.text(formatRupiah(shipment.totalProductCost), summaryRightX, summaryY, { align: 'right' });
        
        summaryY += 12;
        doc.text('Biaya Lain', summaryLeftX, summaryY);
        doc.text(formatRupiah(shipment.totalPackingCost), summaryRightX, summaryY, { align: 'right' });

        doc.setLineWidth(0.5);
        doc.line(summaryLeftX - 5, summaryY + 5, summaryRightX, summaryY + 5);

        summaryY += 18;
        doc.setFont('helvetica', 'bold');
        doc.text('Total Akhir', summaryLeftX, summaryY);
        doc.text(formatRupiah(shipment.totalAmount), summaryRightX, summaryY, { align: 'right' });
        doc.setFont('helvetica', 'normal');
        

        // Footer
        let footerY = finalY + 15;
        doc.text("Keterangan:", 20, footerY);
        footerY += 25;
        doc.text("Hormat Kami", 20, footerY);
        doc.text("Penerima", 120, footerY);
        footerY += 40;
        doc.text("(..................)", 20, footerY);
        doc.text("(..................)", 120, footerY);

        footerY += 15;
        doc.text("Rek Transfer SEABANK : 901597813837 A.N MOCH. MIFTAKHUL RIZAL", 20, footerY, {
            maxWidth: 200,
        });
        
        isFirstPage = false;
      });
      
      const timestamp = format(new Date(), 'yyyy-MM-dd_HH-mm-ss');
      doc.save(`faktur_penjualan_${timestamp}.pdf`);
      toast({
        title: 'Sukses!',
        description: 'Faktur berhasil dibuat dan diunduh.'
      });
    } catch (err) {
      console.error("Error creating PDF", err);
      toast({
        variant: 'destructive',
        title: "Gagal membuat PDF",
        description: "Terjadi kesalahan saat membuat file faktur."
      });
    } finally {
      setIsPrinting(false);
    }
  };
  

  return (
    <div className='space-y-4'>
        <div className="flex justify-end items-center gap-4">
            <div className="flex w-full md:w-auto gap-2">
                <Button onClick={handlePrintInvoices} disabled={selectedShipments.length === 0 || isPrinting}>
                    {isPrinting ? <Loader2 className='mr-2' /> : <FileDown className='mr-2' />}
                    Cetak Faktur Terpilih ({selectedShipments.length})
                </Button>
            </div>
        </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className='w-[50px]'>
                  <Checkbox
                      checked={shipments.length > 0 && selectedShipments.length === shipments.length}
                      onCheckedChange={handleSelectAll}
                  />
              </TableHead>
              <TableHead>No. Transaksi</TableHead>
              <TableHead>Detail Pengiriman</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Tanggal Diproses</TableHead>
              <TableHead className="text-right">Total Nilai</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {shipments.length > 0 ? (
              shipments.map((shipment) => (
                <TableRow key={shipment.id} data-state={selectedShipments.includes(shipment.id) ? "selected" : ""} className="cursor-pointer" onClick={() => handleSelectSingle(shipment.id, !selectedShipments.includes(shipment.id))}>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                            checked={selectedShipments.includes(shipment.id)}
                            onCheckedChange={(checked) => handleSelectSingle(shipment.id, !!checked)}
                        />
                    </TableCell>
                  <TableCell className='font-medium'>{shipment.transactionId}</TableCell>
                  <TableCell className="font-medium">
                    <Accordion type="single" collapsible className="w-full">
                          <AccordionItem value="item-1" className='border-b-0'>
                              <AccordionTrigger className='py-0 font-normal hover:no-underline' onClick={(e) => e.stopPropagation()}>
                                  {shipment.totalItems} item
                              </AccordionTrigger>
                              <AccordionContent className='pt-2'>
                                <div className='flex flex-col gap-1 text-xs text-muted-foreground'>
                                  {shipment.products && shipment.products.map(product => (
                                      <div key={product.productId} className='flex items-center gap-2'>
                                          <ArrowRight className='h-3 w-3'/>
                                          <Badge variant="outline">{product.name} (x{product.quantity})</Badge>
                                      </div>
                                  ))}
                                </div>
                              </AccordionContent>
                          </AccordionItem>
                      </Accordion>
                  </TableCell>
                  <TableCell>
                      <Badge variant={getStatusVariant(shipment.status)}>
                          {shipment.status}
                      </Badge>
                  </TableCell>
                  <TableCell>{format(new Date(shipment.createdAt), 'PPpp', { locale: id })}</TableCell>
                  <TableCell className="text-right font-medium">{formatRupiah(shipment.totalAmount)}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  Belum ada pengiriman yang diarsipkan.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
          {shipments.length > 0 && <TableCaption>Daftar semua pengiriman yang sudah diproses.</TableCaption>}
        </Table>
      </div>
    </div>
  );
}
