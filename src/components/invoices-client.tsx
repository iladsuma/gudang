'use client';

import * as React from 'react';
import type { Shipment } from '@/lib/types';
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
import { getShipments } from '@/lib/data';

interface jsPDFWithAutoTable extends jsPDF {
  autoTable: (options: any) => jsPDF;
}

export function InvoicesClient({ checkouts: initialCheckouts }: { checkouts: Shipment[] }) {
  const { user } = useAuth();
  const [shipments, setShipments] = React.useState(initialCheckouts);

  React.useEffect(() => {
     // Fetch fresh data on client mount to ensure it's up to date
    getShipments().then(setShipments);
  }, []);
  
  const formatRupiah = (number: number) => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
    }).format(number);
  };

  const handleCreateInvoice = (shipment: Shipment) => {
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
    const infoX = pageWidth - 90;
    doc.text(`No Transaksi`, infoX, 20);
    doc.text(`: ${shipment.transactionId}`, infoX + 25, 20);
    
    doc.text(`Pelanggan`, infoX, 25);
    doc.text(`: ${shipment.user}`, infoX + 25, 25);

    doc.text(`Alamat`, infoX, 30);
    doc.text(`: -`, infoX + 25, 30);
    
    doc.text(`Tanggal`, infoX, 35);
    doc.text(`: ${format(new Date(shipment.createdAt), 'dd/MM/yyyy HH:mm')}`, infoX + 25, 35);
    
    doc.text(`Kasir`, infoX, 40);
    doc.text(`: ${user?.name || '-'}`, infoX + 25, 40);
    
    doc.text(`Tgl. Jatuh Tempo`, infoX, 45);
    doc.text(`: ${format(new Date(), 'dd/MM/yyyy')}`, infoX + 25, 45);


    // Table
    const tableData = shipment.products.map((item, index) => {
       const subtotal = item.price * item.quantity * (1 - (item.discount || 0) / 100);
       return [
        index + 1,
        item.name,
        `${item.quantity}`,
        'PCS',
        item.price.toLocaleString('id-ID'),
        `${item.discount}%`,
        subtotal.toLocaleString('id-ID'),
       ]
    });

    doc.autoTable({
      head: [['No.', 'Nama Item', 'Jml', 'Satuan', 'Harga', 'Diskon', 'Total']],
      body: tableData,
      startY: 55,
      headStyles: {
        fillColor: [34, 197, 94], // green-500
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
    const subTotal = shipment.products.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const totalDiscount = shipment.products.reduce((sum, item) => sum + (item.price * item.quantity * (item.discount/100)), 0);


    doc.text(`Jml Item`, summaryX, footerY);
    doc.text(`: ${shipment.totalItems}`, summaryX + 25, footerY);

    doc.text(`Sub Total`, summaryX, footerY + 5);
    doc.text(`: ${subTotal.toLocaleString('id-ID')}`, summaryX + 25, footerY + 5);
    
    doc.text(`Potongan`, summaryX, footerY + 10);
    doc.text(`: ${totalDiscount.toLocaleString('id-ID')}`, summaryX + 25, footerY + 10);
    
    doc.text(`Biaya Lain`, summaryX, footerY + 15);
    doc.text(`: 0`, summaryX + 25, footerY + 15);
    
    doc.setFont('helvetica', 'bold');
    doc.text(`Total Akhir`, summaryX, footerY + 20);
    doc.text(`: ${shipment.totalAmount.toLocaleString('id-ID')}`, summaryX + 25, footerY + 20);
    doc.setFont('helvetica', 'normal');


    // Signature Section
    const signatureY = pageHeight - 40;
    doc.text('Hormat Kami', 20, signatureY);
    doc.text('Penerima', 150, signatureY);
    doc.text('(..................)', 14, signatureY + 20);
    doc.text('(..................)', 144, signatureY + 20);


    doc.save(`faktur-${shipment.transactionId}.pdf`);
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>No. Transaksi</TableHead>
            <TableHead>Asal/User</TableHead>
            <TableHead>Tanggal Dibuat</TableHead>
            <TableHead className="text-right">Total Nilai</TableHead>
            <TableHead className="text-right">Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {shipments.length > 0 ? (
            shipments.map((shipment) => (
              <TableRow key={shipment.id}>
                <TableCell className="font-medium">{shipment.transactionId}</TableCell>
                <TableCell>{shipment.user}</TableCell>
                <TableCell>{format(new Date(shipment.createdAt), 'PP', { locale: id })}</TableCell>
                <TableCell className="text-right font-medium">{formatRupiah(shipment.totalAmount)}</TableCell>
                <TableCell className="text-right">
                  <Button variant="outline" size="sm" onClick={() => handleCreateInvoice(shipment)}>
                    <Download className="mr-2 h-4 w-4" />
                    Buat Faktur
                  </Button>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={5} className="h-24 text-center">
                Tidak ada data untuk dibuatkan faktur. Tambah data di Lacak Pengiriman.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
        {shipments.length > 0 && <TableCaption>Daftar pengiriman yang siap dibuatkan faktur.</TableCaption>}
      </Table>
    </div>
  );
}
