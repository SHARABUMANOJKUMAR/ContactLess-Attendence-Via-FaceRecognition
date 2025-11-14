import { useState, FormEvent, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Scan, History } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { FaceEnrollment } from "@/components/FaceEnrollment";
import { Logo3D } from "@/components/Logo3D";

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
      {/* Logo & Department Caption - Top Right */}
      <div className="absolute top-8 right-8 z-50 flex flex-col items-center gap-3">
        <div className="relative group">
          <Logo3D />
        </div>
        <div className="text-center relative">
          <div className="absolute inset-0 bg-gradient-gold rounded-lg blur-md opacity-30"></div>
          <p className="text-accent font-bold text-lg tracking-wider gold-shimmer relative z-10 px-4 py-2 bg-card/60 rounded-lg border border-accent/30 backdrop-blur-sm">
            DEPARTMENT OF CAD
          </p>
        </div>
      </div>

      {/* Animated background particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(30)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full particle"
            style={{
              width: Math.random() * 6 + 2 + "px",
              height: Math.random() * 6 + 2 + "px",
              left: Math.random() * 100 + "%",
              top: Math.random() * 100 + "%",
              background: i % 3 === 0 
                ? "hsl(210, 100%, 50%)" 
                : i % 3 === 1 
                ? "hsl(45, 100%, 55%)" 
                : "hsl(280, 85%, 55%)",
              boxShadow: i % 3 === 0 
                ? "0 0 20px hsl(210 100% 50% / 0.8)" 
                : i % 3 === 1
                ? "0 0 20px hsl(45 100% 55% / 0.8)"
                : "0 0 20px hsl(280 85% 55% / 0.8)",
              animationDelay: Math.random() * 3 + "s",
              animationDuration: Math.random() * 4 + 4 + "s",
            }}
          />
        ))}
      </div>

      {/* Radial gradient overlay */}
      <div className="absolute inset-0 bg-gradient-radial from-primary/5 via-transparent to-transparent pointer-events-none" />

      {showEnrollment ? (
        <div className="w-full max-w-4xl relative z-10">
          <FaceEnrollment 
            userId={newUserId} 
            onComplete={handleEnrollmentComplete}
          />
        </div>
      ) : (
        <div className="w-full max-w-md relative z-10">
          {/* Main Card with Royal Styling */}
          <div className="glass rounded-2xl p-8 shadow-2xl holographic-border relative overflow-hidden">
            {/* Decorative corner elements */}
            <div className="absolute top-0 left-0 w-24 h-24 border-t-4 border-l-4 border-accent rounded-tl-2xl opacity-50"></div>
            <div className="absolute bottom-0 right-0 w-24 h-24 border-b-4 border-r-4 border-primary rounded-br-2xl opacity-50"></div>
            
            {/* Scan line effect */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="scan-line absolute inset-x-0 h-px bg-gradient-to-r from-transparent via-primary to-transparent opacity-30"></div>
            </div>

            <div className="relative z-10">
              {/* Header */}
              <div className="text-center mb-8">
                <h1 className="text-4xl font-bold mb-2 bg-gradient-royal bg-clip-text text-transparent">
                  FacePresence
                </h1>
                <p className="text-muted-foreground text-sm tracking-wide">
                  Advanced Biometric Authentication System
                </p>
              </div>

              {/* Toggle Buttons */}
              <div className="flex gap-2 mb-6 p-1 bg-card rounded-xl border border-border">
                <button
                  type="button"
                  onClick={() => setIsLogin(true)}
                  className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all duration-300 ${
                    isLogin
                      ? "bg-gradient-primary text-primary-foreground shadow-glow-primary"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Login
                </button>
                <button
                  type="button"
                  onClick={() => setIsLogin(false)}
                  className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all duration-300 ${
                    !isLogin
                      ? "bg-gradient-gold text-accent-foreground shadow-glow-gold"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Register
                </button>
              </div>

              {/* Forms */}
              <form onSubmit={isLogin ? handleLogin : handleSignup} className="space-y-5">
                {!isLogin && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="roll" className="text-foreground font-medium">
                        Roll Number
                      </Label>
                      <Input
                        id="roll"
                        type="text"
                        placeholder="Enter your roll number"
                        value={formData.roll}
                        onChange={(e) => setFormData({ ...formData, roll: e.target.value })}
                        required={!isLogin}
                        className="bg-input border-border focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-foreground font-medium">
                        Full Name
                      </Label>
                      <Input
                        id="name"
                        type="text"
                        placeholder="Enter your full name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required={!isLogin}
                        className="bg-input border-border focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                      />
                    </div>
                  </>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-foreground font-medium">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your.email@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    className="bg-input border-border focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-foreground font-medium">
                    Password
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                    className="bg-input border-border focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full py-6 text-lg font-bold bg-gradient-primary hover:shadow-glow-primary transition-all duration-300 hover:scale-[1.02] relative overflow-hidden group"
                  disabled={loading}
                >
                  <span className="relative z-10">
                    {loading ? "Processing..." : isLogin ? "Sign In" : "Create Account"}
                  </span>
                  <div className="absolute inset-0 bg-gradient-gold opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </Button>
              </form>

              {/* Quick Actions */}
              {isLogin && (
                <div className="mt-8 pt-6 border-t border-border">
                  <p className="text-sm text-muted-foreground mb-4 text-center">Quick Actions</p>
                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      className="flex items-center justify-center gap-2 border-primary/50 hover:bg-primary/10 hover:border-primary transition-all"
                      onClick={() => navigate("/camera")}
                    >
                      <Scan className="w-4 h-4" />
                      <span className="text-sm">Face Scan</span>
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="flex items-center justify-center gap-2 border-accent/50 hover:bg-accent/10 hover:border-accent transition-all"
                      onClick={() => navigate("/history")}
                    >
                      <History className="w-4 h-4" />
                      <span className="text-sm">History</span>
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer Text */}
          <p className="text-center text-sm text-muted-foreground mt-6">
            Powered by{" "}
            <span className="text-accent font-semibold">AI Face Recognition</span>
          </p>
        </div>
      )}
    </div>
  );
};

export default Auth;
