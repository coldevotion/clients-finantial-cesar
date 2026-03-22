'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Clientes is an admin-only section, redirect to /admin/clients
export default function ClientsRedirectPage() {
  const router = useRouter();
  useEffect(() => { router.replace('/admin/clients'); }, [router]);
  return null;
}
