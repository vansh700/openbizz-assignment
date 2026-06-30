import { Heart } from "lucide-react";

export default function Footer() {
  return (
    <footer className="w-full border-t border-border bg-card/50 py-8 transition-colors duration-300">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-saffron">About the Portal</h3>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              Udyam Registration is a free, paperless, and fully digital process for registering micro, small, and medium enterprises. This portal is a high-fidelity replica of Step 1 & Step 2 for development purposes.
            </p>
          </div>
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-primary">Official Links</h3>
            <ul className="mt-2 space-y-1.5 text-xs text-muted-foreground">
              <li>
                <a
                  href="https://udyamregistration.gov.in"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-foreground transition-colors hover:underline"
                >
                  Official Udyam Portal
                </a>
              </li>
              <li>
                <a
                  href="https://msme.gov.in"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-foreground transition-colors hover:underline"
                >
                  Ministry of MSME
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-emerald">Technical Details</h3>
            <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
              Powered by Next.js 15, React 19, Tailwind CSS v4, Prisma ORM, and PostgreSQL. Built with dynamic schema-based rendering.
            </p>
          </div>
        </div>
        <div className="mt-8 border-t border-border/60 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <p className="text-[11px] text-muted-foreground">
            © {new Date().getFullYear()} Ministry of Micro, Small & Medium Enterprises, Government of India.
          </p>
          <p className="flex items-center justify-center gap-1 text-[11px] text-muted-foreground">
            Recreated with <Heart className="h-3 w-3 text-destructive fill-destructive" /> by Antigravity
          </p>
        </div>
      </div>
    </footer>
  );
}
