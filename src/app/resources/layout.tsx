import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Free School Past Papers, Notes & Kids Worksheets',
  description:
    'Download Grade 1-13 provincial term test papers, G.C.E. O/L & A/L past papers with marking schemes, fast revision short notes, and pre-school coloring activity sheets 100% free from Zenexismart Ambalangoda.',
  keywords: [
    'Past Papers Sri Lanka',
    'Term Test Papers Sri Lanka',
    'Grade 10 Science Past Paper',
    'Grade 11 Maths Past Paper',
    'Grade 5 Scholarship Papers',
    'G.C.E O/L Past Papers',
    'G.C.E A/L Past Papers',
    'Pre-School Coloring Sheets',
    'Zenexismart Past Papers',
    'Zenexis Online Resources',
  ],
  alternates: {
    canonical: 'https://zenexismart.com/resources',
  },
  openGraph: {
    title: 'Free School Past Papers & Kids Worksheets | Zenexismart',
    description:
      'Download Grade 1-13 term test papers, G.C.E. O/L & A/L past papers, and preschool coloring sheets 100% free.',
    url: 'https://zenexismart.com/resources',
    type: 'website',
  },
};

export default function ResourcesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
