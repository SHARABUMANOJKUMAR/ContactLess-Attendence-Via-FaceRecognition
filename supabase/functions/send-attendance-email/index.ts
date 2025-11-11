import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.81.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AttendanceEmailRequest {
  email: string;
  name: string;
  rollNumber: string;
  status: string;
  timestamp: string;
  confidenceScore?: number;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify JWT authentication
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ success: false, error: "Missing authorization header" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Extract JWT token
    const token = authHeader.replace("Bearer ", "");
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    // Verify the user is authenticated
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    if (authError || !user) {
      console.error("Authentication error:", authError);
      return new Response(JSON.stringify({ success: false, error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const { email, name, rollNumber, status, timestamp, confidenceScore }: AttendanceEmailRequest = await req.json();

    // Validate that authenticated user matches the email recipient
    if (user.email !== email) {
      console.error("Email mismatch: user email", user.email, "vs requested email", email);
      return new Response(JSON.stringify({ success: false, error: "Unauthorized: email mismatch" }), {
        status: 403,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    console.log("Authenticated user verified:", user.email);

    console.log("Sending attendance email to:", email);

    const statusColor = status === "present" ? "#10b981" : "#ef4444";
    const statusEmoji = status === "present" ? "✅" : "❌";

    const emailResponse = await resend.emails.send({
      from: "FacePresence <onboarding@resend.dev>",
      to: [email],
      subject: `Attendance ${status === "present" ? "Marked" : "Alert"} - ${rollNumber}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
              background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%);
              margin: 0;
              padding: 20px;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              background: white;
              border-radius: 16px;
              overflow: hidden;
              box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            }
            .header {
              background: linear-gradient(135deg, #00C9FF 0%, #92FE9D 100%);
              padding: 40px 30px;
              text-align: center;
            }
            .header h1 {
              margin: 0;
              color: #0f172a;
              font-size: 32px;
              font-weight: bold;
            }
            .content {
              padding: 40px 30px;
            }
            .status-badge {
              display: inline-block;
              padding: 12px 24px;
              border-radius: 8px;
              background: ${statusColor};
              color: white;
              font-size: 18px;
              font-weight: bold;
              margin: 20px 0;
            }
            .info-row {
              display: flex;
              justify-content: space-between;
              padding: 16px 0;
              border-bottom: 1px solid #e5e7eb;
            }
            .info-label {
              color: #6b7280;
              font-weight: 500;
            }
            .info-value {
              color: #1f2937;
              font-weight: 600;
            }
            .footer {
              background: #f9fafb;
              padding: 20px 30px;
              text-align: center;
              color: #6b7280;
              font-size: 14px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${statusEmoji} FacePresence</h1>
            </div>
            <div class="content">
              <h2 style="color: #1f2937; margin-top: 0;">Attendance Confirmation</h2>
              <p style="color: #4b5563; font-size: 16px;">Hello ${name},</p>
              <p style="color: #4b5563; font-size: 16px;">
                Your attendance has been ${status === "present" ? "successfully recorded" : "marked as absent"}.
              </p>
              
              <div class="status-badge">
                ${statusEmoji} ${status.toUpperCase()}
              </div>
              
              <div style="margin-top: 30px;">
                <div class="info-row">
                  <span class="info-label">Roll Number</span>
                  <span class="info-value">${rollNumber}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Name</span>
                  <span class="info-value">${name}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Date & Time</span>
                  <span class="info-value">${new Date(timestamp).toLocaleString()}</span>
                </div>
                ${confidenceScore ? `
                <div class="info-row">
                  <span class="info-label">Confidence Score</span>
                  <span class="info-value">${Math.round(confidenceScore * 100)}%</span>
                </div>
                ` : ''}
              </div>
              
              <p style="color: #6b7280; margin-top: 30px; font-size: 14px;">
                If you didn't mark this attendance, please contact your administrator immediately.
              </p>
            </div>
            <div class="footer">
              <p style="margin: 0;">© 2025 FacePresence. Powered by AI Face Recognition.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, data: emailResponse }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error sending attendance email:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
