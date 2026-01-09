import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SignatureRequest {
  contractId: string;
  signerEmail: string;
  signerName: string;
  contractDetails: {
    clientName: string;
    companyName: string;
    value: string;
    services: string;
    startDate: string;
  };
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getUser(token);
    
    if (claimsError || !claimsData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { contractId, signerEmail, signerName, contractDetails }: SignatureRequest = await req.json();

    if (!contractId || !signerEmail || !signerName) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get contract and generate token
    const { data: contract, error: contractError } = await supabase
      .from("contracts")
      .select("*")
      .eq("id", contractId)
      .single();

    if (contractError || !contract) {
      return new Response(JSON.stringify({ error: "Contract not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Update contract with signer info
    const signatureToken = crypto.randomUUID();
    const { error: updateError } = await supabase
      .from("contracts")
      .update({
        signature_token: signatureToken,
        signer_email: signerEmail,
        signer_name: signerName,
        signature_status: "sent",
        signature_sent_at: new Date().toISOString(),
      })
      .eq("id", contractId);

    if (updateError) {
      console.error("Error updating contract:", updateError);
      return new Response(JSON.stringify({ error: "Failed to update contract" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build signature URL
    const baseUrl = Deno.env.get("SUPABASE_URL")?.replace(".supabase.co", ".lovable.app") || "";
    const signatureUrl = `${baseUrl}/assinar-contrato/${signatureToken}`;

    // Send email
    const emailResponse = await resend.emails.send({
      from: "Contratos <onboarding@resend.dev>",
      to: [signerEmail],
      subject: `Contrato para assinatura - ${contractDetails.companyName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }
            .details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #f3f4f6; }
            .detail-label { font-weight: bold; color: #6b7280; }
            .cta-button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>📄 Contrato para Assinatura</h1>
          </div>
          <div class="content">
            <p>Olá <strong>${signerName}</strong>,</p>
            <p>Você recebeu um contrato de <strong>${contractDetails.companyName}</strong> para assinatura digital.</p>
            
            <div class="details">
              <h3>Detalhes do Contrato</h3>
              <div class="detail-row">
                <span class="detail-label">Cliente:</span>
                <span>${contractDetails.clientName}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Serviços:</span>
                <span>${contractDetails.services}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Valor:</span>
                <span>${contractDetails.value}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Início:</span>
                <span>${contractDetails.startDate}</span>
              </div>
            </div>
            
            <p style="text-align: center;">
              <a href="${signatureUrl}" class="cta-button">
                ✍️ Assinar Contrato
              </a>
            </p>
            
            <p style="color: #6b7280; font-size: 14px;">
              Ao clicar no botão acima, você será direcionado para uma página segura onde poderá revisar e assinar o contrato digitalmente.
            </p>
          </div>
          <div class="footer">
            <p>Este email foi enviado automaticamente. Por favor, não responda.</p>
            <p>Se você não solicitou este contrato, ignore este email.</p>
          </div>
        </body>
        </html>
      `,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Email enviado com sucesso",
        signatureToken 
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error in send-contract-signature function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
};

serve(handler);
