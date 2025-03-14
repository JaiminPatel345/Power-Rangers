import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import ChoiceList from "@/pages/choice-list";
import Comparison from "@/pages/comparison";
import Admin from "@/pages/admin";
import Navbar from "@/components/layout/Navbar";
import ChatBot from "@/components/chat/ChatBot";

function Router() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/choices" component={ChoiceList} />
        <Route path="/comparison" component={Comparison} />
        <Route path="/admin" component={Admin} />
        <Route component={NotFound} />
      </Switch>
      <ChatBot />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router />
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;