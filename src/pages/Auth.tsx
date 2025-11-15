import { useState, FormEvent, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Scan, History } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { FaceEnrollment } from "@/components/FaceEnrollment";
import logo from "@/assets/logo.png";

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
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-gradient-to-br from-[#0a0118] via-[#1a0a2e] to-[#0f0720]">
      {/* Logo & Department Caption - Top Left */}
      <div className="absolute top-8 left-8 z-50 flex flex-col items-center gap-3">
        <div className="relative">
          <img 
            src={logo} 
            alt="Siddharth Institutions Logo" 
            className="w-40 h-40 relative z-10 logo-pulse"
          />
        </div>
        <div className="text-center relative">
          <div className="absolute inset-0 bg-gradient-gold rounded-lg blur-md opacity-30"></div>
          <p className="text-accent font-bold text-lg tracking-wider gold-shimmer relative z-10 px-4 py-2 bg-card/60 rounded-lg border border-accent/30 backdrop-blur-sm">
            DEPARTMENT OF CAD
          </p>
        </div>
      </div>

      {/* Galaxy Background - Stars */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(100)].map((_, i) => (
          <div
            key={`star-${i}`}
            className="star"
            style={{
              width: Math.random() * 3 + 1 + "px",
              height: Math.random() * 3 + 1 + "px",
              left: Math.random() * 100 + "%",
              top: Math.random() * 100 + "%",
              animationDuration: Math.random() * 3 + 2 + "s",
              animationDelay: Math.random() * 5 + "s",
            }}
          />
        ))}
      </div>

      {/* Planets */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Large purple planet */}
        <div
          className="planet"
          style={{
            width: "120px",
            height: "120px",
            background: "radial-gradient(circle at 30% 30%, hsl(270, 80%, 60%), hsl(270, 80%, 30%))",
            boxShadow: "0 0 60px hsl(270 80% 60% / 0.6), inset -20px -20px 50px rgba(0,0,0,0.5)",
            top: "15%",
            left: "15%",
            "--orbit-radius": "80px",
            animationDuration: "60s",
          } as React.CSSProperties}
        />
        
        {/* Blue-cyan planet */}
        <div
          className="planet"
          style={{
            width: "80px",
            height: "80px",
            background: "radial-gradient(circle at 40% 40%, hsl(190, 90%, 70%), hsl(220, 90%, 40%))",
            boxShadow: "0 0 40px hsl(190 90% 60% / 0.7), inset -15px -15px 40px rgba(0,0,0,0.5)",
            top: "60%",
            right: "10%",
            "--orbit-radius": "60px",
            animationDuration: "45s",
          } as React.CSSProperties}
        />

        {/* Small orange planet */}
        <div
          className="planet"
          style={{
            width: "50px",
            height: "50px",
            background: "radial-gradient(circle at 35% 35%, hsl(25, 95%, 70%), hsl(25, 95%, 45%))",
            boxShadow: "0 0 30px hsl(25 95% 60% / 0.8), inset -10px -10px 25px rgba(0,0,0,0.5)",
            bottom: "20%",
            left: "25%",
            "--orbit-radius": "40px",
            animationDuration: "35s",
          } as React.CSSProperties}
        />

        {/* Pink nebula planet */}
        <div
          className="planet"
          style={{
            width: "90px",
            height: "90px",
            background: "radial-gradient(circle at 30% 30%, hsl(320, 85%, 70%), hsl(320, 85%, 40%))",
            boxShadow: "0 0 50px hsl(320 85% 60% / 0.6), inset -18px -18px 45px rgba(0,0,0,0.5)",
            top: "40%",
            right: "30%",
            "--orbit-radius": "70px",
            animationDuration: "55s",
          } as React.CSSProperties}
        />
      </div>

      {/* Nebula clouds */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-30">
        <div className="absolute w-[600px] h-[600px] rounded-full blur-[100px] bg-gradient-to-br from-purple-500/30 via-blue-500/20 to-transparent top-0 -left-20 animate-pulse" style={{ animationDuration: "8s" }} />
        <div className="absolute w-[500px] h-[500px] rounded-full blur-[100px] bg-gradient-to-br from-cyan-500/30 via-pink-500/20 to-transparent bottom-0 -right-20 animate-pulse" style={{ animationDuration: "10s" }} />
        <div className="absolute w-[400px] h-[400px] rounded-full blur-[80px] bg-gradient-to-br from-orange-500/20 via-purple-500/20 to-transparent top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" style={{ animationDuration: "12s" }} />
      </div>

      {showEnrollment ? (
        <div className="w-full max-w-4xl relative z-10">
          <FaceEnrollment 
            userId={newUserId} 
            onComplete={handleEnrollmentComplete}
          />
        </div>
      ) : (
        <div className="w-full max-w-md relative z-10">
          {/* Main Card with Animated Gradient Border */}
          <div className="gradient-border-animated">
          <div className="glass rounded-2xl p-8 shadow-2xl relative overflow-hidden bg-card/95 backdrop-blur-xl">
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
              <form onSubmit={isLogin ? handleLogin : handleSignup} className={`space-y-5 ${isLogin ? 'slide-in-left' : 'slide-in-right'}`} key={isLogin ? 'login' : 'signup'}>
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
