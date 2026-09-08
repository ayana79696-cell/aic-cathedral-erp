import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'AIC Cathedral Primary School | Gilgil',
  description: 'AIC Cathedral Primary School, Gilgil — Education for Excellence.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body>{children}</body></html>;
}