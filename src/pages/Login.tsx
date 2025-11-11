import { useState, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Scan } from "lucide-react";

const Login = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    roll: "",
    name: "",
    email: "",
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    
    // Save to localStorage
    localStorage.setItem("roll", formData.roll);
    localStorage.setItem("name", formData.name);
    localStorage.setItem("email", formData.email);
    
    // Navigate to camera page
    navigate("/camera");
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="particle absolute top-[10%] left-[10%] w-2 h-2 bg-primary rounded-full opacity-60" style={{ animationDelay: "0s" }} />
        <div className="particle absolute top-[20%] right-[15%] w-1 h-1 bg-secondary rounded-full opacity-40" style={{ animationDelay: "1s" }} />
        <div className="particle absolute bottom-[30%] left-[20%] w-1.5 h-1.5 bg-accent rounded-full opacity-50" style={{ animationDelay: "2s" }} />
        <div className="particle absolute bottom-[15%] right-[25%] w-2 h-2 bg-primary rounded-full opacity-30" style={{ animationDelay: "1.5s" }} />
      </div>

      {/* Main card */}
      <div className="glass rounded-3xl p-8 md:p-12 max-w-md w-full relative holographic-border">
        {/* Scan line effect */}
        <div className="scan-line absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent opacity-50" />
        
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-primary mb-4 shadow-glow-primary">
            <Scan className="w-10 h-10 text-primary-foreground" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-2">
            FacePresence
          </h1>
          <p className="text-muted-foreground">Contactless Attendance System</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="roll" className="text-foreground">Roll Number</Label>
            <Input
              id="roll"
              type="text"
              required
              value={formData.roll}
              onChange={(e) => setFormData({ ...formData, roll: e.target.value })}
              className="glass border-primary/30 focus:border-primary focus:shadow-glow-primary transition-all bg-card/50"
              placeholder="Enter your roll number"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="name" className="text-foreground">Full Name</Label>
            <Input
              id="name"
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="glass border-primary/30 focus:border-primary focus:shadow-glow-primary transition-all bg-card/50"
              placeholder="Enter your full name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-foreground">Email Address</Label>
            <Input
              id="email"
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="glass border-primary/30 focus:border-primary focus:shadow-glow-primary transition-all bg-card/50"
              placeholder="Enter your email"
            />
          </div>

          <Button
            type="submit"
            className="w-full bg-gradient-primary text-primary-foreground hover:shadow-glow-primary transition-all duration-300 text-lg py-6 font-semibold"
          >
            Continue to Face Scan
          </Button>
        </form>

        <div className="mt-6 text-center text-sm text-muted-foreground">
          <p>Powered by AI Face Recognition</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
