import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Auth from "./pages/Auth";
import Camera from "./pages/Camera";
import AttendanceHistory from "./pages/AttendanceHistory";
import ProfileSettings from "./pages/ProfileSettings";
import QRScanner from "./pages/QRScanner";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Auth />} />
          <Route path="/camera" element={<Camera />} />
          <Route path="/history" element={<AttendanceHistory />} />
          <Route path="/profile" element={<ProfileSettings />} />
          <Route path="/qr-scanner" element={<QRScanner />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
