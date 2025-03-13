
import React from "react";
import { useNavigate } from "react-router-dom";
import { Home, SortAsc, MessageCircle, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";

const Sidebar: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="fixed left-0 top-0 h-full w-[88px] bg-black flex flex-col items-center py-8 text-white">
      <div className="mb-12">
        <span className="text-xl font-bold">Cona</span>
      </div>
      <div className="flex flex-col items-center space-y-8">
        <Button variant="ghost" size="icon" className="text-white" onClick={() => navigate("/admin/dashboard")}>
          <Home className="h-6 w-6" />
        </Button>
        <Button variant="ghost" size="icon" className="text-white" onClick={() => navigate("/admin/sorting")}>
          <SortAsc className="h-6 w-6" />
        </Button>
        <Button variant="ghost" size="icon" className="text-white bg-gray-700" onClick={() => navigate("/admin/messages")}>
          <MessageCircle className="h-6 w-6" />
        </Button>
        <Button variant="ghost" size="icon" className="text-white">
          <Settings className="h-6 w-6" />
        </Button>
      </div>
    </div>
  );
};

export default Sidebar;
