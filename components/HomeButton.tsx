'use client';

import Link from 'next/link';
import { Home } from 'lucide-react';

export default function HomeButton() {
  return (
    <div className="home-button-section">
      <Link href="/" className="home-button" title="Back to Home">
        <Home size={24} />
      </Link>
    </div>
  );
}
