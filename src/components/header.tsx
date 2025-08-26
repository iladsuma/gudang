

'use client';

import Link from 'next/link';
import { Boxes, LogOut, ShoppingCart, LayoutDashboard, Archive, PackageCheck, Settings, Send, Users } from 'lucide-react';
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
import { useCart } from '@/hooks/use-cart';
import { Badge } from './ui/badge';


export function Header() {
  const { user, logout } = useAuth();
  const { totalItems } = useCart();
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const isSettingsPage = pathname.startsWith('/settings');

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-screen-2xl items-center">
        <div className="mr-4 flex flex-1 items-center justify-between">
          <div className='flex items-center'>
            <Link href="/" className="mr-6 flex items-center space-x-2">
              <Boxes className="h-6 w-6 text-primary" />
              <span className="font-bold sm:inline-block">
                GudangCheckout
              </span>
            </Link>
            {user && (
              <nav className="hidden items-center gap-4 text-sm md:flex">
                {user.role === 'admin' && (
                    <Link
                        href="/dashboard"
                        className={cn("flex items-center gap-2 transition-colors hover:text-foreground/80", pathname === '/dashboard' ? 'text-foreground' : 'text-foreground/60')}
                    >
                       <LayoutDashboard className="h-4 w-4" /> Dashboard
                    </Link>
                )}
                 <Link
                  href="/shipments"
                  className={cn("transition-colors flex items-center gap-2 hover:text-foreground/80", pathname.startsWith('/shipments') ? 'text-foreground' : 'text-foreground/60')}
                >
                   <Send className="h-4 w-4" /> {user.role === 'admin' ? 'Antrian Proses' : 'Pengiriman Saya'}
                </Link>
                 <Link
                  href="/products"
                  className={cn("transition-colors hover:text-foreground/80", pathname === '/products' ? 'text-foreground' : 'text-foreground/60')}
                >
                  Etalase Produk
                </Link>
                {user.role === 'admin' && (
                  <>
                    <Link
                      href="/invoices"
                      className={cn("transition-colors flex items-center gap-2 hover:text-foreground/80", pathname === '/invoices' ? 'text-foreground' : 'text-foreground/60')}
                    >
                      <Archive className="h-4 w-4" /> Arsip Terkirim
                    </Link>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className={cn("gap-1 px-2 h-auto text-sm transition-colors hover:text-foreground/80", isSettingsPage ? 'text-foreground' : 'text-foreground/60')}>
                            <Settings className="h-4 w-4" /> Pengaturan
                            <ChevronDown className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onSelect={() => router.push('/settings')}>Pengaturan Umum</DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => router.push('/settings/products')}>Produk</DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => router.push('/settings/customers')}>Pelanggan</DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => router.push('/settings/expeditions')}>Ekspedisi</DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => router.push('/settings/packaging')}>Kemasan</DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => router.push('/settings/users')}>Pengguna</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </>
                )}
              </nav>
            )}
          </div>
          <div className="flex items-center gap-4">
             {user && (
                 <Button asChild variant="ghost" size="icon" className='relative'>
                    <Link href="/cart">
                        <ShoppingCart className="h-5 w-5" />
                         {totalItems > 0 && (
                            <Badge
                                variant="destructive"
                                className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center rounded-full p-0 text-xs"
                            >
                                {totalItems}
                            </Badge>
                        )}
                        <span className="sr-only">Keranjang</span>
                    </Link>
                 </Button>
             )}
            {user ? (
              <>
                <span className="text-sm text-muted-foreground hidden sm:inline">
                  Halo, {user.username} ({user.role})
                </span>
                <Button variant="ghost" size="icon" onClick={handleLogout}>
                  <LogOut className="h-4 w-4" />
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
