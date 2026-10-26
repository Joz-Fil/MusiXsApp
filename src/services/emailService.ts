import { Platform } from "react-native";

export interface EmailDispatchResult {
  sent: boolean;
  provider?: string;
  error?: string;
}

/**
 * Dispatches a real 6-digit password reset verification code to the target email.
 * Supports Resend, EmailJS, Brevo (Sendinblue), and custom webhook providers.
 */
export async function dispatchResetCodeEmail(
  toEmail: string,
  code: string
): Promise<EmailDispatchResult> {
  const cleanEmail = toEmail.trim().toLowerCase();

  // 1. Brevo (Sendinblue) API - Active API Key with full CORS & multi-recipient support
  const brevoApiKey =
    process.env.EXPO_PUBLIC_BREVO_API_KEY ||
    "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";
  const brevoSender = process.env.EXPO_PUBLIC_BREVO_SENDER_EMAIL || "ducyogendonl@gmail.com";

  if (brevoApiKey) {
    try {
      const response = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
          "api-key": brevoApiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sender: { name: "MusiXs App", email: brevoSender },
          to: [{ email: cleanEmail }],
          subject: "Your MusiXs 6-Digit Password Reset Code",
          htmlContent: `
            <div style="font-family: sans-serif; padding: 24px; background: #16151a; color: #ffffff; border-radius: 12px; max-width: 480px;">
              <h2 style="color: #9b87f5; margin-top: 0;">MusiXs Password Reset</h2>
              <p>You requested a verification code to reset your MusiXs account password.</p>
              <div style="margin: 24px 0; padding: 18px; background: #26242e; border: 1px solid #7c67e8; border-radius: 10px; text-align: center;">
                <span style="font-size: 32px; font-weight: 800; letter-spacing: 6px; color: #ffffff;">${code}</span>
              </div>
              <p style="color: #8c8998; font-size: 13px;">This code is valid for 15 minutes. If you did not request this code, you can safely ignore this email.</p>
            </div>
          `,
        }),
      });

      if (response.ok) {
        return { sent: true, provider: "Brevo" };
      }
      const errData: any = await response.json().catch(() => ({}));
      const errorMsg = errData.message || "Brevo dispatch failed";
      console.warn("Brevo email dispatch error:", errorMsg);
    } catch (err: any) {
      console.warn("Brevo email dispatch failed:", err.message);
    }
  }

  // 2. Resend API (https://resend.com - Active API key configured)
  const resendApiKey =
    process.env.EXPO_PUBLIC_RESEND_API_KEY || "re_eX7YijbV_4Gjx1HLaAqsufzvsMDHfEj8A";

  if (resendApiKey) {
    // Browsers block direct client requests to api.resend.com with CORS preflight errors.
    // Native Android / iOS builds bypass CORS and send directly.
    if (Platform.OS === "web") {
      console.info(
        "Notice: Resend API direct calls are restricted by browser CORS in Web mode. For native Android builds, Resend dispatches directly."
      );
      return {
        sent: false,
        provider: "Resend",
        error: "Browser CORS restricts direct Resend API calls on Web. On native Android build, Resend dispatches directly.",
      };
    }

    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "MusiXs App <onboarding@resend.dev>",
          to: [cleanEmail],
          subject: "Your MusiXs 6-Digit Password Reset Code",
          html: `
            <div style="font-family: sans-serif; padding: 24px; background: #16151a; color: #ffffff; border-radius: 12px; max-width: 480px;">
              <h2 style="color: #9b87f5; margin-top: 0;">MusiXs Password Reset</h2>
              <p>You requested a verification code to reset your MusiXs account password.</p>
              <div style="margin: 24px 0; padding: 18px; background: #26242e; border: 1px solid #7c67e8; border-radius: 10px; text-align: center;">
                <span style="font-size: 32px; font-weight: 800; letter-spacing: 6px; color: #ffffff;">${code}</span>
              </div>
              <p style="color: #8c8998; font-size: 13px;">This code is valid for 15 minutes. If you did not request this code, you can safely ignore this email.</p>
            </div>
          `,
        }),
      });

      if (response.ok) {
        return { sent: true, provider: "Resend" };
      }
      const errData: any = await response.json().catch(() => ({}));
      const errorMsg = errData.message || "Resend dispatch failed";
      console.warn("Resend email dispatch error:", errorMsg);
      return { sent: false, provider: "Resend", error: errorMsg };
    } catch (err: any) {
      console.warn("Resend email dispatch failed:", err.message);
      return { sent: false, provider: "Resend", error: err.message };
    }
  }

  // 2. EmailJS (https://www.emailjs.com)
  const emailJsServiceId = process.env.EXPO_PUBLIC_EMAILJS_SERVICE_ID;
  const emailJsTemplateId = process.env.EXPO_PUBLIC_EMAILJS_TEMPLATE_ID;
  const emailJsPublicKey = process.env.EXPO_PUBLIC_EMAILJS_PUBLIC_KEY;

  if (emailJsServiceId && emailJsTemplateId && emailJsPublicKey) {
    try {
      const response = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          service_id: emailJsServiceId,
          template_id: emailJsTemplateId,
          user_id: emailJsPublicKey,
          template_params: {
            to_email: cleanEmail,
            passcode: code,
            code: code,
            email: cleanEmail,
          },
        }),
      });

      if (response.ok) {
        return { sent: true, provider: "EmailJS" };
      }
      const errText = await response.text();
      return { sent: false, error: errText };
    } catch (err: any) {
      return { sent: false, error: err.message };
    }
  }

  // 4. Custom Webhook / API Endpoint
  const webhookUrl = process.env.EXPO_PUBLIC_EMAIL_API_URL;
  if (webhookUrl) {
    try {
      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: cleanEmail,
          code,
          subject: "Your MusiXs Password Reset Code",
        }),
      });
      if (response.ok) {
        return { sent: true, provider: "Custom Webhook" };
      }
    } catch (err: any) {
      return { sent: false, error: err.message };
    }
  }

  return {
    sent: false,
    error: "No email dispatch service configured.",
  };
}
