'use client';

import * as React from 'react';
import type { Shipment, User } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption } from '@/components/ui/table';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { id } from 'date-fns/locale';
import { FileDown, Loader2, Send, Printer, ChevronDown, Store, MapPin } from 'lucide-react';
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
      
      const assignedIds = s.userId ? s.userId.split(',') : [];
      const matchesUser = userFilter === 'all' || assignedIds.includes(userFilter);
      
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
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number);
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
    const idsToProcess = filteredShipments
        .filter(s => selectedShipments.includes(s.id) && s.status === 'Pengemasan')
        .map(s => s.id);

    if (idsToProcess.length === 0) {
      toast({ variant: 'info', title: 'Info', description: 'Hanya pesanan berstatus "Sedang Dijahit" yang bisa ditandai selesai.' });
      return;
    }
    setIsProcessing(true);
    try {
      await processShipmentsToDelivered(idsToProcess);
      toast({ title: 'Sukses!', description: `${idsToProcess.length} pesanan berhasil ditandai selesai.` });
      onUpdate();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Gagal Memproses', description: error instanceof Error ? error.message : 'Terjadi kesalahan.' });
    } finally {
      setIsProcessing(false);
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
      const margin = 40;
      let currentY = 50;

      // --- MAIN HEADER (Only once at the top of the first page) ---
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('BUTIK ANITA', margin, currentY);
      
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text("Jl. Utama No. 123, Perancang Busana & Jasa Jahit Berkualitas", margin, currentY + 15);
      
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('REKAP FAKTUR PENJUALAN', margin, currentY + 40);
      doc.line(margin, currentY + 45, doc.internal.pageSize.getWidth() - margin, currentY + 45);
      
      currentY += 65;

      for (let index = 0; index < shipmentsToPrint.length; index++) {
        const shipment = shipmentsToPrint[index];
        
        // Estimate height for this section: Header info (40) + Table (row count * 20) + Summary (80)
        const estimatedHeight = 120 + (shipment.products.length * 20);
        
        // Check if we need a new page
        if (currentY + estimatedHeight > doc.internal.pageSize.getHeight() - margin) {
            doc.addPage();
            currentY = 50;
            // Simplified page header for subsequent pages
            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.text('BUTIK ANITA - REKAP FAKTUR (Lanjutan)', margin, currentY);
            doc.line(margin, currentY + 5, doc.internal.pageSize.getWidth() - margin, currentY + 5);
            currentY += 30;
        }

        // --- COMPACT SHIPMENT INFO ---
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text(`${index + 1}. No: ${shipment.transactionId}`, margin, currentY);
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        const rightX = doc.internal.pageSize.getWidth() - margin;
        doc.text(`Pelanggan: ${shipment.customerName}`, rightX, currentY, { align: 'right' });
        doc.text(`Tanggal: ${format(new Date(shipment.createdAt), 'dd/MM/yyyy HH:mm')}`, margin, currentY + 15);

        // --- PRODUCT TABLE ---
        const tableColumn = ["Item Pesanan", "Jumlah", "Harga Jasa", "Total"];
        const tableRows = shipment.products.map((p) => [
          p.name, 
          `${p.quantity} PCS`, 
          formatRupiah(p.price), 
          formatRupiah(p.quantity * p.price)
        ]);

        doc.autoTable({ 
          startY: currentY + 25, 
          head: [tableColumn], 
          body: tableRows,
          theme: 'grid',
          headStyles: { fillColor: [80, 80, 80], textColor: 255 },
          margin: { left: margin, right: margin },
          styles: { fontSize: 8, cellPadding: 4 },
          columnStyles: {
            1: { halign: 'center', cellWidth: 60 },
            2: { halign: 'right', cellWidth: 80 },
            3: { halign: 'right', cellWidth: 80 }
          }
        });

        const finalY = (doc as any).lastAutoTable.finalY + 12;
        
        // --- SUMMARY ---
        const subtotal = shipment.products.reduce((s, p) => s + (p.price * p.quantity), 0);
        const deliveryFee = shipment.deliveryFee || 0;
        const total = subtotal + deliveryFee;
        const dp = shipment.downPayment || 0;
        const remaining = total - dp;

        doc.setFontSize(8);
        const summaryLabelX = rightX - 100;
        
        doc.text("Subtotal:", summaryLabelX, finalY, { align: 'right' });
        doc.text(formatRupiah(subtotal), rightX, finalY, { align: 'right' });
        
        let subY = finalY + 10;
        if (deliveryFee > 0) {
            doc.text(`Ongkir (${shipment.deliveryDistance}km):`, summaryLabelX, subY, { align: 'right' });
            doc.text(formatRupiah(deliveryFee), rightX, subY, { align: 'right' });
            subY += 10;
        }

        doc.setFont('helvetica', 'bold');
        doc.text("TOTAL:", summaryLabelX, subY, { align: 'right' });
        doc.text(formatRupiah(total), rightX, subY, { align: 'right' });
        
        subY += 10;
        doc.setFont('helvetica', 'normal');
        doc.text("Uang Muka (DP):", summaryLabelX, subY, { align: 'right' });
        doc.text(`- ${formatRupiah(dp)}`, rightX, subY, { align: 'right' });
        
        subY += 12;
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(200, 0, 0); // Red for remaining
        doc.text("SISA PELUNASAN:", summaryLabelX, subY, { align: 'right' });
        doc.text(formatRupiah(remaining), rightX, subY, { align: 'right' });
        doc.setTextColor(0, 0, 0); // Reset to black

        // Subtle line between nota
        doc.setDrawColor(230, 230, 230);
        doc.line(margin, subY + 15, doc.internal.pageSize.getWidth() - margin, subY + 15);
        
        currentY = subY + 35;
      }
      
      doc.save(`faktur_gabungan_butik_${Date.now()}.pdf`);
      toast({ title: 'Sukses!', description: 'Faktur gabungan berhasil dibuat dalam satu dokumen.' });
    } catch (err) {
      console.error(err);
      toast({ variant: 'destructive', title: "Gagal membuat PDF" });
    } finally {
      setIsPrinting(false);
    }
  };

  const getUserNameDisplay = (userId: string) => {
      if (!userId) return 'N/A';
      const assignedIds = userId.split(',');
      const names = assignedIds.map(id => allUsers.find(u => u.id === id)?.username || 'N/A');
      return names.join(', ');
  };

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
            <Button onClick={handlePrintInvoices} disabled={selectedShipments.length === 0 || isPrinting} variant="outline">
                {isPrinting ? <Loader2 className='mr-2' /> : <Printer className='mr-2' />}
                Cetak Faktur ({selectedShipments.length})
            </Button>
            
            {tableType === 'packaging' && (
                 <>
                    <Button onClick={handleProcessToDelivered} disabled={selectedShipments.length === 0 || isProcessing}>
                        {isProcessing ? <Loader2 className='mr-2' /> : <Send className='mr-2' />}
                        Tandai Selesai ({selectedShipments.length})
                    </Button>
                 </>
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
              <TableHead>Penjahit</TableHead>
              <TableHead>Pelanggan</TableHead>
              <TableHead>Pengiriman</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Bayar</TableHead>
              <TableHead>Tanggal</TableHead>
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
                  <TableCell className='font-medium font-mono text-xs'>{shipment.transactionId}</TableCell>
                  <TableCell>
                      <div className="max-w-[120px] truncate text-xs" title={getUserNameDisplay(shipment.userId)}>
                        {getUserNameDisplay(shipment.userId)}
                      </div>
                  </TableCell>
                  <TableCell className="text-xs font-medium">{shipment.customerName}</TableCell>
                  <TableCell>
                      <div className="flex flex-col gap-0.5 text-[9px]">
                          <div className="flex items-center gap-1 font-semibold uppercase">
                                {shipment.deliveryMethod === 'Diambil di Toko' ? (
                                    <><Store className="h-2.5 w-2.5 text-blue-600" /> Ambil</>
                                ) : (
                                    <><MapPin className="h-2.5 w-2.5 text-amber-600" /> Kurir</>
                                )}
                          </div>
                      </div>
                  </TableCell>
                  <TableCell>
                      <Badge variant={getStatusVariant(shipment.status)} className="text-[10px]">{shipment.status === 'Pengemasan' ? 'Sedang Dijahit' : shipment.status === 'Terkirim' ? 'Sudah Selesai' : shipment.status}</Badge>
                  </TableCell>
                  <TableCell>
                      <Badge variant={shipment.paymentStatus === 'Lunas' ? 'default' : 'destructive'} className="text-[10px]">{shipment.paymentStatus}</Badge>
                  </TableCell>
                  <TableCell className="text-[10px]">{format(new Date(shipment.createdAt), 'dd/MM/yy HH:mm', { locale: id })}</TableCell>
                  <TableCell className="text-right font-bold text-primary text-xs">{formatRupiah(shipment.totalAmount)}</TableCell>
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
