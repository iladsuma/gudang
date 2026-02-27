'use client';

import * as React from 'react';
import type { Shipment, User } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption } from '@/components/ui/table';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { id } from 'date-fns/locale';
import { FileDown, Loader2, Send, Printer, ChevronDown } from 'lucide-react';
import { Badge } from './ui/badge';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { useToast } from '@/hooks/use-toast';
import { Button } from './ui/button';
import { Checkbox } from './ui/checkbox';
import { processShipmentsToDelivered } from '@/lib/data';
import { PDFDocument, StandardFonts } from 'pdf-lib';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { DateRangePicker } from './ui/date-range-picker';
import type { DateRange } from "react-day-picker";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';

interface jsPDFWithAutoTable extends jsPDF {
  autoTable: (options: any) => jsPDF;
}

interface ShipmentHistoryClientProps {
  shipments: Shipment[];
  allUsers: User[];
  onUpdate: () => void;
  tableType: 'packaging' | 'archive';
}

type DatePreset = '1d' | '3d' | '7d' | '30d' | 'all' | null;

export function ShipmentHistoryClient({ shipments, allUsers, onUpdate, tableType }: ShipmentHistoryClientProps) {
  const [selectedShipments, setSelectedShipments] = React.useState<string[]>([]);
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [isPrinting, setIsPrinting] = React.useState(false);
  const [userFilter, setUserFilter] = React.useState('all');
  const [activePreset, setActivePreset] = React.useState<DatePreset>('7d');
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>({
    from: subDays(new Date(), 6),
    to: new Date(),
  });
  const { toast } = useToast();
  
  React.useEffect(() => {
    setSelectedShipments([]);
  }, [shipments, dateRange, userFilter]);
  
  const filteredShipments = React.useMemo(() => {
    return shipments.filter(s => {
      const shipmentDate = new Date(s.createdAt);
      
      const matchesUser = userFilter === 'all' || s.userId === userFilter;
      
      const fromDate = dateRange?.from ? startOfDay(dateRange.from) : null;
      const toDate = dateRange?.to ? endOfDay(dateRange.to) : null;

      let matchesDate = true;
      if(fromDate && toDate) {
          matchesDate = shipmentDate >= fromDate && shipmentDate <= toDate;
      } else if (fromDate) {
          matchesDate = shipmentDate >= fromDate;
      } else if (toDate) {
          matchesDate = shipmentDate <= toDate;
      }

      if (activePreset === 'all') {
         return matchesUser;
      }
      
      return matchesUser && matchesDate;
    });
  }, [shipments, userFilter, dateRange, activePreset]);


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
      toast({ title: 'Sukses!', description: `${selectedShipments.length} pesanan berhasil ditandai selesai.` });
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
      toast({ variant: "destructive", title: "Tidak ada data yang bisa dicetak." });
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
            firstPage.drawText(`Pesanan-${counter++}`, { x: 20, y: firstPage.getHeight() - 20, size: 10, font: await mergedPdf.embedFont(StandardFonts.Helvetica) });
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
        doc.text("Butik Anita", 20, 45);

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

  const handleDatePreset = (preset: DatePreset) => {
    setActivePreset(preset);
    const today = new Date();
    if (preset === 'all') {
        setDateRange({ from: undefined, to: undefined });
    } else {
        let fromDate;
        switch (preset) {
            case '1d': fromDate = subDays(today, 0); break;
            case '3d': fromDate = subDays(today, 2); break;
            case '7d': fromDate = subDays(today, 6); break;
            case '30d': fromDate = subDays(today, 29); break;
            default: fromDate = undefined;
        }
        setDateRange({ from: fromDate, to: today });
    }
  }

  const presetLabels: Record<NonNullable<DatePreset>, string> = {
    '1d': '1 Hari Ini',
    '3d': '3 Hari Terakhir',
    '7d': '7 Hari Terakhir',
    '30d': '30 Hari Terakhir',
    'all': 'Semua Waktu',
  };


  return (
    <div className='space-y-4'>
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex w-full md:w-auto flex-col sm:flex-row gap-2">
            <Select onValueChange={setUserFilter} defaultValue="all">
            <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter User" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="all">Semua User</SelectItem>
                {allUsers.map(user => (
                    <SelectItem key={user.id} value={user.id}>{user.username}</SelectItem>
                ))}
            </SelectContent>
            </Select>

            <div className="flex items-center gap-2">
                 <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="w-full sm:w-[180px] justify-between">
                            {activePreset ? presetLabels[activePreset] : "Pilih Periode"}
                            <ChevronDown className="ml-2 h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                        <DropdownMenuItem onSelect={() => handleDatePreset('1d')}>Hari Ini</DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => handleDatePreset('3d')}>3 Hari Terakhir</DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => handleDatePreset('7d')}>7 Hari Terakhir</DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => handleDatePreset('30d')}>30 Hari Terakhir</DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => handleDatePreset('all')}>Semua Waktu</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>

                <DateRangePicker 
                    date={dateRange} 
                    onDateChange={(range) => {
                        setDateRange(range);
                        setActivePreset(null);
                    }} 
                />
            </div>
        </div>


        <div className="flex justify-end w-full md:w-auto gap-2">
            {tableType === 'packaging' && (
                 <>
                    <Button onClick={handlePrintLabels} disabled={selectedShipments.length === 0 || isPrinting} variant="outline">
                        {isPrinting ? <Loader2 className='mr-2' /> : <Printer className='mr-2' />}
                        Cetak Label ({selectedShipments.length})
                    </Button>
                    <Button onClick={handleProcessToDelivered} disabled={selectedShipments.length === 0 || isProcessing}>
                        {isProcessing ? <Loader2 className='mr-2' /> : <Send className='mr-2' />}
                        Tandai Selesai ({selectedShipments.length})
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
                      <Badge variant={getStatusVariant(shipment.status)}>{shipment.status === 'Pengemasan' ? 'Sedang Dijahit' : shipment.status}</Badge>
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
          {filteredShipments.length > 0 && <TableCaption>Menampilkan {filteredShipments.length} dari {shipments.length} total pesanan.</TableCaption>}
        </Table>
      </div>
    </div>
  );
}
