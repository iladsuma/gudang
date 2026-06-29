'use client';

import * as React from 'react';
import Link from 'next/link';
import { LogOut, Archive, Settings, ArrowRightLeft, FileBarChart, ShoppingBasket, ClipboardList, Briefcase, Scissors, ChevronDown, Menu } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { Button } from './ui/button';
import { useRouter, usePathname } from 'next/navigation';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Sheet,
    SheetContent,
    SheetTrigger,
    SheetTitle,
} from "@/components/ui/sheet";
import { cn } from '@/lib/utils';

export function Header() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = React.useState(false);
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };
  
  const isSettingsPage = pathname.startsWith('/settings');
  const isTransactionPage = pathname === '/receivables';
  const isReportPage = pathname.startsWith('/reports') || pathname === '/dashboard' || pathname === '/accounting';

  const NavLinks = () => {
    if (!user) return null;
    
    if (user.role === 'admin') {
      return (
        <>
          <Link
            href="/shipments"
            onClick={() => setOpen(false)}
            className={cn("flex items-center gap-2 transition-colors hover:text-foreground/80", pathname.startsWith('/shipments') ? 'text-foreground font-semibold' : 'text-foreground/60')}
          >
            <ShoppingBasket className="h-4 w-4" /> Pesanan Baru
          </Link>
          
          <Link
            href="/receivables"
            onClick={() => setOpen(false)}
            className={cn("flex items-center gap-2 transition-colors hover:text-foreground/80", isTransactionPage ? 'text-foreground font-semibold' : 'text-foreground/60')}
          >
            <ArrowRightLeft className="h-4 w-4" /> Transaksi
          </Link>

          {/* Desktop Dropdown */}
          <div className="hidden md:block">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className={cn("gap-1 px-2 h-auto text-sm transition-colors hover:text-foreground/80 font-normal", isReportPage ? 'text-foreground font-semibold' : 'text-foreground/60')}>
                    <FileBarChart className="h-4 w-4" /> Laporan
                    <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onSelect={() => router.push('/dashboard')}>Ringkasan Dashboard</DropdownMenuItem>
                <DropdownMenuItem onSelect={() => router.push('/reports/sales-profit')}>Laba / Rugi</DropdownMenuItem>
                <DropdownMenuItem onSelect={() => router.push('/accounting')}>Buku Kas & Saldo</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Mobile Report Links (Flattened) */}
          <div className="flex flex-col gap-4 md:hidden">
             <p className="text-[10px] uppercase font-bold text-muted-foreground mt-2">Laporan</p>
             <Link href="/dashboard" onClick={() => setOpen(false)} className={cn("flex items-center gap-2 pl-2 text-sm", pathname === '/dashboard' ? 'text-primary font-medium' : 'text-foreground/60')}>Dashboard</Link>
             <Link href="/reports/sales-profit" onClick={() => setOpen(false)} className={cn("flex items-center gap-2 pl-2 text-sm", pathname === '/reports/sales-profit' ? 'text-primary font-medium' : 'text-foreground/60')}>Laba / Rugi</Link>
             <Link href="/accounting" onClick={() => setOpen(false)} className={cn("flex items-center gap-2 pl-2 text-sm", pathname === '/accounting' ? 'text-primary font-medium' : 'text-foreground/60')}>Buku Kas</Link>
          </div>

          <Link
            href="/invoices"
            onClick={() => setOpen(false)}
            className={cn("flex items-center gap-2 transition-colors hover:text-foreground/80", pathname === '/invoices' ? 'text-foreground font-semibold' : 'text-foreground/60')}
          >
            <Archive className="h-4 w-4" /> Arsip
          </Link>
          
          <Link
            href="/settings"
            onClick={() => setOpen(false)}
            className={cn("flex items-center gap-2 transition-colors hover:text-foreground/80", isSettingsPage ? 'text-foreground font-semibold' : 'text-foreground/60')}
          >
            <Settings className="h-4 w-4" /> Pengaturan
          </Link>
        </>
      );
    } else {
      return (
        <>
          <Link
            href="/shipments"
            onClick={() => setOpen(false)}
            className={cn("flex items-center gap-2 transition-colors hover:text-foreground/80", pathname.startsWith('/shipments') ? 'text-foreground font-semibold' : 'text-foreground/60')}
          >
            <ClipboardList className="h-4 w-4" /> Ambil Pesanan
          </Link>
          <Link
              href="/my-shipments"
              onClick={() => setOpen(false)}
              className={cn("flex items-center gap-2 transition-colors hover:text-foreground/80", pathname.startsWith('/my-shipments') ? 'text-foreground font-semibold' : 'text-foreground/60')}
          >
             <Briefcase className="h-4 w-4" /> Pekerjaan Saya
          </Link>
        </>
      );
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-screen-2xl items-center">
        {/* Mobile Menu Trigger */}
        {mounted && user && (
            <div className="md:hidden mr-2">
                <Sheet open={open} onOpenChange={setOpen}>
                    <SheetTrigger asChild>
                        <Button variant="ghost" size="icon">
                            <Menu className="h-5 w-5" />
                            <span className="sr-only">Toggle Menu</span>
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="w-[280px] sm:w-[350px] overflow-y-auto">
                        <SheetTitle className="flex items-center gap-2 text-primary mb-6">
                            <Scissors className="h-6 w-6" />
                            Butik Anita
                        </SheetTitle>
                        <nav className="flex flex-col gap-6 text-sm">
                            <NavLinks />
                        </nav>
                        <div className="mt-8 pt-8 border-t">
                             <div className="flex items-center gap-3 mb-4 px-2">
                                <div className="flex flex-col">
                                    <span className="text-xs font-bold text-primary uppercase">{user.role === 'admin' ? 'Pemilik' : 'Penjahit'}</span>
                                    <span className="text-sm font-medium">{user.username}</span>
                                </div>
                             </div>
                             <Button variant="outline" className="w-full justify-start text-destructive hover:text-destructive" onClick={handleLogout}>
                                <LogOut className="mr-2 h-4 w-4" /> Keluar
                             </Button>
                        </div>
                    </SheetContent>
                </Sheet>
            </div>
        )}

        <div className="mr-4 flex flex-1 items-center justify-between">
          <div className='flex items-center'>
            <Link href="/" className="mr-6 flex items-center space-x-2">
              <Scissors className="h-6 w-6 text-primary" />
              <span className="font-bold hidden sm:inline-block text-primary">Butik Anita</span>
            </Link>
            
            {/* Desktop Navigation */}
            {mounted && user && (
              <nav className="hidden md:flex items-center gap-4 text-sm">
                <NavLinks />
              </nav>
            )}
          </div>

          <div className="flex items-center gap-2">
            {mounted && user ? (
              <div className="flex items-center">
                <div className="hidden sm:flex flex-col items-end mr-3">
                    <span className="text-[10px] font-bold text-primary uppercase leading-tight">
                        {user.role === 'admin' ? 'Pemilik' : 'Penjahit'}
                    </span>
                    <span className="text-sm text-muted-foreground font-medium">
                        {user.username}
                    </span>
                </div>
                <Button variant="ghost" size="icon" className="hidden sm:flex" onClick={handleLogout} title="Keluar">
                  <LogOut className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ) : mounted ? (
               <Button asChild variant="outline" size="sm">
                 <Link href="/login">Login</Link>
               </Button>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  );
}
