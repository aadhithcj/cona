// AuthCard.tsx
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

interface AuthCardProps {
  title: string;
  description: string;
  type: "admin" | "applicant";
}

const AuthCard = ({ title, description, type }: AuthCardProps) => {
  const navigate = useNavigate();

  return (
    <motion.div whileHover={{ scale: 1.04 }} className="w-full">
      <Card className="relative bg-white/95 backdrop-blur-lg border-0 shadow-lg rounded-2xl overflow-hidden w-full max-w-md mx-auto">
        <div className="absolute inset-0 bg-gradient-to-br from-[#A6CDC6] to-[#93BAB3] opacity-90" />
        <div className="relative z-10 p-5">
          <CardHeader className="p-4 pb-2 text-center">
            <CardTitle className="text-2xl font-bold text-gray-900">{title}</CardTitle>
            <CardDescription className="text-base text-gray-700">
              {description}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-4">
            <Button
              className="w-full h-12 rounded-xl text-base font-semibold bg-gradient-to-r from-[#16404D] to-[#2C768D] text-white"
              onClick={() => navigate(`/${type}/login`)}
            >
              Continue as {type}
            </Button>
          </CardContent>
        </div>
      </Card>
    </motion.div>
  );
};

export default AuthCard;