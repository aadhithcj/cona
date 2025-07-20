import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { MessageSquare } from "lucide-react";
import { formatDistanceToNow, parseISO } from "date-fns";
import { Spinner } from "@/components/ui/spinner";
import { motion } from "framer-motion";

const Messages = () => {
  const queryClient = useQueryClient();

  const { data: messages, isLoading, isError, error } = useQuery({
    queryKey: ["messages"],
    queryFn: async () => {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) throw new Error("No user found");

      const { data: cv, error: cvError } = await supabase
        .from("cvs")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (cvError) throw cvError;
      if (!cv) return [];

      const { data, error: messagesError } = await supabase
        .from("messages")
        .select("*")
        .eq("cv_id", cv.id)
        .order("created_at", { ascending: false });

      if (messagesError) throw messagesError;

      const unreadMessages = data?.filter((msg) => !msg.read) || [];
      if (unreadMessages.length > 0) {
        await supabase
          .from("messages")
          .update({ read: true })
          .in("id", unreadMessages.map((msg) => msg.id));

        queryClient.invalidateQueries({ queryKey: ["unreadMessages"] });
      }

      return data || [];
    },
    refetchInterval: 10000,
  });

  // Animation variants for individual message boxes
  const messageVariants = {
    hidden: { opacity: 0, y: 20 }, // Initial state: hidden and slightly below
    visible: { opacity: 1, y: 0 }, // Final state: visible and in position
    hover: { scale: 1.02 }, // Hover effect: slight scale-up
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-center py-8">
        <div className="inline-block p-4 rounded-lg bg-destructive/10 text-destructive">
          Error loading messages: {(error as Error).message}
        </div>
      </div>
    );
  }

  const formatMessageContent = (message: string) => {
    if (message.includes("interview") && message.includes("at")) {
      return (
        <div>
          {message.split("at").map((part, index) => {
            if (index === 0) {
              return <span key={index}>{part}at</span>;
            } else {
              const timeMatch = part.match(/\d{1,2}:\d{2}\s[APap][Mm]/);
              if (timeMatch) {
                const timeIndex = part.indexOf(timeMatch[0]);
                const beforeTime = part.substring(0, timeIndex);
                const time = timeMatch[0];
                const afterTime = part.substring(timeIndex + time.length);

                return (
                  <span key={index}>
                    {beforeTime}
                    <span className="font-bold text-primary">{time}</span>
                    {afterTime}
                  </span>
                );
              }
              return <span key={index}>{part}</span>;
            }
          })}
        </div>
      );
    }
    return message;
  };

  return (
    <Card className="border shadow-sm">
      <CardContent className="p-0">
        {messages && messages.length > 0 ? (
          <ScrollArea className="h-[500px]">
            <div className="space-y-4 p-4">
              {messages.map((message, index) => (
                <motion.div
                  key={message.id}
                  className={`
                    border rounded-lg p-4 transition-all
                    ${message.read ? "border-muted" : "border-primary/30 bg-primary/5"}
                    hover:border-primary/50 hover:shadow-sm
                  `}
                  variants={messageVariants}
                  initial="hidden"
                  animate="visible"
                  whileHover="hover"
                  transition={{ duration: 0.3, delay: index * 0.1 }} // Staggered animation
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={`
                        rounded-full p-2 mt-1
                        ${message.read ? "bg-muted" : "bg-primary/10"}
                      `}
                    >
                      <MessageSquare
                        className={`
                          h-5 w-5
                          ${message.read ? "text-muted-foreground" : "text-primary"}
                        `}
                      />
                    </div>
                    <div className="flex-1">
                      <p
                        className={`
                          text-sm
                          ${message.read ? "text-muted-foreground" : "text-primary font-medium"}
                        `}
                      >
                        {formatDistanceToNow(parseISO(message.created_at), {
                          addSuffix: true,
                        })}
                      </p>
                      <p
                        className={`
                          mt-2
                          ${message.read ? "text-foreground" : "font-medium"}
                        `}
                      >
                        {formatMessageContent(message.message)}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </ScrollArea>
        ) : (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <MessageSquare className="h-10 w-10 mb-4 text-muted-foreground/50" />
            <h3 className="text-lg font-medium text-muted-foreground">No messages yet</h3>
            <p className="text-sm text-muted-foreground/70 mt-1">
              You'll see notifications here when you receive updates
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default Messages;
