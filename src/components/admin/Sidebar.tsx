
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Home, SortAsc, MessageSquare, Settings, User } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === '/admin/dashboard') {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  const navItems = [
    { path: "/admin/dashboard", icon: Home, label: "Dashboard" },
    { path: "/admin/sorting", icon: SortAsc, label: "CV Sorting" },
    { path: "/admin/messages", icon: MessageSquare, label: "Messages" },
    { path: "/admin/settings", icon: Settings, label: "Settings" },
  ];

  return (
    <div className="fixed left-0 top-0 h-full w-[88px] bg-black flex flex-col items-center py-8 text-white">
      <div className="mb-12">
        <span className="text-xl font-bold font-['Karla']">Cona</span>
      </div>
      
      <nav className="flex flex-col items-center space-y-8">
        <TooltipProvider>
          {navItems.map((item) => (
            <Tooltip key={item.path} delayDuration={300}>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className={`${isActive(item.path) ? 'bg-gray-700' : ''} text-white hover:bg-gray-800 transition-colors`} 
                  onClick={() => navigate(item.path)}
                >
                  <item.icon className="h-6 w-6" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>{item.label}</p>
              </TooltipContent>
            </Tooltip>
          ))}
        </TooltipProvider>
      </nav>
    </div>
  );
};
