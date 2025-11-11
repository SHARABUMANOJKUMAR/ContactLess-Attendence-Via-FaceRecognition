import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Html5Qrcode } from "html5-qrcode";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft, QrCode, CheckCircle2, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const QRScanner = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [scanning, setScanning] = useState(false);
  const [status, setStatus] = useState<"idle" | "scanning" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const qrCodeRegionId = "qr-reader";

  useEffect(() => {
    // Check authentication
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/");
      }
    };
    checkAuth();

    return () => {
      stopScanner();
    };
  }, [navigate]);

  const startScanner = async () => {
    try {
      setScanning(true);
      setStatus("scanning");
      setMessage("Position QR code in the frame");

      const html5QrCode = new Html5Qrcode(qrCodeRegionId);
      scannerRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        async (decodedText) => {
          console.log("QR Code detected:", decodedText);
          await handleQRCodeScanned(decodedText);
        },
        (errorMessage) => {
          // Silent error handling for continuous scanning
        }
      );
    } catch (error) {
      console.error("Error starting scanner:", error);
      toast({
        title: "Camera Error",
        description: "Could not access camera. Please allow camera permissions.",
        variant: "destructive",
      });
      setScanning(false);
      setStatus("error");
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
        scannerRef.current = null;
      } catch (error) {
        console.error("Error stopping scanner:", error);
      }
    }
    setScanning(false);
  };

  const handleQRCodeScanned = async (qrCode: string) => {
    // Stop scanner immediately
    await stopScanner();
    setStatus("scanning");
    setMessage("Verifying QR code...");

    try {
      // Find user by QR code
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("qr_code", qrCode)
        .single();

      if (profileError || !profile) {
        setStatus("error");
        setMessage("❌ Invalid QR Code");
        toast({
          title: "Invalid QR Code",
          description: "This QR code is not registered in the system.",
          variant: "destructive",
        });
        
        setTimeout(() => {
          setStatus("idle");
          setMessage("");
        }, 3000);
        return;
      }

      // Get the authenticated user
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/");
        return;
      }

      // Security: Only allow users to scan their own QR code
      if (profile.id !== session.user.id) {
        setStatus("error");
        setMessage("❌ You can only scan your own QR code");
        toast({
          title: "Unauthorized",
          description: "You can only mark attendance for yourself.",
          variant: "destructive",
        });
        
        setTimeout(() => {
          setStatus("idle");
          setMessage("");
        }, 3000);
        return;
      }

      // Mark attendance for authenticated user only
      const { error: attendanceError } = await supabase
        .from("attendance_records")
        .insert({
          user_id: session.user.id,
          roll_number: profile.roll_number,
          student_name: profile.full_name,
          email: profile.email,
          confidence_score: 1.0,
          status: "present",
        });

      if (attendanceError) {
        console.error("Error marking attendance:", attendanceError);
        setStatus("error");
        setMessage("❌ Error marking attendance");
        toast({
          title: "Error",
          description: "Failed to mark attendance. Please try again.",
          variant: "destructive",
        });
        
        setTimeout(() => {
          setStatus("idle");
          setMessage("");
        }, 3000);
        return;
      }

      // Send email notification
      try {
        await supabase.functions.invoke("send-attendance-email", {
          body: {
            email: profile.email,
            name: profile.full_name,
            rollNumber: profile.roll_number,
            status: "present",
            timestamp: new Date().toISOString(),
            confidenceScore: 1.0,
          },
        });
      } catch (emailError) {
        console.error("Email notification error:", emailError);
      }

      setStatus("success");
      setMessage(`✅ Attendance marked for ${profile.full_name}`);
      toast({
        title: "Success!",
        description: `Attendance marked for ${profile.full_name}`,
      });

      setTimeout(() => {
        navigate("/history");
      }, 2000);
    } catch (error) {
      console.error("Error processing QR code:", error);
      setStatus("error");
      setMessage("❌ Error processing QR code");
      toast({
        title: "Error",
        description: "Failed to process QR code. Please try again.",
        variant: "destructive",
      });
      
      setTimeout(() => {
        setStatus("idle");
        setMessage("");
      }, 3000);
    }
  };

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

      {/* Back button */}
      <div className="absolute top-6 right-6 z-30">
        <Button
          onClick={() => navigate("/history")}
          variant="outline"
          className="glass border-primary/30 hover:border-primary"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
      </div>

      {/* Header */}
      <div className="text-center mb-6 z-10">
        <div className="flex items-center justify-center gap-3 mb-2">
          <QrCode className="w-10 h-10 text-primary" />
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            QR Code Scanner
          </h1>
        </div>
        <p className="text-muted-foreground">Scan student QR code to mark attendance</p>
      </div>

      {/* Scanner container */}
      <div className="relative glass rounded-3xl overflow-hidden holographic-border max-w-lg w-full p-6 z-10">
        {!scanning && status === "idle" && (
          <div className="text-center py-12">
            <QrCode className="w-20 h-20 text-primary mx-auto mb-6" />
            <Button
              onClick={startScanner}
              className="bg-gradient-primary text-primary-foreground hover:shadow-glow-primary transition-all"
              size="lg"
            >
              <QrCode className="w-5 h-5 mr-2" />
              Start Scanner
            </Button>
          </div>
        )}

        {scanning && (
          <div>
            <div id={qrCodeRegionId} className="w-full" />
          </div>
        )}

        {scanning && (
          <Button
            onClick={stopScanner}
            variant="outline"
            className="w-full mt-4 glass border-destructive/30 hover:border-destructive"
          >
            Stop Scanner
          </Button>
        )}

        {/* Status messages */}
        {message && (
          <div className="mt-6 glass rounded-2xl p-4">
            {status === "scanning" && (
              <div className="flex items-center justify-center gap-3">
                <QrCode className="w-6 h-6 text-primary animate-pulse" />
                <p className="text-lg text-foreground">{message}</p>
              </div>
            )}

            {status === "success" && (
              <div className="flex flex-col items-center gap-3">
                <CheckCircle2 className="w-16 h-16 text-success drop-shadow-glow-success" />
                <p className="text-xl font-bold text-success text-center">{message}</p>
              </div>
            )}

            {status === "error" && (
              <div className="flex flex-col items-center gap-3">
                <XCircle className="w-16 h-16 text-destructive drop-shadow-glow-error" />
                <p className="text-xl font-bold text-destructive text-center">{message}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default QRScanner;
