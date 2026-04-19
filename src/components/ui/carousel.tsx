
'use client';

import * as React from 'react';

// Komponen ini dinonaktifkan karena library embla-carousel telah dihapus untuk menghemat ruang.
export const Carousel = ({ children }: { children: React.ReactNode }) => {
  return <div className="relative">{children}</div>;
};

export const CarouselContent = ({ children }: { children: React.ReactNode }) => <div>{children}</div>;
export const CarouselItem = ({ children }: { children: React.ReactNode }) => <div>{children}</div>;
export const CarouselPrevious = () => null;
export const CarouselNext = () => null;
