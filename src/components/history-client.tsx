'use client';

import { useState, useMemo } from 'react';
import type { Transaction } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarIcon, X } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { format, isValid, startOfDay, endOfDay } from 'date-fns';
import { id } from 'date-fns/locale';
import type { DateRange } from 'react-day-picker';
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

export function HistoryClient({ transactions }: { transactions: Transaction[] }) {
  const [customerFilter, setCustomerFilter] = useState('');
  const [dateFilter, setDateFilter] = useState<DateRange | undefined>(undefined);

  const filteredTransactions = useMemo(() => {
    return transactions.filter((transaction) => {
      const customerMatch = transaction.customerName
        .toLowerCase()
        .includes(customerFilter.toLowerCase());
      
      const transactionDate = new Date(transaction.date);
      let dateMatch = true;
      if (dateFilter?.from && dateFilter?.to) {
        dateMatch = transactionDate >= startOfDay(dateFilter.from) && transactionDate <= endOfDay(dateFilter.to);
      } else if (dateFilter?.from) {
        dateMatch = transactionDate >= startOfDay(dateFilter.from);
      }

      return customerMatch && dateMatch;
    });
  }, [transactions, customerFilter, dateFilter]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 md:flex-row">
        <Input
          placeholder="Filter berdasarkan nama pelanggan..."
          value={customerFilter}
          onChange={(e) => setCustomerFilter(e.target.value)}
          className="max-w-sm"
        />
        <div className="flex items-center gap-2">
            <Popover>
            <PopoverTrigger asChild>
                <Button
                variant={'outline'}
                className="w-full justify-start text-left font-normal md:w-[280px]"
                >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateFilter?.from ? (
                    dateFilter.to ? (
                    <>
                        {format(dateFilter.from, 'LLL dd, y', { locale: id })} -{' '}
                        {format(dateFilter.to, 'LLL dd, y', { locale: id })}
                    </>
                    ) : (
                    format(dateFilter.from, 'LLL dd, y', { locale: id })
                    )
                ) : (
                    <span>Pilih rentang tanggal</span>
                )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                initialFocus
                mode="range"
                defaultMonth={dateFilter?.from}
                selected={dateFilter}
                onSelect={setDateFilter}
                numberOfMonths={2}
                locale={id}
                />
            </PopoverContent>
            </Popover>
            {dateFilter && (
                <Button variant="ghost" size="icon" onClick={() => setDateFilter(undefined)}>
                    <X className="h-4 w-4" />
                </Button>
            )}
        </div>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tanggal</TableHead>
              <TableHead>Pelanggan</TableHead>
              <TableHead>Item</TableHead>
              <TableHead className="text-right">Total Kuantitas</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTransactions.length > 0 ? (
              filteredTransactions.map((tx) => (
                <TableRow key={tx.id}>
                  <TableCell className="font-medium">
                    {format(new Date(tx.date), 'PPpp', { locale: id })}
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
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center">
                  Tidak ada transaksi ditemukan.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
          {filteredTransactions.length > 0 && (
            <TableCaption>Daftar checkout terakhir Anda.</TableCaption>
          )}
        </Table>
      </div>
    </div>
  );
}
