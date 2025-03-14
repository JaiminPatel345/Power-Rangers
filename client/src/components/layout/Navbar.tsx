import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";

export default function Navbar() {
  const [location] = useLocation();

  const links = [
    { href: "/", label: "Recommendations" },
    { href: "/choices", label: "Choice List" },
    { href: "/comparison", label: "College Comparison" },
    { href: "/admin", label: "Admin Login" }
  ];

  return (
    <nav className="border-b">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <h1 className="text-xl font-bold">ACPC College Choice Assistant</h1>
          <div className="flex space-x-8">
            {links.map(link => (
              <Link 
                key={link.href} 
                href={link.href}
                className={cn(
                  "text-sm font-medium transition-colors hover:text-primary",
                  location === link.href ? "text-primary border-b-2 border-primary" : "text-muted-foreground"
                )}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
}