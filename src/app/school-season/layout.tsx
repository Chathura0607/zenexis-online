import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'School Season Specials & Booklist Packages (10% OFF)',
  description:
    'Pre-order school booklists, CR exercise books, stationery packs, and educational supplies with 10% discount and island-wide Cash on Delivery from Zenexismart Ambalangoda.',
  alternates: {
    canonical: 'https://zenexismart.com/school-season',
  },
  openGraph: {
    title: 'School Season Specials & Booklist Packages | Zenexismart',
    description: 'Get 10% OFF on all school booklist orders with doorstep delivery in Sri Lanka.',
    url: 'https://zenexismart.com/school-season',
    type: 'website',
  },
};

export default function SchoolSeasonLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
