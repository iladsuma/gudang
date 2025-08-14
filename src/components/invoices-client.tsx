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
import { useAuth } from '@/context/auth-context';

interface jsPDFWithAutoTable extends jsPDF {
  autoTable: (options: any) => jsPDF;
}

export function InvoicesClient({ checkouts }: { checkouts: Checkout[] }) {
  const { user } = useAuth();

  const handleCreateInvoice = (checkout: Checkout) => {
    const doc = new jsPDF() as jsPDFWithAutoTable;
    const pageHeight = doc.internal.pageSize.height || doc.internal.pageSize.get('height');
    const pageWidth = doc.internal.pageSize.width || doc.internal.pageSize.get('width');

    // Set Font
    doc.setFont('helvetica');

    // Header
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('FAKTUR PENJUALAN', 14, 20);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('GudangCheckout', 14, 26);
    doc.text('Jl. Raya Aplikasi No. 1, Jakarta', 14, 31);

    // Info Section
    const infoX = pageWidth - 80;
    doc.text(`No Transaksi`, infoX, 20);
    doc.text(`: ${checkout.transactionId}`, infoX + 20, 20);
    
    doc.text(`Pelanggan`, infoX, 25);
    doc.text(`: ${checkout.customerName}`, infoX + 20, 25);

    doc.text(`Alamat`, infoX, 30);
    doc.text(`: -`, infoX + 20, 30);
    
    doc.text(`Tgl`, infoX, 35);
    doc.text(`: ${format(new Date(checkout.createdAt), 'dd/MM/yyyy HH:mm')}`, infoX + 20, 35);
    
    doc.text(`Kasir`, infoX, 40);
    doc.text(`: ${user?.name || '-'}`, infoX + 20, 40);
    
    doc.text(`Tgl. Jt`, infoX, 45);
    doc.text(`: ${format(new Date(), 'dd/MM/yyyy')}`, infoX + 20, 45);


    // Table
    const tableData = checkout.items.map((item, index) => [
      index + 1,
      item.name,
      `${item.quantity}`,
      'PCS',
      '0', // Harga - tidak ada data
      '0', // Diskon - tidak ada data
      '0', // Total - tidak ada data
    ]);

    doc.autoTable({
      head: [['No.', 'Nama Item', 'Jml', 'Satuan', 'Harga', 'Diskon', 'Total']],
      body: tableData,
      startY: 55,
      headStyles: {
        fillColor: [22, 163, 74],
        textColor: 255,
        fontStyle: 'bold',
      },
      theme: 'grid',
      columnStyles: {
        0: { cellWidth: 10, halign: 'center' },
        2: { cellWidth: 15, halign: 'center' },
        3: { cellWidth: 15, halign: 'center' },
        4: { halign: 'right' },
        5: { halign: 'right' },
        6: { halign: 'right' },
      }
    });

    const finalY = doc.autoTable.previous.finalY;

    // Footer
    const footerY = finalY + 10;
    doc.setFontSize(10);

    // Summary section
    const summaryX = pageWidth - 80;
    doc.text(`Jml Item`, summaryX, footerY);
    doc.text(`: ${checkout.totalItems}`, summaryX + 20, footerY);

    doc.text(`Sub Total`, summaryX, footerY + 5);
    doc.text(`: 0`, summaryX + 20, footerY + 5);
    
    doc.text(`Potongan`, summaryX, footerY + 10);
    doc.text(`: 0`, summaryX + 20, footerY + 10);
    
    doc.text(`Biaya Lain`, summaryX, footerY + 15);
    doc.text(`: 0`, summaryX + 20, footerY + 15);
    
    doc.setFont('helvetica', 'bold');
    doc.text(`Total Akhir`, summaryX, footerY + 20);
    doc.text(`: 0`, summaryX + 20, footerY + 20);
    doc.setFont('helvetica', 'normal');


    // Signature Section
    doc.text('Hormat Kami', 20, footerY + 5);
    doc.text('Penerima', 80, footerY + 5);
    doc.text('(..................)', 14, footerY + 25);
    doc.text('(..................)', 74, footerY + 25);


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
        {checkouts.length > 0 && <TableCaption>Daftar pengiriman yang siap dibuatkan faktur.</TableCaption>}
      </Table>
    </div>
  );
}
