import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Calendar, CheckCircle2, XCircle, TrendingUp, Download, User as UserIcon, LogOut } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";

interface AttendanceRecord {
  id: string;
  created_at: string;
  status: string;
  confidence_score: number;
  student_name: string;
  roll_number: string;
  email: string;
}

const AttendanceHistory = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, present: 0, absent: 0, rate: 0 });

  useEffect(() => {
    const checkAuthAndFetchData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/");
        return;
      }

      await fetchRecords(session.user.id);
    };

    checkAuthAndFetchData();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session || event === 'SIGNED_OUT') {
        navigate("/");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const fetchRecords = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("attendance_records")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      if (data) {
        setRecords(data);
        
        // Calculate stats
        const total = data.length;
        const present = data.filter(r => r.status === "present").length;
        const absent = data.filter(r => r.status === "absent").length;
        const rate = total > 0 ? Math.round((present / total) * 100) : 0;
        
        setStats({ total, present, absent, rate });
      }
    } catch (error) {
      console.error("Error fetching records:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const exportToCSV = () => {
    if (!records.length) {
      toast({
        title: "No data to export",
        description: "You don't have any attendance records yet.",
        variant: "destructive",
      });
      return;
    }

    const headers = ["Date", "Time", "Status", "Confidence Score", "Roll Number", "Name", "Email"];
    const csvContent = [
      headers.join(","),
      ...records.map(record => {
        const date = new Date(record.created_at);
        return [
          date.toLocaleDateString(),
          date.toLocaleTimeString(),
          record.status,
          record.confidence_score || "N/A",
          record.roll_number,
          record.student_name,
          record.email
        ].join(",");
      })
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `attendance-records-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: "Export successful",
      description: "Your attendance records have been downloaded as CSV.",
    });
  };

  const exportToPDF = () => {
    if (!records.length) {
      toast({
        title: "No data to export",
        description: "You don't have any attendance records yet.",
        variant: "destructive",
      });
      return;
    }

    // Create a simple HTML report
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Attendance Report</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          h1 { color: #00C9FF; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
          th { background-color: #00C9FF; color: white; }
          .stats { background: #f0f0f0; padding: 15px; border-radius: 8px; margin: 20px 0; }
          .present { color: green; font-weight: bold; }
          .absent { color: red; font-weight: bold; }
        </style>
      </head>
      <body>
        <h1>Attendance Report</h1>
        <div class="stats">
          <h3>Summary Statistics</h3>
          <p><strong>Total Records:</strong> ${stats?.total || 0}</p>
          <p><strong>Present:</strong> ${stats?.present || 0}</p>
          <p><strong>Absent:</strong> ${stats?.absent || 0}</p>
          <p><strong>Attendance Rate:</strong> ${stats?.rate || 0}%</p>
        </div>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Time</th>
              <th>Status</th>
              <th>Confidence Score</th>
              <th>Roll Number</th>
              <th>Name</th>
            </tr>
          </thead>
          <tbody>
            ${records.map(record => {
              const date = new Date(record.created_at);
              return `
                <tr>
                  <td>${date.toLocaleDateString()}</td>
                  <td>${date.toLocaleTimeString()}</td>
                  <td class="${record.status}">${record.status}</td>
                  <td>${record.confidence_score || "N/A"}</td>
                  <td>${record.roll_number}</td>
                  <td>${record.student_name}</td>
                </tr>
              `;
            }).join("")}
          </tbody>
        </table>
      </body>
      </html>
    `;

    const blob = new Blob([htmlContent], { type: "text/html" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `attendance-report-${new Date().toISOString().split('T')[0]}.html`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: "Export successful",
      description: "Your attendance report has been downloaded as HTML (open in browser to print as PDF).",
    });
  };

  return (
    <div className="min-h-screen p-4 md:p-8 relative overflow-hidden">
      {/* Background particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(12)].map((_, i) => (
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

      {/* Header */}
      <div className="max-w-6xl mx-auto relative z-10">
        <div className="flex flex-col gap-4 mb-8">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Attendance History
            </h1>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => navigate("/camera")}
              variant="outline"
              className="glass border-primary/30 hover:border-primary"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Camera
            </Button>
            <Button
              onClick={() => navigate("/profile")}
              variant="outline"
              className="glass border-accent/30 hover:border-accent"
            >
              <UserIcon className="w-4 h-4 mr-2" />
              Profile
            </Button>
            <Button
              onClick={exportToCSV}
              variant="outline"
              className="glass border-primary/30 hover:border-primary"
            >
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
            <Button
              onClick={exportToPDF}
              variant="outline"
              className="glass border-secondary/30 hover:border-secondary"
            >
              <Download className="w-4 h-4 mr-2" />
              Export PDF
            </Button>
            <Button
              onClick={handleLogout}
              variant="outline"
              className="glass border-destructive/30 hover:border-destructive"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="glass rounded-2xl p-6 holographic-border">
            <div className="flex items-center gap-3 mb-2">
              <Calendar className="w-5 h-5 text-primary" />
              <p className="text-sm text-muted-foreground">Total Records</p>
            </div>
            <p className="text-3xl font-bold text-foreground">{stats.total}</p>
          </div>

          <div className="glass rounded-2xl p-6 holographic-border">
            <div className="flex items-center gap-3 mb-2">
              <CheckCircle2 className="w-5 h-5 text-success" />
              <p className="text-sm text-muted-foreground">Present</p>
            </div>
            <p className="text-3xl font-bold text-success">{stats.present}</p>
          </div>

          <div className="glass rounded-2xl p-6 holographic-border">
            <div className="flex items-center gap-3 mb-2">
              <XCircle className="w-5 h-5 text-destructive" />
              <p className="text-sm text-muted-foreground">Absent</p>
            </div>
            <p className="text-3xl font-bold text-destructive">{stats.absent}</p>
          </div>

          <div className="glass rounded-2xl p-6 holographic-border">
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              <p className="text-sm text-muted-foreground">Attendance Rate</p>
            </div>
            <p className="text-3xl font-bold text-primary">{stats.rate}%</p>
          </div>
        </div>

        {/* Records List */}
        <div className="glass rounded-3xl p-6 md:p-8 holographic-border">
          <h2 className="text-2xl font-bold text-foreground mb-6">All Records</h2>
          
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p className="text-muted-foreground mt-4">Loading records...</p>
            </div>
          ) : records.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No attendance records yet</p>
              <button
                onClick={() => navigate("/camera")}
                className="mt-4 px-6 py-2 bg-gradient-primary text-primary-foreground rounded-lg hover:shadow-glow-primary transition-all"
              >
                Mark Attendance
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {records.map((record) => (
                <div
                  key={record.id}
                  className="glass rounded-xl p-4 flex items-center justify-between border border-primary/20 hover:border-primary/40 transition-all"
                >
                  <div className="flex items-center gap-4">
                    {record.status === "present" ? (
                      <CheckCircle2 className="w-8 h-8 text-success flex-shrink-0" />
                    ) : (
                      <XCircle className="w-8 h-8 text-destructive flex-shrink-0" />
                    )}
                    <div>
                      <p className="font-semibold text-foreground">
                        {record.student_name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {record.roll_number}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-sm font-medium text-foreground">
                      {format(new Date(record.created_at), "PPp")}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Confidence: {Math.round((record.confidence_score || 0) * 100)}%
                    </p>
                    <span
                      className={`inline-block px-2 py-1 rounded-full text-xs font-medium mt-1 ${
                        record.status === "present"
                          ? "bg-success/20 text-success"
                          : "bg-destructive/20 text-destructive"
                      }`}
                    >
                      {record.status.toUpperCase()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AttendanceHistory;
