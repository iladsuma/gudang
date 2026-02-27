'use client';

import Link from 'next/link';
import { LogOut, Archive, Settings, ArrowRightLeft, FileBarChart, ShoppingBasket, ClipboardList, Briefcase, Scissors } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { Button } from './ui/button';
import { useRouter, usePathname } from 'next/navigation';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Header() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };
  
  const isSettingsPage = pathname.startsWith('/settings');
  const isTransactionPage = ['/cashier', '/purchases', '/returns'].includes(pathname);
  const isReportPage = pathname.startsWith('/reports');

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-screen-2xl items-center">
        <div className="mr-4 flex flex-1 items-center justify-between">
          <div className='flex items-center'>
            <Link href="/" className="mr-6 flex items-center space-x-2">
              <Scissors className="h-6 w-6 text-primary" />
              <span className="font-bold sm:inline-block text-primary">
                Butik Anita
              </span>
            </Link>
            {user && (
              <nav className="hidden items-center gap-4 text-sm md:flex">
                {user.role === 'admin' ? (
                  <>
                     <Link
                      href="/shipments"
                      className={cn("transition-colors flex items-center gap-2 hover:text-foreground/80", pathname.startsWith('/shipments') ? 'text-foreground font-medium' : 'text-foreground/60')}
                    >
                       <ShoppingBasket className="h-4 w-4" /> Pemesanan Produk
                    </Link>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className={cn("gap-1 px-2 h-auto text-sm transition-colors hover:text-foreground/80", isTransactionPage ? 'text-foreground font-medium' : 'text-foreground/60')}>
                            <ArrowRightLeft className="h-4 w-4" /> Transaksi
                            <ChevronDown className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onSelect={() => router.push('/cashier')}>Penjualan Langsung (Kasir)</DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => router.push('/purchases')}>Pembelian Bahan (Kain/Alat)</DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => router.push('/returns')}>Retur Penjualan</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className={cn("gap-1 px-2 h-auto text-sm transition-colors hover:text-foreground/80", isReportPage ? 'text-foreground font-medium' : 'text-foreground/60')}>
                            <FileBarChart className="h-4 w-4" /> Laporan
                            <ChevronDown className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onSelect={() => router.push('/reports/sales-profit')}>Laporan Laba Rugi</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>

                    <Link
                      href="/invoices"
                      className={cn("transition-colors flex items-center gap-2 hover:text-foreground/80", pathname === '/invoices' ? 'text-foreground font-medium' : 'text-foreground/60')}
                    >
                      <Archive className="h-4 w-4" /> Arsip
                    </Link>
                    
                    <Link
                      href="/settings"
                      className={cn("transition-colors flex items-center gap-2 hover:text-foreground/80", isSettingsPage ? 'text-foreground font-medium' : 'text-foreground/60')}
                    >
                      <Settings className="h-4 w-4" /> Pengaturan
                    </Link>
                  </>
                ) : (
                    <>
                    <Link
                      href="/shipments"
                      className={cn("transition-colors flex items-center gap-2 hover:text-foreground/80", pathname === '/shipments' ? 'text-foreground font-medium' : 'text-foreground/60')}
                    >
                      <ClipboardList className="h-4 w-4" /> Ambil Pesanan
                    </Link>
                    <Link
                        href="/my-shipments"
                        className={cn("transition-colors flex items-center gap-2 hover:text-foreground/80", pathname.startsWith('/my-shipments') ? 'text-foreground font-medium' : 'text-foreground/60')}
                    >
                       <Briefcase className="h-4 w-4" /> Pekerjaan Saya
                    </Link>
                    </>
                )}
              </nav>
            )}
          </div>
          <div className="flex items-center gap-2">
            {user ? (
              <>
                <div className="flex flex-col items-end mr-2">
                    <span className="text-xs font-semibold text-primary uppercase">
                        {user.role === 'admin' ? 'Pemilik' : 'Penjahit'}
                    </span>
                    <span className="text-sm text-muted-foreground hidden sm:inline">
                        {user.username}
                    </span>
                </div>
                <Button variant="ghost" size="icon" onClick={handleLogout} title="Keluar">
                  <LogOut className="h-4 w-4 text-destructive" />
                </Button>
              </>
            ) : (
               <Button asChild variant="outline" size="sm">
                 <Link href="/login">Login</Link>
               </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
