'use client';

import { useState, useEffect } from 'react';
import type { Shipment } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { PlusCircle, Trash2, Loader2, FileText, Printer } from 'lucide-react';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
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
import { deleteShipment, processAndMoveToHistory, getShipments } from '@/lib/data';

export function ShipmentsClient({ shipments: initialShipments }: { shipments: Shipment[] }) {
  const [shipments, setShipments] = useState(initialShipments);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedShipments, setSelectedShipments] = useState<string[]>([]);
  const { toast } = useToast();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setShipments(initialShipments);
  }, [initialShipments]);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const refreshShipments = async () => {
    const freshShipments = await getShipments();
    setShipments(freshShipments);
  };

  const handleFormSuccess = (newShipment: Shipment) => {
    setShipments((prev) => [newShipment, ...prev]);
    setIsFormOpen(false);
  };
  
  const onDelete = async (shipmentId: string) => {
    setIsDeleting(shipmentId);
    try {
        await deleteShipment(shipmentId);
        setShipments((prev) => prev.filter((s) => s.id !== shipmentId));
        setSelectedShipments((prev) => prev.filter((id) => id !== shipmentId));
        toast({
            title: 'Sukses!',
            description: 'Data pengiriman berhasil dihapus.',
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Terjadi kesalahan.';
        toast({
            variant: 'destructive',
            title: 'Kesalahan',
            description: message,
        });
    } finally {
        setIsDeleting(null);
    }
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

  const handleProcessAndPrintReceipts = async () => {
    if (selectedShipments.length === 0) {
        toast({
            variant: 'destructive',
            title: 'Tidak Ada Resi Terpilih',
            description: 'Pilih setidaknya satu resi untuk diproses.'
        });
        return;
    }

    setIsProcessing(true);

    try {
        const shipmentsToProcess = selectedShipments
            .map(id => shipments.find(s => s.id === id))
            .filter((s): s is Shipment => !!s);
        
        await processAndMoveToHistory(selectedShipments);
       
        const mergedPdf = await PDFDocument.create();
        const font = await mergedPdf.embedFont(StandardFonts.HelveticaBold);

        for (const [index, shipment] of shipmentsToProcess.entries()) {
            const pdfDataUrl = shipment.receipt.dataUrl;
            const base64 = pdfDataUrl.split(',')[1];
            if (!base64) {
                console.error('Invalid Data URL for PDF:', pdfDataUrl);
                continue; // Skip if data URL is malformed
            }
            const existingPdfBytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
            const pdfDoc = await PDFDocument.load(existingPdfBytes);
            
            const copiedPages = await mergedPdf.copyPages(pdfDoc, pdfDoc.getPageIndices());

            // Add marker to the first page of the copied document
            const { height } = copiedPages[0].getSize();
            copiedPages[0].drawText(`resi-sel-${index + 1}`, {
                x: 20,
                y: height - 25,
                font: font,
                size: 14,
                color: rgb(0.9, 0.1, 0.1),
            });

            copiedPages.forEach((page) => mergedPdf.addPage(page));
        }
        
        const mergedPdfBytes = await mergedPdf.save();
        const blob = new Blob([mergedPdfBytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `resi-terpilih-${new Date().toISOString().split('T')[0]}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        toast({
            title: 'Sukses!',
            description: 'Resi berhasil diproses dan file gabungan diunduh.'
        });

        // Update UI locally
        await refreshShipments();
        setSelectedShipments([]);

    } catch (error) {
        console.error("Failed to process or merge PDFs", error);
        const message = error instanceof Error ? error.message : 'Terjadi kesalahan saat memproses resi.';
        toast({
            variant: 'destructive',
            title: 'Gagal Memproses',
            description: message
        });
    } finally {
        setIsProcessing(false);
    }
  };


  return (
    <div className="space-y-4">
      <div className="flex justify-end gap-2">
        <Button onClick={handleProcessAndPrintReceipts} disabled={selectedShipments.length === 0 || isProcessing}>
            {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Printer className="mr-2 h-4 w-4" />}
            Proses & Cetak Resi ({selectedShipments.length})
        </Button>
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Tambah Pengiriman
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>Tambah Data Pengiriman Baru</DialogTitle>
            </DialogHeader>
            <ShipmentForm
              onSuccess={handleFormSuccess}
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
                    checked={shipments.length > 0 && selectedShipments.length === shipments.length}
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
                <TableRow key={shipment.id} data-state={selectedShipments.includes(shipment.id) ? "selected" : undefined}>
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
                          {p.name} (x{p.quantity})
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
            <TableCaption>Daftar pengiriman barang masuk yang belum diproses.</TableCaption>
          )}
        </Table>
      </div>
    </div>
  );
}
