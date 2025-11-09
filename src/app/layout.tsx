import type { Metadata } from 'next';
import './globals.css';
import { cn } from '@/lib/utils';
import { Toaster } from '@/components/ui/toaster';
import { Header } from '@/components/header';
import { AuthProvider } from '@/context/auth-context';
import { NotificationProvider } from '@/context/notification-context';
import { CartProvider } from '@/hooks/use-cart';

export const metadata: Metadata = {
  title: 'GudangCheckout',
  description: 'Sistem checkout gudang yang efisien',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className={cn('min-h-screen bg-background font-body antialiased')}>
        <AuthProvider>
          <NotificationProvider>
            <CartProvider>
              <div className="relative flex min-h-dvh flex-col">
                <Header />
                <main className="flex-1">{children}</main>
              </div>
              <Toaster />
            </CartProvider>
          </NotificationProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
