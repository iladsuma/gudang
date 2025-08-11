'use client';

import { useState, useEffect } from 'react';
import type { Transaction, CheckoutItem } from '@/lib/types';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { Button } from '@/components/ui/button';
import { FileText } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableCaption,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from './ui/skeleton';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

interface jsPDFWithAutoTable extends jsPDF {
  autoTable: (options: any) => jsPDF;
}

export function InvoicesClient({ transactions }: { transactions: Transaction[] }) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const generateInvoice = (transaction: Transaction) => {
    const doc = new jsPDF() as jsPDFWithAutoTable;
    
    // Header
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('FAKTUR PENJUALAN', 105, 20, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('GudangCheckout Inc.', 14, 30);
    doc.text('Jl. Merdeka No. 123', 14, 35);
    doc.text('Jakarta, Indonesia', 14, 40);

    // Invoice Info
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Kepada:', 14, 60);
    doc.setFont('helvetica', 'normal');
    doc.text(transaction.customerName, 14, 67);

    doc.setFont('helvetica', 'bold');
    doc.text('No. Faktur:', 140, 60);
    doc.setFont('helvetica', 'normal');
    doc.text(transaction.id.replace('txn_', 'INV-'), 170, 60);
    
    doc.setFont('helvetica', 'bold');
    doc.text('Tanggal:', 140, 67);
    doc.setFont('helvetica', 'normal');
    doc.text(format(new Date(transaction.date), 'dd MMMM yyyy', { locale: id }), 170, 67);

    // Table
    const tableData = transaction.items.map((item: CheckoutItem) => {
      // Dummy price, since it's not in the data model
      const price = (parseInt(item.id, 10) * 10000) + 50000;
      const total = price * item.quantity;
      return [
        item.code,
        item.name,
        item.quantity,
        `Rp ${price.toLocaleString('id-ID')}`,
        `Rp ${total.toLocaleString('id-ID')}`
      ];
    });

    const subTotal = transaction.items.reduce((sum, item) => {
        const price = (parseInt(item.id, 10) * 10000) + 50000;
        return sum + (price * item.quantity);
    }, 0);
    const biayaLain = subTotal * 0.1; // Example: 10% for other costs
    const totalAkhir = subTotal + biayaLain;

    doc.autoTable({
      head: [['Kode', 'Produk', 'Jumlah', 'Harga Satuan', 'Total']],
      body: tableData,
      startY: 80,
      headStyles: {
        fillColor: [36, 128, 75]
      },
      styles: {
          fontSize: 10,
      }
    });

    // Totals
    const finalY = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Sub Total:', 140, finalY);
    doc.setFont('helvetica', 'normal');
    doc.text(`Rp ${subTotal.toLocaleString('id-ID')}`, 200, finalY, { align: 'right' });

    doc.setFont('helvetica', 'bold');
    doc.text('Biaya Lain:', 140, finalY + 7);
    doc.setFont('helvetica', 'normal');
    doc.text(`Rp ${biayaLain.toLocaleString('id-ID')}`, 200, finalY + 7, { align: 'right' });
    
    doc.setFont('helvetica', 'bold');
    doc.text('Total Akhir:', 140, finalY + 14);
    doc.setFont('helvetica', 'normal');
    doc.text(`Rp ${totalAkhir.toLocaleString('id-ID')}`, 200, finalY + 14, { align: 'right' });

    // Footer
    doc.setFontSize(10);
    doc.text('Terima kasih atas transaksi Anda.', 105, doc.internal.pageSize.height - 20, { align: 'center' });


    doc.save(`faktur-${transaction.id}.pdf`);
  };

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tanggal</TableHead>
              <TableHead>Pelanggan</TableHead>
              <TableHead>Item</TableHead>
              <TableHead className="text-right">Total Kuantitas</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.length > 0 ? (
              transactions.map((tx) => (
                <TableRow key={tx.id}>
                  <TableCell className="font-medium">
                    {isClient ? (
                        format(new Date(tx.date), 'PPpp', { locale: id })
                    ) : (
                        <Skeleton className="h-4 w-3/4" />
                    )}
                  </TableCell>
                  <TableCell>{tx.customerName}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {tx.items.map((item) => (
                        <Badge key={item.id} variant="secondary">
                          {item.name} (x{item.quantity})
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">{tx.totalItems}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" onClick={() => generateInvoice(tx)}>
                      <FileText className="mr-2 h-4 w-4" />
                      Buat Faktur
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  Tidak ada transaksi untuk dibuatkan faktur.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
          {transactions.length > 0 && (
            <TableCaption>Daftar transaksi penjualan.</TableCaption>
          )}
        </Table>
      </div>
    </div>
  );
}
