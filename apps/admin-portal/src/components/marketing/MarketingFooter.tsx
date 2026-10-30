import Link from "next/link";

export function MarketingFooter({ schoolName }: { schoolName: string }) {
  return (
    <footer className="border-t border-border bg-brand-900 text-white">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:grid-cols-3">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500 text-sm font-bold">{schoolName.slice(0, 2).toUpperCase()}</div>
            <span className="font-heading text-lg font-bold">{schoolName}</span>
          </div>
          <p className="mt-3 text-sm text-white/70">
            Nurturing young minds with caring educators and a child-first approach.
          </p>
        </div>
        <div>
          <h4 className="font-semibold">Quick Links</h4>
          <ul className="mt-3 space-y-2 text-sm text-white/70">
            <li><Link href="/about" className="hover:text-white">About Us</Link></li>
            <li><Link href="/programs" className="hover:text-white">Programs</Link></li>
            <li><Link href="/contact" className="hover:text-white">Contact</Link></li>
            <li><Link href="/login" className="hover:text-white">Staff Portal</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold">Contact</h4>
          <ul className="mt-3 space-y-2 text-sm text-white/70">
            <li><Link href="/inquiry" className="hover:text-white">Send us an inquiry</Link></li>
            <li><Link href="/contact" className="hover:text-white">Visit or call a campus</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10 py-4 text-center text-xs text-white/50">
        © {new Date().getFullYear()} {schoolName}. All rights reserved.
      </div>
    </footer>
  );
}
