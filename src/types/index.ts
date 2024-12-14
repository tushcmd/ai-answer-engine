export type Message = {
  role: "user" | "ai";
  content: string;
  sources?: string[];
};

export type ConversationContext = {
  messages: Message[];
  urls?: string[];
};
