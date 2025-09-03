

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
import { Input } from './ui/input';
import { getCustomers } from '@/lib/data';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Label }from './ui/label';


// Extend jsPDF with autoTable, which is a plugin.
interface jsPDFWithAutoTable extends jsPDF {
  autoTable: (options: any) => jsPDF;
}


export function InvoicesClient({ shipments: initialShipments }: { shipments: Shipment[] }) {
  const [shipments, setShipments] = React.useState(initialShipments);
  const [allCustomers, setAllCustomers] = React.useState<Customer[]>([]);
  const [selectedShipments, setSelectedShipments] = React.useState<string[]>([]);
  const [isPrinting, setIsPrinting] = React.useState(false);
  const [isPrintingCombined, setIsPrintingCombined] = React.useState(false);

  // Filters
  const [searchTerm, setSearchTerm] = React.useState('');
  const [userFilter, setUserFilter] = React.useState('all');

  const { toast } = useToast();

  React.useEffect(() => {
    setShipments(initialShipments);
    getCustomers().then(setAllCustomers);
  }, [initialShipments]);
  
  const uniqueUsers = React.useMemo(() => {
    const users = new Set(shipments.map(s => s.user));
    return ['all', ...Array.from(users)];
  }, [shipments]);


  const filteredShipments = React.useMemo(() => {
    return shipments.filter(shipment => {
        const matchesSearch = searchTerm === '' ||
            shipment.transactionId.toLowerCase().includes(searchTerm.toLowerCase()) ||
            shipment.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            shipment.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
            shipment.products.some(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));

        const matchesUser = userFilter === 'all' || shipment.user === userFilter;
        
        return matchesSearch && matchesUser;
    });
  }, [shipments, searchTerm, userFilter]);
  
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
      const doc = new jsPDF('p', 'pt', 'a4') as jsPDFWithAutoTable;
      const pageWidth = doc.internal.pageSize.getWidth();
      let isFirstPage = true;

      shipmentsToPrint.forEach(shipment => {
        if (!isFirstPage) {
          doc.addPage();
        }

        const customer = allCustomers.find(c => c.id === shipment.customerId);

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
        doc.text(`Alamat       : ${customer?.address || ''}`, rightX, 65, { align: 'right' });
        doc.text(`Tgl    : ${format(new Date(shipment.createdAt), 'dd/MM/yyyy HH:mm')}`, rightX, 75, { align: 'right' });
        doc.text(`Kasir  : ${shipment.user.toUpperCase()}`, rightX, 85, { align: 'right' });


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
            startY: 100,
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
        doc.text('Potongan', summaryLeftX, summaryY);
        doc.text('0', summaryRightX, summaryY, { align: 'right' });
        
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
        
        summaryY += 12;
        doc.text('Tunai', summaryLeftX, summaryY);
        doc.text('0', summaryRightX, summaryY, { align: 'right' });

        summaryY += 12;
        doc.text('Transfer', summaryLeftX, summaryY);
        doc.text('0', summaryRightX, summaryY, { align: 'right' });


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
  
  const handlePrintCombinedInvoice = () => {
    const shipmentsToPrint = filteredShipments;
    if (shipmentsToPrint.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Tidak ada data untuk dicetak',
        description: 'Tidak ada pengiriman yang cocok dengan filter saat ini.',
      });
      return;
    }

    setIsPrintingCombined(true);
    try {
      const doc = new jsPDF('p', 'pt', 'a4') as jsPDFWithAutoTable;
      const pageWidth = doc.internal.pageSize.getWidth();

      // Header
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('Faktur Gabungan Penjualan', pageWidth / 2, 30, { align: 'center' });

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const user = userFilter === 'all' ? 'Semua User' : userFilter;
      const dateFrom = format(new Date(Math.min(...shipmentsToPrint.map(s => new Date(s.createdAt).getTime()))), 'dd MMM yyyy');
      const dateTo = format(new Date(Math.max(...shipmentsToPrint.map(s => new Date(s.createdAt).getTime()))), 'dd MMM yyyy');
      doc.text(`Kasir: ${user}`, pageWidth / 2, 45, { align: 'center' });
      doc.text(`Periode: ${dateFrom} - ${dateTo}`, pageWidth / 2, 57, { align: 'center' });


      // Table
      const tableColumn = ["No.", "No. Transaksi", "Nama Item", "Jml", "Harga", "Subtotal"];
      const tableRows: any[] = [];
      let grandTotal = 0;
      let totalItems = 0;
      
      let itemCounter = 1;
      shipmentsToPrint.forEach(shipment => {
        shipment.products.forEach(product => {
          const subtotal = product.quantity * product.price;
          const productData = [
            itemCounter++,
            shipment.transactionId,
            product.name,
            product.quantity,
            formatRupiah(product.price),
            formatRupiah(subtotal),
          ];
          tableRows.push(productData);
        });
        grandTotal += shipment.totalAmount;
        totalItems += shipment.totalItems;
      });

      doc.autoTable({
        startY: 70,
        head: [tableColumn],
        body: tableRows,
        theme: 'striped',
        headStyles: { fillColor: [41, 128, 185], textColor: 255 },
        styles: { fontSize: 8, cellPadding: 3, overflow: 'linebreak' },
        columnStyles: {
            0: { cellWidth: 25, halign: 'center' },
            1: { cellWidth: 'auto' }, // transactionId
            2: { cellWidth: 150 }, // name
            3: { cellWidth: 30, halign: 'center' },
            4: { cellWidth: 60, halign: 'right' },
            5: { cellWidth: 70, halign: 'right' },
        },
      });

      // Summary
      const finalY = doc.autoTable.previous.finalY;
      const summaryRightX = pageWidth - 20;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text(`Total Keseluruhan:`, summaryRightX - 100, finalY + 20, { align: 'right' });
      doc.text(`${formatRupiah(grandTotal)}`, summaryRightX, finalY + 20, { align: 'right' });
      
      const timestamp = format(new Date(), 'yyyy-MM-dd_HH-mm-ss');
      doc.save(`faktur_gabungan_${user}_${timestamp}.pdf`);
      toast({ title: 'Sukses!', description: 'Faktur gabungan berhasil dibuat.' });

    } catch (error) {
      console.error("Error creating combined PDF", error);
      toast({
        variant: 'destructive',
        title: "Gagal membuat PDF",
        description: "Terjadi kesalahan saat membuat file faktur gabungan."
      });
    } finally {
      setIsPrintingCombined(false);
    }
  };


  return (
    <div className='space-y-4'>
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
             <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
                <Input 
                    placeholder="Cari No. Transaksi, User, Pelanggan..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full md:w-80"
                />
                 <div className="grid gap-2">
                    <Label htmlFor="filter-user" className="sr-only">Filter User</Label>
                    <Select value={userFilter} onValueChange={setUserFilter}>
                        <SelectTrigger id="filter-user" className="w-full md:w-[180px]">
                            <SelectValue placeholder="Filter by User" />
                        </SelectTrigger>
                        <SelectContent>
                            {uniqueUsers.map(user => (
                                <SelectItem key={user} value={user}>{user === 'all' ? 'Semua User' : user}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                 </div>
             </div>
            <div className="flex w-full md:w-auto gap-2">
                <Button onClick={handlePrintCombinedInvoice} disabled={isPrintingCombined} variant="outline">
                     {isPrintingCombined ? <Loader2 className='mr-2' /> : <FileDown className='mr-2' />}
                    Cetak Rekap Gabungan
                </Button>
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

    