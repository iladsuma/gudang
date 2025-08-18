
'use client';

import Link from 'next/link';
import { Boxes, LogOut } from 'lucide-react';
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
              <nav className="flex items-center gap-4 text-sm">
                 <Link
                  href="/shipments"
                  className={cn("transition-colors hover:text-foreground/80", pathname === '/shipments' ? 'text-foreground' : 'text-foreground/60')}
                >
                  Rekap Pengiriman
                </Link>
                {user.role === 'admin' && (
                  <>
                    <Link
                      href="/history"
                      className={cn("transition-colors hover:text-foreground/80", pathname === '/history' ? 'text-foreground' : 'text-foreground/60')}
                    >
                      Riwayat
                    </Link>
                    <Link
                      href="/invoices"
                      className={cn("transition-colors hover:text-foreground/80", pathname === '/invoices' ? 'text-foreground' : 'text-foreground/60')}
                    >
                      Faktur
                    </Link>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className={cn("gap-1 px-2 h-auto text-sm transition-colors hover:text-foreground/80", isSettingsPage ? 'text-foreground' : 'text-foreground/60')}>
                            Pengaturan
                            <ChevronDown className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onSelect={() => router.push('/settings')}>Pengaturan Umum</DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => router.push('/settings/products')}>Produk</DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => router.push('/settings/expeditions')}>Ekspedisi</DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => router.push('/settings/packaging')}>Kemasan</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </>
                )}
              </nav>
            )}
          </div>
          <div className="flex items-center gap-4">
            {user ? (
              <>
                <span className="text-sm text-muted-foreground">
                  Halo, {user.name} ({user.role})
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
