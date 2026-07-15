import Link from "next/link";

export function MarketingFooter() {
  return (
    <footer className="border-t border-border bg-brand-900 text-white">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:grid-cols-3">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500 text-sm font-bold">KP</div>
            <span className="font-heading text-lg font-bold">Kinder Pilot</span>
          </div>
          <p className="mt-3 text-sm text-white/70">
            Nurturing young minds across Karachi since 2007. Licensed daycare and early learning centres.
          </p>
        </div>
        <div>
          <h4 className="font-semibold">Quick Links</h4>
          <ul className="mt-3 space-y-2 text-sm text-white/70">
            <li><Link href="/about" className="hover:text-white">About Us</Link></li>
            <li><Link href="/programs" className="hover:text-white">Programs</Link></li>
            <li><Link href="/contact" className="hover:text-white">Contact</Link></li>
            <li><Link href="/portal" className="hover:text-white">Staff Portal</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold">Contact</h4>
          <ul className="mt-3 space-y-2 text-sm text-white/70">
            <li>North Nazimabad, Karachi</li>
            <li>+92 21 3667 8900</li>
            <li>info@kinderpilot.pk</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10 py-4 text-center text-xs text-white/50">
        © {new Date().getFullYear()} Kinder Pilot. All rights reserved.
      </div>
    </footer>
  );
}
