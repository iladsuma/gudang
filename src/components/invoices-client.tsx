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
    if (number === 0) return '-';
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
    doc.text('FAKTUR PENGIRIMAN', 105, 20, { align: 'center' });
    doc.setFontSize(10);
    doc.text('GudangCheckout Inc.', 14, 30);
    doc.text('Jl. Merdeka No. 17', 14, 35);
    doc.text('Jakarta, Indonesia', 14, 40);
    
    // Invoice Info
    doc.setFontSize(12);
    doc.text('Pengirim:', 14, 55);
    doc.text(checkout.customerName, 14, 60);

    doc.text(`No. Faktur: INV-${checkout.transactionId}`, 140, 55);
    doc.text(`Tanggal: ${format(new Date(checkout.createdAt), 'P', { locale: id })}`, 140, 60);
    
    // Table
    const tableData = checkout.items.map(item => [
      item.name,
      item.quantity,
    ]);

    doc.autoTable({
      head: [['Deskripsi Produk', 'Jumlah']],
      body: tableData,
      startY: 70,
      headStyles: {
        fillColor: [36, 128, 75]
      }
    });

    // Total
    const finalY = doc.autoTable.previous.finalY;
    doc.setFontSize(12);
    doc.text('Total Item:', 140, finalY + 10);
    doc.setFont('helvetica', 'bold');
    doc.text(String(checkout.totalItems), 170, finalY + 10);
    
    // Footer
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Dokumen ini adalah bukti penerimaan barang.', 105, finalY + 30, { align: 'center' });

    doc.save(`faktur-${checkout.transactionId}.pdf`);
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>No. Transaksi</TableHead>
            <TableHead>Asal/User</TableHead>
            <TableHead>Tanggal Diproses</TableHead>
            <TableHead className="text-right">Total Item</TableHead>
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
                <TableCell className="text-right">{checkout.totalItems}</TableCell>
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
        <TableCaption>Daftar pengiriman yang siap dibuatkan faktur.</TableCaption>
      </Table>
    </div>
  );
}