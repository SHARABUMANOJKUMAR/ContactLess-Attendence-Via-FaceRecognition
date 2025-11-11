import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Save, Loader2, User, Mail, Hash, QrCode as QrCodeIcon, Download } from "lucide-react";
import { User as SupabaseUser } from "@supabase/supabase-js";
import { useToast } from "@/hooks/use-toast";
import { QRCodeSVG } from "qrcode.react";

const ProfileSettings = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    full_name: "",
    roll_number: "",
    email: "",
    newPassword: "",
    confirmPassword: "",
  });

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/");
        return;
      }

      setUser(session.user);
      
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .single();
      
      if (profileData) {
        setProfile(profileData);
        setFormData({
          full_name: profileData.full_name || "",
          roll_number: profileData.roll_number || "",
          email: profileData.email || "",
          newPassword: "",
          confirmPassword: "",
        });
      }
      
      setLoading(false);
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session || event === 'SIGNED_OUT') {
        navigate("/");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSaveProfile = async () => {
    if (!user) return;

    setSaving(true);
    try {
      // Update profile
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          full_name: formData.full_name,
          roll_number: formData.roll_number,
        })
        .eq("id", user.id);

      if (profileError) throw profileError;

      // Update password if provided
      if (formData.newPassword) {
        if (formData.newPassword !== formData.confirmPassword) {
          toast({
            title: "Password mismatch",
            description: "New password and confirmation do not match.",
            variant: "destructive",
          });
          setSaving(false);
          return;
        }

        if (formData.newPassword.length < 6) {
          toast({
            title: "Password too short",
            description: "Password must be at least 6 characters long.",
            variant: "destructive",
          });
          setSaving(false);
          return;
        }

        const { error: passwordError } = await supabase.auth.updateUser({
          password: formData.newPassword,
        });

        if (passwordError) throw passwordError;
      }

      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated.",
      });

      // Clear password fields
      setFormData(prev => ({
        ...prev,
        newPassword: "",
        confirmPassword: "",
      }));
    } catch (error: any) {
      console.error("Error updating profile:", error);
      toast({
        title: "Update failed",
        description: error.message || "Failed to update profile.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const downloadQRCode = () => {
    const svg = document.getElementById("qr-code-svg");
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL("image/png");

      const downloadLink = document.createElement("a");
      downloadLink.download = `QR-${profile?.roll_number || "code"}.png`;
      downloadLink.href = pngFile;
      downloadLink.click();

      toast({
        title: "QR Code Downloaded",
        description: "Your QR code has been saved as an image.",
      });
    };

    img.src = "data:image/svg+xml;base64," + btoa(svgData);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="particle absolute w-1 h-1 bg-primary rounded-full opacity-30"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
            }}
          />
        ))}
      </div>

      <div className="w-full max-w-2xl z-10">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Profile Settings
          </h1>
          <Button
            onClick={() => navigate("/history")}
            variant="outline"
            className="glass border-primary/30 hover:border-primary"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </div>

        {/* Profile Card */}
        <Card className="glass p-6 md:p-8">
          <div className="space-y-6">
            {/* Profile Info Section */}
            <div>
              <h2 className="text-xl font-semibold text-primary mb-4">Personal Information</h2>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="full_name" className="flex items-center gap-2 text-foreground mb-2">
                    <User className="w-4 h-4" />
                    Full Name
                  </Label>
                  <Input
                    id="full_name"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    className="glass border-primary/30 focus:border-primary"
                  />
                </div>

                <div>
                  <Label htmlFor="roll_number" className="flex items-center gap-2 text-foreground mb-2">
                    <Hash className="w-4 h-4" />
                    Roll Number
                  </Label>
                  <Input
                    id="roll_number"
                    value={formData.roll_number}
                    onChange={(e) => setFormData({ ...formData, roll_number: e.target.value })}
                    className="glass border-primary/30 focus:border-primary"
                  />
                </div>

                <div>
                  <Label htmlFor="email" className="flex items-center gap-2 text-foreground mb-2">
                    <Mail className="w-4 h-4" />
                    Email
                  </Label>
                  <Input
                    id="email"
                    value={formData.email}
                    disabled
                    className="glass border-muted/30 opacity-60 cursor-not-allowed"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Email cannot be changed</p>
                </div>
              </div>
            </div>

            {/* QR Code Section */}
            <div className="pt-6 border-t border-border">
              <h2 className="text-xl font-semibold text-primary mb-4 flex items-center gap-2">
                <QrCodeIcon className="w-5 h-5" />
                Your QR Code
              </h2>
              <p className="text-sm text-muted-foreground mb-4">
                Use this QR code for quick attendance marking
              </p>
              {profile?.qr_code && (
                <div className="flex flex-col items-center gap-4">
                  <div className="p-6 glass rounded-2xl border-2 border-primary/30">
                    <QRCodeSVG
                      id="qr-code-svg"
                      value={profile.qr_code}
                      size={200}
                      level="H"
                      includeMargin
                      className="w-full h-auto"
                    />
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-mono font-bold text-primary mb-2">
                      {profile.qr_code}
                    </p>
                    <Button
                      onClick={downloadQRCode}
                      variant="outline"
                      className="glass border-primary/30 hover:border-primary"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download QR Code
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Password Section */}
            <div className="pt-6 border-t border-border">
              <h2 className="text-xl font-semibold text-primary mb-4">Change Password</h2>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="newPassword" className="text-foreground mb-2">
                    New Password
                  </Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={formData.newPassword}
                    onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                    placeholder="Leave empty to keep current password"
                    className="glass border-primary/30 focus:border-primary"
                  />
                </div>

                <div>
                  <Label htmlFor="confirmPassword" className="text-foreground mb-2">
                    Confirm New Password
                  </Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    placeholder="Confirm your new password"
                    className="glass border-primary/30 focus:border-primary"
                  />
                </div>
              </div>
            </div>

            {/* Save Button */}
            <Button
              onClick={handleSaveProfile}
              disabled={saving}
              className="w-full bg-gradient-primary text-primary-foreground hover:shadow-glow-primary transition-all"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default ProfileSettings;
