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
      toast({ variant: 'destructive', title: "Pilih data terlebih dahulu" });
      return;
    }

    setIsPrinting(true);
    try {
      const doc = new jsPDF('p', 'pt', 'a4') as jsPDFWithAutoTable;
      const margin = 40;
      
      // HEADER DOKUMEN (Muncul di setiap halaman berkat autotable hook atau print sekali saja)
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('BUTIK ANITA', margin, 50);
      
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text("Jl. Utama No. 123, Perancang Busana & Jasa Jahit Berkualitas", margin, 65);
      
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('REKAPITULASI FAKTUR PENJUALAN', margin, 90);
      doc.line(margin, 95, doc.internal.pageSize.getWidth() - margin, 95);

      const tableColumn = ["Info Pesanan", "Rincian Item / Jasa Jahit", "Jumlah", "Harga Jasa", "Subtotal"];
      const tableRows: any[] = [];

      shipmentsToPrint.forEach((shipment, sIdx) => {
          const dateStr = format(new Date(shipment.createdAt), 'dd/MM/yyyy');
          const infoCell = `${shipment.transactionId}\n${shipment.customerName}\n${dateStr}`;
          
          const subtotalItems = shipment.products.reduce((s, p) => s + (p.price * p.quantity), 0);
          const deliveryFee = shipment.deliveryFee || 0;
          const totalAmount = subtotalItems + deliveryFee;
          const dp = shipment.downPayment || 0;
          const sisa = totalAmount - dp;

          // Item Rows
          shipment.products.forEach((p, pIdx) => {
              tableRows.push([
                  pIdx === 0 ? { content: infoCell, styles: { fontStyle: 'bold', valign: 'top' } } : '',
                  p.name,
                  `${p.quantity} PCS`,
                  formatRupiah(p.price),
                  formatRupiah(p.price * p.quantity)
              ]);
          });

          // Delivery Row
          if (deliveryFee > 0) {
              tableRows.push([
                  '',
                  `Biaya Pengiriman (Kurir Toko - ${shipment.deliveryDistance}km)`,
                  '',
                  '',
                  formatRupiah(deliveryFee)
              ]);
          }

          // Summary Rows for this order
          tableRows.push([
              '',
              { content: 'TOTAL BELANJA', styles: { halign: 'right', fontStyle: 'bold' } },
              '',
              '',
              { content: formatRupiah(totalAmount), styles: { fontStyle: 'bold' } }
          ]);

          if (dp > 0) {
              tableRows.push([
                  '',
                  { content: 'Uang Muka (DP)', styles: { halign: 'right' } },
                  '',
                  '',
                  { content: `- ${formatRupiah(dp)}`, styles: { textColor: [200, 0, 0] } }
              ]);
          }

          tableRows.push([
              '',
              { content: 'SISA PELUNASAN', styles: { halign: 'right', fontStyle: 'bold', textColor: [0, 100, 0] } },
              '',
              '',
              { content: formatRupiah(sisa), styles: { fontStyle: 'bold', textColor: [0, 100, 0] } }
          ]);

          // Separator row for visual grouping
          if (sIdx < shipmentsToPrint.length - 1) {
              tableRows.push([
                  { content: '', colSpan: 5, styles: { minCellHeight: 12, fillColor: [240, 240, 240] } }
              ]);
          }
      });

      doc.autoTable({
          startY: 110,
          head: [tableColumn],
          body: tableRows,
          theme: 'grid',
          headStyles: { fillColor: [60, 60, 60], textColor: 255, fontSize: 9 },
          styles: { fontSize: 8, cellPadding: 5 },
          columnStyles: {
              0: { cellWidth: 110 },
              1: { cellWidth: 'auto' },
              2: { halign: 'center', cellWidth: 50 },
              3: { halign: 'right', cellWidth: 80 },
              4: { halign: 'right', cellWidth: 80 }
          },
          margin: { left: margin, right: margin }
      });

      doc.save(`rekap_faktur_butik_${Date.now()}.pdf`);
      toast({ title: 'Sukses!', description: 'Faktur gabungan berhasil dicetak dalam format tabel terpadu.' });
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
