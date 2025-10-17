import { redirect } from 'next/navigation';

// Root route redirects to English locale
export default function RootPage() {
  redirect('/en');
}

