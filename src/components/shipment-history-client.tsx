'use client';

import * as React from 'react';
import type { Shipment, User } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption } from '@/components/ui/table';
import { format, subDays } from 'date-fns';
import { id } from 'date-fns/locale';
import { FileDown, Loader2, Send, Printer } from 'lucide-react';
import { Badge } from './ui/badge';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { useToast } from '@/hooks/use-toast';
import { Button } from './ui/button';
import { Checkbox } from './ui/checkbox';
import { processShipmentsToDelivered } from '@/lib/data';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

interface jsPDFWithAutoTable extends jsPDF {
  autoTable: (options: any) => jsPDF;
}

interface ShipmentHistoryClientProps {
  shipments: Shipment[];
  allUsers: User[];
  onUpdate: () => void;
  tableType: 'packaging' | 'archive';
}

export function ShipmentHistoryClient({ shipments, allUsers, onUpdate, tableType }: ShipmentHistoryClientProps) {
  const [selectedShipments, setSelectedShipments] = React.useState<string[]>([]);
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [isPrinting, setIsPrinting] = React.useState(false);
  const [dateFilter, setDateFilter] = React.useState('all');
  const { toast } = useToast();
  
  React.useEffect(() => {
    setSelectedShipments([]);
  }, [shipments, dateFilter]);

  const handleDateFilterChange = (value: string) => {
    setDateFilter(value);
  };
  
  const filteredShipments = React.useMemo(() => {
    if (dateFilter === 'all') return shipments;
    
    const now = new Date();
    let startDate: Date;

    switch (dateFilter) {
      case '1d': startDate = subDays(now, 1); break;
      case '3d': startDate = subDays(now, 3); break;
      case '7d': startDate = subDays(now, 7); break;
      case '30d': startDate = subDays(now, 30); break;
      default: startDate = new Date(0); 
    }

    return shipments.filter(s => new Date(s.createdAt) >= startDate);
  }, [shipments, dateFilter]);


  const formatRupiah = (number: number) => {
    return new Intl.NumberFormat('id-ID', {}).format(number);
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
    setSelectedShipments(checked ? filteredShipments.map(s => s.id) : []);
  }

  const handleSelectSingle = (shipmentId: string, checked: boolean) => {
    setSelectedShipments(prev =>
      checked ? [...prev, shipmentId] : prev.filter(id => id !== shipmentId)
    );
  }

  const handleProcessToDelivered = async () => {
    if (selectedShipments.length === 0) {
      toast({ variant: 'destructive', title: 'Tidak Ada Data Terpilih' });
      return;
    }
    setIsProcessing(true);
    try {
      await processShipmentsToDelivered(selectedShipments);
      toast({ title: 'Sukses!', description: `${selectedShipments.length} pengiriman berhasil ditandai terkirim.` });
      onUpdate();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Gagal Memproses', description: error instanceof Error ? error.message : 'Terjadi kesalahan.' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePrintLabels = async () => {
    const shipmentsToPrint = shipments.filter(s => selectedShipments.includes(s.id) && s.receipt?.dataUrl);
    if (shipmentsToPrint.length === 0) {
      toast({ variant: "destructive", title: "Tidak ada resi yang bisa dicetak." });
      return;
    }

    setIsPrinting(true);
    try {
      const mergedPdf = await PDFDocument.create();
      let counter = 1;
      for (const shipment of shipmentsToPrint) {
        const base64Data = shipment.receipt!.dataUrl.split(',')[1];
        if (!base64Data) continue;
        
        try {
          const pdfToMerge = await PDFDocument.load(base64Data);
          const copiedPages = await mergedPdf.copyPages(pdfToMerge, pdfToMerge.getPageIndices());
          if (copiedPages.length > 0) {
            const firstPage = copiedPages[0];
            firstPage.drawText(`Resi-${counter++}`, { x: 20, y: firstPage.getHeight() - 20, size: 10, font: await mergedPdf.embedFont(StandardFonts.Helvetica) });
          }
          copiedPages.forEach(page => mergedPdf.addPage(page));
        } catch (e) { console.error(`Failed to process PDF for ${shipment.transactionId}:`, e); }
      }

      if (mergedPdf.getPageCount() > 0) {
        const mergedPdfBytes = await mergedPdf.save();
        const blob = new Blob([mergedPdfBytes], { type: 'application/pdf' });
        window.open(URL.createObjectURL(blob));
      } else {
        toast({ variant: "destructive", title: "Gagal membuat PDF gabungan." });
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Gagal membuat PDF", description: error instanceof Error ? error.message : 'Terjadi kesalahan.' });
    } finally {
      setIsPrinting(false);
    }
  };
  
  const handlePrintInvoices = async () => {
    const shipmentsToPrint = filteredShipments.filter(s => selectedShipments.includes(s.id));
    if (shipmentsToPrint.length === 0) {
      toast({ variant: 'destructive', title: "Tidak ada data terpilih" });
      return;
    }

    setIsPrinting(true);
    try {
      const doc = new jsPDF('p', 'pt', 'a4') as jsPDFWithAutoTable;
      let isFirstPage = true;

      for (const shipment of shipmentsToPrint) {
        if (!isFirstPage) doc.addPage();
        
        const user = allUsers.find(u => u.id === shipment.userId);

        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('FAKTUR PENJUALAN', 20, 30);
        
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.text("Fam's Warehouse", 20, 45);

        const rightX = doc.internal.pageSize.getWidth() - 20;
        doc.text(`No Transaksi : ${shipment.transactionId}`, rightX, 45, { align: 'right' });
        doc.text(`Pelanggan    : ${shipment.customerName}`, rightX, 55, { align: 'right' });
        doc.text(`Tgl    : ${format(new Date(shipment.createdAt), 'dd/MM/yyyy HH:mm')}`, rightX, 65, { align: 'right' });
        doc.text(`Kasir  : ${user?.username.toUpperCase() ?? 'N/A'}`, rightX, 75, { align: 'right' });

        const tableColumn = ["No.", "Nama Item", "Jml Satuan", "Harga", "Diskon", "Total"];
        const tableRows = shipment.products.map((p, i) => [i + 1, p.name, `${p.quantity} PCS`, formatRupiah(p.price), 0, formatRupiah(p.quantity * p.price)]);

        doc.autoTable({ startY: 90, head: [tableColumn], body: tableRows });

        isFirstPage = false;
      };
      
      doc.save(`faktur_penjualan_${Date.now()}.pdf`);
      toast({ title: 'Sukses!', description: 'Faktur berhasil dibuat.' });
    } catch (err) {
      toast({ variant: 'destructive', title: "Gagal membuat PDF" });
    } finally {
      setIsPrinting(false);
    }
  };

  const getUserName = (userId: string) => allUsers.find(u => u.id === userId)?.username || 'N/A';

  return (
    <div className='space-y-4'>
      <div className="flex justify-between items-center gap-4">
        <Select onValueChange={handleDateFilterChange} defaultValue="all">
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter tanggal" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Waktu</SelectItem>
            <SelectItem value="1d">1 Hari Terakhir</SelectItem>
            <SelectItem value="3d">3 Hari Terakhir</SelectItem>
            <SelectItem value="7d">1 Minggu Terakhir</SelectItem>
            <SelectItem value="30d">1 Bulan Terakhir</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex w-full md:w-auto gap-2">
            {tableType === 'packaging' && (
                 <>
                    <Button onClick={handlePrintLabels} disabled={selectedShipments.length === 0 || isPrinting} variant="outline">
                        {isPrinting ? <Loader2 className='mr-2' /> : <Printer className='mr-2' />}
                        Cetak Resi ({selectedShipments.length})
                    </Button>
                    <Button onClick={handleProcessToDelivered} disabled={selectedShipments.length === 0 || isProcessing}>
                        {isProcessing ? <Loader2 className='mr-2' /> : <Send className='mr-2' />}
                        Tandai Terkirim ({selectedShipments.length})
                    </Button>
                 </>
            )}
            {tableType === 'archive' && (
                <Button onClick={handlePrintInvoices} disabled={selectedShipments.length === 0 || isPrinting}>
                    {isPrinting ? <Loader2 className='mr-2' /> : <FileDown className='mr-2' />}
                    Cetak Faktur ({selectedShipments.length})
                </Button>
            )}
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
              <TableHead className="w-[50px]">No.</TableHead>
              <TableHead>No. Transaksi</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Pelanggan</TableHead>
              <TableHead>Produk</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Tanggal</TableHead>
              <TableHead className="text-right">Total Item</TableHead>
              <TableHead className="text-right">Total Nilai</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredShipments.length > 0 ? (
              filteredShipments.map((shipment, index) => (
                <TableRow key={shipment.id} data-state={selectedShipments.includes(shipment.id) ? "selected" : ""} className="cursor-pointer" onClick={() => handleSelectSingle(shipment.id, !selectedShipments.includes(shipment.id))}>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                            checked={selectedShipments.includes(shipment.id)}
                            onCheckedChange={(checked) => handleSelectSingle(shipment.id, !!checked)}
                        />
                    </TableCell>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell className='font-medium font-mono'>{shipment.transactionId}</TableCell>
                  <TableCell>{getUserName(shipment.userId)}</TableCell>
                  <TableCell>{shipment.customerName}</TableCell>
                  <TableCell>
                      <div className="flex flex-col gap-1">
                          {shipment.products.map(p => <Badge key={p.productId} variant="secondary" className="font-normal">{p.name} (x{p.quantity})</Badge>)}
                      </div>
                  </TableCell>
                  <TableCell>
                      <Badge variant={getStatusVariant(shipment.status)}>{shipment.status}</Badge>
                  </TableCell>
                  <TableCell>{format(new Date(shipment.createdAt), 'dd MMM yyyy, HH:mm', { locale: id })}</TableCell>
                  <TableCell className="text-right">{shipment.totalItems}</TableCell>
                  <TableCell className="text-right font-medium">{formatRupiah(shipment.totalAmount)}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={10} className="h-24 text-center">
                  Tidak ada data untuk ditampilkan pada periode ini.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
          {filteredShipments.length > 0 && <TableCaption>Menampilkan {filteredShipments.length} dari {shipments.length} total pengiriman.</TableCaption>}
        </Table>
      </div>
    </div>
  );
}
