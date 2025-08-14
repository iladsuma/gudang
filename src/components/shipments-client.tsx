'use client';

import { useState, useEffect } from 'react';
import type { Shipment } from '@/lib/types';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { Button } from '@/components/ui/button';
import { PlusCircle, Trash2, Loader2, FileText, Download } from 'lucide-react';
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ShipmentForm } from './shipment-form';
import { handleDeleteShipment } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Badge } from './ui/badge';
import { Checkbox } from './ui/checkbox';
import { Skeleton } from './ui/skeleton';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

interface jsPDFWithAutoTable extends jsPDF {
  autoTable: (options: any) => jsPDF;
}

export function ShipmentsClient({ shipments: initialShipments }: { shipments: Shipment[] }) {
  const [shipments, setShipments] = useState(initialShipments);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [selectedShipments, setSelectedShipments] = useState<string[]>([]);
  const { toast } = useToast();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleFormSuccess = (updatedShipments: Shipment[]) => {
    setShipments(updatedShipments);
    setIsFormOpen(false);
  };
  
  const onDelete = async (shipmentId: string) => {
    setIsDeleting(shipmentId);
    const result = await handleDeleteShipment(shipmentId);
    if (result.success) {
      setShipments((prev) => prev.filter((s) => s.id !== shipmentId));
      setSelectedShipments((prev) => prev.filter((id) => id !== shipmentId));
      toast({
        title: 'Sukses!',
        description: 'Data pengiriman berhasil dihapus.',
      });
    } else {
      toast({
        variant: 'destructive',
        title: 'Kesalahan',
        description: result.message,
      });
    }
    setIsDeleting(null);
  };

  const openPdf = (dataUrl: string) => {
    const pdfWindow = window.open("");
    pdfWindow?.document.write(`<iframe width='100%' height='100%' src='${dataUrl}' title='pratinjau-pdf'></iframe>`);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedShipments(shipments.map((s) => s.id));
    } else {
      setSelectedShipments([]);
    }
  };

  const handleSelectSingle = (shipmentId: string, checked: boolean) => {
    if (checked) {
      setSelectedShipments((prev) => [...prev, shipmentId]);
    } else {
      setSelectedShipments((prev) => prev.filter((id) => id !== shipmentId));
    }
  };

  const handleExportPdf = () => {
    const doc = new jsPDF() as jsPDFWithAutoTable;
    
    doc.text('Laporan Data Pengiriman', 14, 16);
    
    const tableData = selectedShipments
      .map(id => shipments.find(s => s.id === id))
      .filter((shipment): shipment is Shipment => !!shipment)
      .map(shipment => {
        const products = shipment.products.map(p => `${p.name} (x${p.quantity})`).join('\n');
        return [
          shipment.user,
          shipment.transactionId,
          shipment.expedition,
          shipment.receipt.fileName,
          products,
          shipment.totalItems,
          format(new Date(shipment.createdAt), 'PPpp', { locale: id })
        ];
    });

    doc.autoTable({
      head: [['User', 'No. Transaksi', 'Ekspedisi', 'Resi', 'Produk', 'Total Item', 'Tanggal Dibuat']],
      body: tableData,
      startY: 20,
      styles: {
        fontSize: 8
      },
      headStyles: {
        fillColor: [36, 128, 75]
      }
    });

    doc.save(`laporan-pengiriman-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end gap-2">
        <Button onClick={handleExportPdf} disabled={selectedShipments.length === 0}>
            <Download className="mr-2" />
            Ekspor ke PDF ({selectedShipments.length})
        </Button>
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setIsFormOpen(true)}>
              <PlusCircle className="mr-2" />
              Tambah Pengiriman
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>Tambah Data Pengiriman Baru</DialogTitle>
            </DialogHeader>
            <ShipmentForm
              onSuccess={(newShipments) => {
                setShipments(newShipments)
                setIsFormOpen(false)
              }}
              onCancel={() => setIsFormOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">
                <Checkbox
                    checked={selectedShipments.length === shipments.length && shipments.length > 0}
                    onCheckedChange={handleSelectAll}
                    aria-label="Pilih semua"
                />
              </TableHead>
              <TableHead>User</TableHead>
              <TableHead>No. Transaksi</TableHead>
              <TableHead>Ekspedisi</TableHead>
              <TableHead>Resi</TableHead>
              <TableHead>Produk</TableHead>
              <TableHead className="text-right">Total Item</TableHead>
              <TableHead>Tanggal Dibuat</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {shipments.length > 0 ? (
              shipments.map((shipment) => (
                <TableRow key={shipment.id} data-state={selectedShipments.includes(shipment.id) && "selected"}>
                  <TableCell>
                      <Checkbox
                        checked={selectedShipments.includes(shipment.id)}
                        onCheckedChange={(checked) => handleSelectSingle(shipment.id, !!checked)}
                        aria-label={`Pilih pengiriman ${shipment.transactionId}`}
                      />
                  </TableCell>
                  <TableCell className="font-medium">{shipment.user}</TableCell>
                  <TableCell>{shipment.transactionId}</TableCell>
                  <TableCell>{shipment.expedition}</TableCell>
                  <TableCell>
                    <Button variant="link" className="p-0 h-auto" onClick={() => openPdf(shipment.receipt.dataUrl)}>
                        <FileText className="mr-2 h-4 w-4" />
                        {shipment.receipt.fileName}
                    </Button>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      {shipment.products.map((p, index) => (
                        <Badge key={index} variant="secondary">
                          {p.name} (x${p.quantity})
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">{shipment.totalItems}</TableCell>
                   <TableCell>
                    {isClient ? (
                        format(new Date(shipment.createdAt), 'PPpp', { locale: id })
                    ) : (
                        <Skeleton className="h-4 w-3/4" />
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" disabled={!!isDeleting}>
                            {isDeleting === shipment.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Apakah Anda yakin?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Tindakan ini tidak dapat dibatalkan. Ini akan menghapus data pengiriman secara permanen.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Batal</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => onDelete(shipment.id)}
                            disabled={!!isDeleting}
                          >
                            Lanjutkan
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={9} className="h-24 text-center">
                  Tidak ada data pengiriman.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
          {shipments.length > 0 && (
            <TableCaption>Daftar pengiriman barang masuk.</TableCaption>
          )}
        </Table>
      </div>
    </div>
  );
}
