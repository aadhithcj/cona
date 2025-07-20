// Index.tsx
import { motion } from "framer-motion";
import Logo from "@/components/Logo";
import AuthCard from "@/components/AuthCard";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#16404D] to-[#2C768D] relative overflow-hidden">
      <motion.div
        className="absolute w-[500px] h-[500px] bg-indigo-100/30 rounded-full -top-64 -right-64"
        animate={{ rotate: 360 }}
        transition={{ duration: 100, repeat: Infinity, ease: "linear" }}
      />
      <motion.div
        className="absolute w-[500px] h-[500px] bg-blue-100/30 rounded-full -bottom-64 -left-64"
        animate={{ rotate: -360 }}
        transition={{ duration: 120, repeat: Infinity, ease: "linear" }}
      />

      <div className="relative min-h-screen container grid lg:grid-cols-2">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          className="hidden lg:flex flex-col items-center justify-center scale-[1.25]"
        >
          <div className="text-center space-y-6">
            <Logo />
          </div>
        </motion.div>

        <div className="flex items-center justify-center p-8">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="w-full max-w-2xl space-y-10 scale-[1.2]"
          >
            <AuthCard title="Admin" description="Manage CVs and requirements" type="admin" />
            <AuthCard title="Applicant" description="Submit your CV" type="applicant" />
          </motion.div>
        </div>
      </div>

      <div className="absolute bottom-4 w-full text-center text-lg text-white font-inconsolata">
        Created by Aadhith CJ, Sameer, Nafiya
      </div>
    </div>
  );
};

export default Index;