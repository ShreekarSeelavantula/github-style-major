import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { 
  LayoutDashboard, 
  BookOpen, 
  CalendarDays, 
  User, 
  LogOut, 
  Menu,
  BrainCircuit
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [location] = useLocation();
  const { user, logout } = useAuth();

  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/syllabus", label: "Syllabus Upload", icon: BookOpen },
    { href: "/plans", label: "My Plans", icon: CalendarDays },
    { href: "/profile", label: "Profile", icon: User },
  ];

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="p-6 flex items-center gap-3">
        <div className="bg-primary/10 p-2 rounded-xl">
          <BrainCircuit className="w-6 h-6 text-primary" />
        </div>
        <span className="font-display font-bold text-xl tracking-tight">StudyAI</span>
      </div>
      
      <div className="flex-1 px-4 py-4 space-y-1">
        {navItems.map((item) => {
          const isActive = location === item.href;
          return (
            <Link key={item.href} href={item.href} className={`
              flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200
              ${isActive 
                ? "bg-primary text-primary-foreground shadow-md shadow-primary/20" 
                : "text-muted-foreground hover:bg-muted hover:text-foreground"}
            `}>
              <item.icon className="w-4 h-4" />
              {item.label}
            </Link>
          );
        })}
      </div>

      <div className="p-4 mt-auto">
        <Separator className="mb-4" />
        <div className="flex items-center gap-3 px-2 mb-4">
          <Avatar className="w-8 h-8 border border-border">
            <AvatarImage src={user?.profileImageUrl || undefined} />
            <AvatarFallback>{user?.firstName?.[0] || "U"}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user?.firstName} {user?.lastName}</p>
            <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
          </div>
        </div>
        <Button 
          variant="outline" 
          className="w-full justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/10 hover:border-destructive/20"
          onClick={() => logout()}
        >
          <LogOut className="w-4 h-4 mr-2" />
          Log out
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop Sidebar */}
      <aside className="hidden md:block w-64 border-r border-border bg-card fixed inset-y-0 z-20">
        <SidebarContent />
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 border-b border-border bg-background/80 backdrop-blur-md z-20 px-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BrainCircuit className="w-6 h-6 text-primary" />
          <span className="font-display font-bold text-lg">StudyAI</span>
        </div>
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="w-5 h-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-72">
            <SidebarContent />
          </SheetContent>
        </Sheet>
      </div>

      {/* Main Content */}
      <main className="flex-1 md:ml-64 pt-16 md:pt-0 p-4 md:p-8 lg:p-12 animate-in fade-in duration-500">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
