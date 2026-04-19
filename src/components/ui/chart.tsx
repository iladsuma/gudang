
'use client';

import * as React from 'react';

// Komponen ini dinonaktifkan karena library recharts telah dihapus untuk menghemat ruang.
export const ChartContainer = ({ children }: { children: React.ReactNode }) => {
  return <div className="p-4 border rounded bg-muted/20">{children}</div>;
};

export const ChartTooltip = () => null;
export const ChartTooltipContent = () => null;
export const ChartLegend = () => null;
export const ChartLegendContent = () => null;
