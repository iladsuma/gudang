'use client';

import Link from 'next/link';
import { Boxes, LogOut } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { Button } from './ui/button';
import { useRouter } from 'next/navigation';

export function Header() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

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
              <nav className="flex items-center gap-6 text-sm">
                 <Link
                  href="/"
                  className="text-foreground/60 transition-colors hover:text-foreground/80"
                >
                  Checkout
                </Link>
                <Link
                  href="/shipments"
                  className="text-foreground/60 transition-colors hover:text-foreground/80"
                >
                  Lacak Pengiriman
                </Link>
                {user.role === 'admin' && (
                  <>
                    <Link
                      href="/products"
                      className="text-foreground/60 transition-colors hover:text-foreground/80"
                    >
                      Produk
                    </Link>
                    <Link
                      href="/history"
                      className="text-foreground/60 transition-colors hover:text-foreground/80"
                    >
                      Riwayat
                    </Link>
                    <Link
                      href="/invoices"
                      className="text-foreground/60 transition-colors hover:text-foreground/80"
                    >
                      Faktur
                    </Link>
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
