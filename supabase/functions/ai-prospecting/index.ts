import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CompanyData {
  name: string;
  cnpj?: string;
  segment?: string;
  city?: string;
  state?: string;
  companySize?: string;
  cnaeCode?: string;
  cnaeDescription?: string;
  phones?: string[];
  emails?: string[];
  website?: string;
  instagram?: string[];
}

interface ICPConfig {
  targetSegments: string[];
  preferredSizes: string[];
  targetStates: string[];
  minTicket: number;
  toneOfVoice: "formal" | "casual" | "technical" | "consultative";
}

type AnalysisType = 
  | "analyze-fit" 
  | "generate-summary" 
  | "suggest-approach" 
  | "generate-script" 
  | "qualify-lead"
  | "batch-analyze"
  | "digital-presence";

const DEFAULT_ICP: ICPConfig = {
  targetSegments: ["Marketing", "Tecnologia", "E-commerce", "Varejo"],
  preferredSizes: ["ME", "EPP", "Médio"],
  targetStates: ["SP", "RJ", "MG", "PR", "SC", "RS"],
  minTicket: 1500,
  toneOfVoice: "consultative"
};

function buildSystemPrompt(type: AnalysisType, icp: ICPConfig): string {
  const baseContext = `Você é um especialista em vendas B2B e prospecção de clientes para uma agência de marketing digital.
O Perfil de Cliente Ideal (ICP) da empresa é:
- Segmentos prioritários: ${icp.targetSegments.join(", ")}
- Portes preferidos: ${icp.preferredSizes.join(", ")}
- Estados-alvo: ${icp.targetStates.join(", ")}
- Ticket mínimo: R$ ${icp.minTicket}
- Tom de comunicação: ${icp.toneOfVoice === "formal" ? "Formal e profissional" : icp.toneOfVoice === "casual" ? "Descontraído e amigável" : icp.toneOfVoice === "technical" ? "Técnico e detalhado" : "Consultivo e educativo"}`;

  const prompts: Record<AnalysisType, string> = {
    "analyze-fit": `${baseContext}

Sua tarefa é analisar se uma empresa é adequada como prospect baseado no ICP definido.
Retorne SEMPRE um JSON válido com exatamente esta estrutura:
{
  "score": <número de 0 a 100>,
  "recommendation": "prospectar" | "avaliar" | "ignorar",
  "justification": "<justificativa em 2-3 frases>",
  "strengths": ["<ponto forte 1>", "<ponto forte 2>"],
  "concerns": ["<preocupação 1>", "<preocupação 2>"]
}`,

    "generate-summary": `${baseContext}

Sua tarefa é gerar um resumo executivo de uma empresa para a equipe comercial.
Retorne SEMPRE um JSON válido com exatamente esta estrutura:
{
  "summary": "<resumo em 2-3 parágrafos>",
  "keyPoints": ["<ponto chave 1>", "<ponto chave 2>", "<ponto chave 3>"],
  "opportunities": ["<oportunidade 1>", "<oportunidade 2>"],
  "suggestedServices": ["<serviço 1>", "<serviço 2>"]
}`,

    "suggest-approach": `${baseContext}

Sua tarefa é sugerir a melhor abordagem comercial para um prospect.
Retorne SEMPRE um JSON válido com exatamente esta estrutura:
{
  "channel": "whatsapp" | "email" | "telefone" | "linkedin",
  "timing": "<melhor horário/dia para contato>",
  "approach": "<ângulo de abordagem recomendado>",
  "pitch": "<pitch de uma linha>",
  "icebreaker": "<frase de abertura sugerida>"
}`,

    "generate-script": `${baseContext}

Sua tarefa é criar um script de primeiro contato personalizado.
O script deve ser natural, não parecer robótico, e gerar interesse.
Retorne SEMPRE um JSON válido com exatamente esta estrutura:
{
  "script": "<script completo para copiar e usar>",
  "followUp": "<sugestão de follow-up se não responder>",
  "objections": [
    {"objection": "<objeção comum 1>", "response": "<resposta sugerida 1>"},
    {"objection": "<objeção comum 2>", "response": "<resposta sugerida 2>"}
  ]
}`,

    "qualify-lead": `${baseContext}

Sua tarefa é qualificar um lead e sugerir próximos passos.
Retorne SEMPRE um JSON válido com exatamente esta estrutura:
{
  "classification": "A" | "B" | "C" | "D",
  "temperature": "hot" | "warm" | "cold",
  "probability": <número de 0 a 100>,
  "estimatedValue": <número estimado do ticket>,
  "nextAction": "<próxima ação recomendada>",
  "timeToClose": "<tempo estimado para fechamento>",
  "reasoning": "<justificativa da classificação>"
}`,

    "batch-analyze": `${baseContext}

Sua tarefa é analisar múltiplas empresas e ranqueá-las por fit.
Retorne SEMPRE um JSON válido com exatamente esta estrutura:
{
  "rankings": [
    {"companyName": "<nome>", "score": <0-100>, "recommendation": "prospectar" | "avaliar" | "ignorar", "quickNote": "<nota rápida>"}
  ]
}`,

    "digital-presence": `${baseContext}

Sua tarefa é analisar a presença digital de uma empresa e descobrir informações de contato CORRETAS, incluindo HORÁRIO DE FUNCIONAMENTO.

ATENÇÃO CRÍTICA - VALIDAÇÃO DE DADOS:
- Os dados fornecidos podem conter ERROS ou informações de OUTRAS EMPRESAS misturadas.
- Você DEVE validar se cada informação (Instagram, website, etc.) realmente pertence à empresa analisada.
- Compare o nome/segmento da empresa com o conteúdo dos perfis sociais informados.
- Se um Instagram ou rede social não corresponder ao nome da empresa, IGNORE e busque o correto.

PRIORIDADE DE FONTES (use nesta ordem):
1. Google Business/Maps - FONTE PRIMÁRIA para horários, telefone e endereço
2. Website oficial da empresa
3. Redes sociais (Instagram, Facebook, LinkedIn)
4. Diretórios empresariais

Com base no nome da empresa, segmento, cidade e outras informações disponíveis, você deve:
1. VALIDAR se as informações já fornecidas realmente pertencem a esta empresa
2. Identificar se a empresa possui um website e qual seria o domínio provável (baseado no nome)
3. Identificar possíveis perfis em redes sociais que CORRESPONDAM ao nome da empresa
4. Identificar possível número de WhatsApp comercial
5. Avaliar a maturidade digital da empresa
6. Identificar HORÁRIO DE FUNCIONAMENTO (muito importante!)

REGRAS PARA WHATSAPP:
- Se houver telefones listados, o WhatsApp comercial geralmente é o primeiro telefone celular (começando com 9)
- Formato brasileiro: (DDD) 9XXXX-XXXX
- Se só houver telefones fixos, indique isso como "possível WhatsApp fixo"

REGRAS PARA HORÁRIO DE FUNCIONAMENTO:
- Busque horário comercial típico para o segmento se não houver informação específica
- Para clínicas/consultórios médicos: geralmente Seg-Sex 8h-18h, Sáb 8h-12h
- Para comércios: geralmente Seg-Sáb 9h-18h
- Indique se é estimado ou confirmado

REGRAS PARA REDES SOCIAIS:
- O handle do Instagram deve ter relação com o NOME da empresa
- Se o Instagram fornecido não tiver relação com o nome da empresa, retorne null e sugira buscar manualmente
- Priorize encontrar perfis que façam sentido para o segmento da empresa

Retorne SEMPRE um JSON válido com exatamente esta estrutura:
{
  "website": {
    "found": true | false,
    "url": "<url do website ou null>",
    "confidence": "alta" | "média" | "baixa",
    "notes": "<observação sobre o website>",
    "validated": true | false
  },
  "whatsapp": {
    "found": true | false,
    "number": "<número formatado ou null>",
    "confidence": "alta" | "média" | "baixa",
    "source": "<de onde veio a informação>",
    "isMobile": true | false
  },
  "socialMedia": {
    "instagram": "<url ou @handle ou null - APENAS se corresponder ao nome da empresa>",
    "instagramValidated": true | false,
    "instagramNote": "<se invalidado, explicar por quê>",
    "facebook": "<url ou null>",
    "linkedin": "<url ou null>",
    "tiktok": "<url ou @handle ou null>"
  },
  "businessHours": {
    "found": true | false,
    "isEstimated": true | false,
    "hours": {
      "monday": "<horário ou 'Fechado' ou null>",
      "tuesday": "<horário ou 'Fechado' ou null>",
      "wednesday": "<horário ou 'Fechado' ou null>",
      "thursday": "<horário ou 'Fechado' ou null>",
      "friday": "<horário ou 'Fechado' ou null>",
      "saturday": "<horário ou 'Fechado' ou null>",
      "sunday": "<horário ou 'Fechado' ou null>"
    },
    "summary": "<resumo ex: Seg-Sex 8h-18h, Sáb 8h-12h>",
    "source": "google" | "website" | "estimado"
  },
  "googleRating": {
    "found": true | false,
    "rating": <número de 1-5 ou null>,
    "reviewCount": <número ou null>
  },
  "digitalMaturity": {
    "level": "alta" | "média" | "baixa" | "inexistente",
    "score": <número de 0 a 100>,
    "analysis": "<análise breve da presença digital>"
  },
  "dataQualityWarnings": [
    "<alerta sobre dados inconsistentes, se houver>"
  ],
  "contactSuggestions": [
    "<sugestão 1 para encontrar contatos>",
    "<sugestão 2>"
  ]
}`
  };

  return prompts[type];
}

function buildUserPrompt(type: AnalysisType, data: CompanyData | CompanyData[], channel?: string): string {
  if (type === "batch-analyze" && Array.isArray(data)) {
    return `Analise as seguintes empresas e ranqueie por fit:
${data.map((c, i) => `${i + 1}. ${c.name} - Segmento: ${c.segment || "N/A"}, Cidade: ${c.city || "N/A"}/${c.state || "N/A"}, Porte: ${c.companySize || "N/A"}`).join("\n")}`;
  }

  const company = data as CompanyData;
  const companyInfo = `
Empresa: ${company.name}
CNPJ: ${company.cnpj || "N/A"}
Segmento: ${company.segment || "N/A"}
CNAE: ${company.cnaeCode || "N/A"} - ${company.cnaeDescription || "N/A"}
Cidade/Estado: ${company.city || "N/A"}/${company.state || "N/A"}
Porte: ${company.companySize || "N/A"}
Website: ${company.website || "N/A"}
Contatos: ${company.phones?.length ? company.phones.join(", ") : "N/A"}
Email: ${company.emails?.length ? company.emails.join(", ") : "N/A"}
Instagram: ${company.instagram?.length ? company.instagram.join(", ") : "N/A"}
`;

  const prompts: Record<AnalysisType, string> = {
    "analyze-fit": `Analise o fit desta empresa com nosso ICP:\n${companyInfo}`,
    "generate-summary": `Gere um resumo executivo desta empresa:\n${companyInfo}`,
    "suggest-approach": `Sugira a melhor abordagem para esta empresa:\n${companyInfo}`,
    "generate-script": `Crie um script de primeiro contato via ${channel || "whatsapp"} para:\n${companyInfo}`,
    "qualify-lead": `Qualifique este lead:\n${companyInfo}`,
    "batch-analyze": "",
    "digital-presence": `Analise a presença digital e descubra informações de contato desta empresa:\n${companyInfo}\n\nSe a empresa tiver telefones listados, o primeiro geralmente é o WhatsApp comercial.`
  };

  return prompts[type];
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, company, companies, channel, icpConfig } = await req.json();
    
    if (!type) {
      throw new Error("Tipo de análise não especificado");
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY não configurada");
    }

    const icp: ICPConfig = icpConfig ? { ...DEFAULT_ICP, ...icpConfig } : DEFAULT_ICP;
    const data = type === "batch-analyze" ? companies : company;
    
    if (!data) {
      throw new Error("Dados da empresa não fornecidos");
    }

    const systemPrompt = buildSystemPrompt(type, icp);
    const userPrompt = buildUserPrompt(type, data, channel);

    console.log(`AI Prospecting - Type: ${type}, Company: ${type === "batch-analyze" ? "batch" : (data as CompanyData).name}`);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ 
          error: "Limite de requisições excedido. Tente novamente em alguns minutos." 
        }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ 
          error: "Créditos insuficientes. Adicione créditos em Configurações > Workspace." 
        }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);
      throw new Error(`Erro no gateway de IA: ${response.status}`);
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("Resposta vazia da IA");
    }

    // Parse JSON from response
    let result;
    try {
      // Try to extract JSON from the response (in case there's extra text)
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("JSON não encontrado na resposta");
      }
    } catch (parseError) {
      console.error("Parse error:", parseError, "Content:", content);
      throw new Error("Erro ao processar resposta da IA");
    }

    return new Response(JSON.stringify({ 
      success: true, 
      type,
      data: result 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("AI Prospecting error:", error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error instanceof Error ? error.message : "Erro desconhecido" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
