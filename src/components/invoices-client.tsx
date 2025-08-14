'use client';

import * as React from 'react';
import type { Checkout } from '@/lib/types';
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
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

interface jsPDFWithAutoTable extends jsPDF {
  autoTable: (options: any) => jsPDF;
}

export function InvoicesClient({ checkouts }: { checkouts: Checkout[] }) {
  const formatRupiah = (number: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(number);
  };

  const handleCreateInvoice = (checkout: Checkout) => {
    const doc = new jsPDF() as jsPDFWithAutoTable;

    // Header
    doc.setFontSize(20);
    doc.text('FAKTUR PENJUALAN', 105, 20, { align: 'center' });
    doc.setFontSize(10);
    doc.text('GudangCheckout Inc.', 14, 30);
    doc.text('Jl. Merdeka No. 17', 14, 35);
    doc.text('Jakarta, Indonesia', 14, 40);
    
    // Invoice Info
    doc.setFontSize(12);
    doc.text('Kepada:', 14, 55);
    doc.text(checkout.customerName, 14, 60);

    doc.text(`No. Faktur: ${checkout.transactionId}`, 140, 55);
    doc.text(`Tanggal: ${format(new Date(checkout.createdAt), 'P', { locale: id })}`, 140, 60);
    
    // Table
    const tableData = checkout.items.map(item => [
      item.name,
      item.quantity,
      formatRupiah(item.price),
      formatRupiah(item.quantity * item.price),
    ]);

    doc.autoTable({
      head: [['Deskripsi Produk', 'Jumlah', 'Harga Satuan', 'Subtotal']],
      body: tableData,
      startY: 70,
      headStyles: {
        fillColor: [36, 128, 75]
      }
    });

    // Total
    const finalY = doc.autoTable.previous.finalY;
    doc.setFontSize(12);
    doc.text('Total:', 140, finalY + 10);
    doc.setFont('helvetica', 'bold');
    doc.text(formatRupiah(checkout.totalAmount), 160, finalY + 10);
    
    // Footer
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Terima kasih atas bisnis Anda.', 105, finalY + 30, { align: 'center' });

    doc.save(`faktur-${checkout.transactionId}.pdf`);
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>No. Transaksi</TableHead>
            <TableHead>Pelanggan</TableHead>
            <TableHead>Tanggal</TableHead>
            <TableHead className="text-right">Total</TableHead>
            <TableHead className="text-right">Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {checkouts.length > 0 ? (
            checkouts.map((checkout) => (
              <TableRow key={checkout.id}>
                <TableCell className="font-medium">{checkout.transactionId}</TableCell>
                <TableCell>{checkout.customerName}</TableCell>
                <TableCell>{format(new Date(checkout.createdAt), 'PP', { locale: id })}</TableCell>
                <TableCell className="text-right">{formatRupiah(checkout.totalAmount)}</TableCell>
                <TableCell className="text-right">
                  <Button variant="outline" size="sm" onClick={() => handleCreateInvoice(checkout)}>
                    <Download className="mr-2 h-4 w-4" />
                    Buat Faktur
                  </Button>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={5} className="h-24 text-center">
                Tidak ada data untuk dibuatkan faktur.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
        <TableCaption>Daftar transaksi yang siap dibuatkan faktur.</TableCaption>
      </Table>
    </div>
  );
}
