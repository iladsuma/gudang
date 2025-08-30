

'use client';

import * as React from 'react';
import type { Shipment } from '@/lib/types';
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
import { Input } from './ui/input';


// Extend jsPDF with autoTable, which is a plugin.
interface jsPDFWithAutoTable extends jsPDF {
  autoTable: (options: any) => jsPDF;
}


export function InvoicesClient({ shipments: initialShipments }: { shipments: Shipment[] }) {
  const [shipments, setShipments] = React.useState(initialShipments);
  const [selectedShipments, setSelectedShipments] = React.useState<string[]>([]);
  const [isPrinting, setIsPrinting] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState('');
  const { toast } = useToast();

  React.useEffect(() => {
    setShipments(initialShipments);
  }, [initialShipments]);

  const filteredShipments = React.useMemo(() => {
    if (!searchTerm) return shipments;
    const lowercasedFilter = searchTerm.toLowerCase();
    return shipments.filter(shipment =>
        shipment.transactionId.toLowerCase().includes(lowercasedFilter) ||
        shipment.customerName.toLowerCase().includes(lowercasedFilter) ||
        shipment.user.toLowerCase().includes(lowercasedFilter) ||
        shipment.products.some(p => p.name.toLowerCase().includes(lowercasedFilter))
    );
  }, [shipments, searchTerm]);
  
  const formatRupiah = (number: number) => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
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
        setSelectedShipments(filteredShipments.map(s => s.id));
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

  const handlePrintInvoices = () => {
    if (selectedShipments.length === 0) {
        toast({
            variant: 'destructive',
            title: "Tidak ada data terpilih",
            description: "Silakan pilih setidaknya satu pengiriman untuk dicetak."
        });
        return;
    }
    
    setIsPrinting(true);

    try {
        const doc = new jsPDF() as jsPDFWithAutoTable;
        const shipmentsToPrint = shipments.filter(s => selectedShipments.includes(s.id));

        shipmentsToPrint.forEach((shipment, index) => {
            if (index > 0) {
                doc.addPage();
            }

            // Header
            doc.setFontSize(16);
            doc.setFont('helvetica', 'bold');
            doc.text('FAKTUR PENJUALAN', 14, 20);

            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.text("Fam's Warehouse", 14, 26);
            doc.text("Srengat", 14, 30);
            
            // Right-side info
            const tgl = format(new Date(shipment.createdAt), 'dd/MM/yyyy HH:mm');
            doc.text(`No Transaksi: ${shipment.transactionId}`, 140, 20);
            doc.text(`Tgl: ${tgl}`, 140, 30);
            doc.text(`Kasir: ${shipment.user}`, 140, 35);
            

            // Table
            const tableColumn = ["No.", "Nama Item", "Jml", "Satuan", "Harga", "Total"];
            const tableRows: any[] = [];

            shipment.products.forEach((product, i) => {
                const productData = [
                    i + 1,
                    product.name,
                    product.quantity,
                    'PCS',
                    product.price.toLocaleString('id-ID'),
                    (product.quantity * product.price).toLocaleString('id-ID'),
                ];
                tableRows.push(productData);
            });

            doc.autoTable({
                startY: 45,
                head: [tableColumn],
                body: tableRows,
                theme: 'plain',
                headStyles: {
                    fillColor: [255, 255, 255],
                    textColor: [0, 0, 0],
                    fontStyle: 'bold',
                    lineWidth: { bottom: 0.5 },
                    lineColor: [0, 0, 0]
                },
                styles: {
                    cellPadding: { top: 1, right: 2, bottom: 1, left: 2 },
                    fontSize: 9,
                },
                 columnStyles: {
                    0: { cellWidth: 10, halign: 'center' }, // No.
                    1: { cellWidth: 70 }, // Nama Item
                    2: { cellWidth: 15, halign: 'center' }, // Jml
                    3: { cellWidth: 15, halign: 'center' }, // Satuan
                    4: { cellWidth: 30, halign: 'right' }, // Harga
                    5: { cellWidth: 30, halign: 'right' }, // Total
                },
            });

            // Summary below table
            const finalY = doc.autoTable.previous.finalY;
            doc.setFontSize(10);

            let summaryY = finalY + 10;
            const rightAlignX = 190;

            doc.text('Sub Total', 140, summaryY);
            doc.text(shipment.totalProductCost.toLocaleString('id-ID'), rightAlignX, summaryY, { align: 'right' });
            
            summaryY += 6;
            doc.text('Biaya Pengemasan', 140, summaryY);
            doc.text(shipment.totalPackingCost.toLocaleString('id-ID'), rightAlignX, summaryY, { align: 'right' });

            summaryY += 6;
            doc.setFont('helvetica', 'bold');
            doc.text('Total Akhir', 140, summaryY);
            doc.text(shipment.totalAmount.toLocaleString('id-ID'), rightAlignX, summaryY, { align: 'right' });

        });

        const timestamp = format(new Date(), 'yyyy-MM-dd_HH-mm-ss');
        doc.save(`faktur_${timestamp}.pdf`);

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
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
             <Input 
                placeholder="Cari No. Transaksi, User, Pelanggan..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full md:w-80"
            />
            <Button onClick={handlePrintInvoices} disabled={selectedShipments.length === 0 || isPrinting} className="w-full md:w-auto">
                {isPrinting ? <Loader2 className='mr-2' /> : <FileDown className='mr-2' />}
                Cetak Faktur Terpilih ({selectedShipments.length})
            </Button>
        </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className='w-[50px]'>
                  <Checkbox
                      checked={filteredShipments.length > 0 && selectedShipments.length === filteredShipments.length}
                      onCheckedChange={handleSelectAll}
                  />
              </TableHead>
              <TableHead>No. Transaksi</TableHead>
              <TableHead>User Pemroses</TableHead>
              <TableHead>Detail Pengiriman</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Tanggal Diproses</TableHead>
              <TableHead className="text-right">Total Nilai</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredShipments.length > 0 ? (
              filteredShipments.map((shipment) => (
                <TableRow key={shipment.id} data-state={selectedShipments.includes(shipment.id) ? "selected" : ""} className="cursor-pointer" onClick={() => handleSelectSingle(shipment.id, !selectedShipments.includes(shipment.id))}>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                            checked={selectedShipments.includes(shipment.id)}
                            onCheckedChange={(checked) => handleSelectSingle(shipment.id, !!checked)}
                        />
                    </TableCell>
                  <TableCell className='font-medium'>{shipment.transactionId}</TableCell>
                  <TableCell>{shipment.user}</TableCell>
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
                <TableCell colSpan={7} className="h-24 text-center">
                  Tidak ada pengiriman yang cocok dengan filter.
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
