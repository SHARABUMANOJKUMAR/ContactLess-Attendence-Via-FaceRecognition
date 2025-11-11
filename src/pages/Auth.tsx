import { useState, FormEvent, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Scan, History } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { FaceEnrollment } from "@/components/FaceEnrollment";

const Auth = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showEnrollment, setShowEnrollment] = useState(false);
  const [newUserId, setNewUserId] = useState<string>("");
  const [formData, setFormData] = useState({
    roll: "",
    name: "",
    email: "",
    password: "",
  });

  useEffect(() => {
    // Check if user is already logged in
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate("/camera");
      }
    };
    checkUser();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session && event === 'SIGNED_IN') {
        navigate("/camera");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSignup = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/camera`,
          data: {
            roll_number: formData.roll,
            full_name: formData.name,
          },
        },
      });

      if (error) throw error;

      if (data.user) {
        toast({
          title: "Account created!",
          description: "Now let's set up your face recognition.",
        });
        setNewUserId(data.user.id);
        setShowEnrollment(true);
      }
    } catch (error: any) {
      console.error("Signup error:", error);
      toast({
        variant: "destructive",
        title: "Signup failed",
        description: error.message || "Could not create account. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEnrollmentComplete = () => {
    toast({
      title: "Registration Complete!",
      description: "You can now login with your credentials.",
    });
    setShowEnrollment(false);
    setIsLogin(true);
    setFormData({ roll: "", name: "", email: "", password: "" });
    setNewUserId("");
  };

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (error) throw error;

      if (data.session) {
        toast({
          title: "Welcome back!",
          description: "Redirecting to face verification...",
        });
        // Navigation will happen via onAuthStateChange listener
      }
    } catch (error: any) {
      console.error("Login error:", error);
      toast({
        variant: "destructive",
        title: "Login failed",
        description: error.message || "Invalid email or password.",
      });
    } finally {
      setLoading(false);
    }
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
        
        {showEnrollment ? (
          // Face Enrollment Step
          <div>
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-2">
                Face Enrollment
              </h2>
              <p className="text-muted-foreground text-sm">
                Upload photos of your face for better recognition
              </p>
            </div>
            <FaceEnrollment userId={newUserId} onComplete={handleEnrollmentComplete} />
          </div>
        ) : (
          // Login/Signup Form
          <>
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-primary mb-4 shadow-glow-primary">
                <Scan className="w-10 h-10 text-primary-foreground" />
              </div>
              <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-2">
                FacePresence
              </h1>
              <p className="text-muted-foreground">
                {isLogin ? "Login to mark attendance" : "Create your account"}
              </p>
            </div>

            <form onSubmit={isLogin ? handleLogin : handleSignup} className="space-y-6">
          {!isLogin && (
            <>
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
            </>
          )}

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

          <div className="space-y-2">
            <Label htmlFor="password" className="text-foreground">Password</Label>
            <Input
              id="password"
              type="password"
              required
              minLength={6}
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="glass border-primary/30 focus:border-primary focus:shadow-glow-primary transition-all bg-card/50"
              placeholder="Enter your password"
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-primary text-primary-foreground hover:shadow-glow-primary transition-all duration-300 text-lg py-6 font-semibold"
          >
            {loading ? "Processing..." : isLogin ? "Login" : "Create Account"}
          </Button>
        </form>

        <div className="mt-6 text-center space-y-3">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-primary hover:text-primary/80 transition-colors text-sm"
          >
            {isLogin ? "Don't have an account? Sign up" : "Already have an account? Login"}
          </button>
          
          {isLogin && (
            <div>
              <button
                onClick={() => navigate("/history")}
                className="inline-flex items-center gap-2 text-primary hover:text-primary/80 transition-colors text-sm font-medium"
              >
                <History className="w-4 h-4" />
                View Attendance History
              </button>
            </div>
          )}
        </div>

        <div className="mt-6 text-center text-sm text-muted-foreground">
          <p>Powered by AI Face Recognition</p>
        </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Auth;
