-- Create contract_templates table
CREATE TABLE public.contract_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  service_type TEXT NOT NULL,
  content TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.contract_templates ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Authenticated users can view contract_templates"
ON public.contract_templates
FOR SELECT
USING (is_authenticated());

CREATE POLICY "Authenticated users can manage contract_templates"
ON public.contract_templates
FOR ALL
USING (is_authenticated());

-- Create trigger for updated_at
CREATE TRIGGER update_contract_templates_updated_at
BEFORE UPDATE ON public.contract_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default templates
INSERT INTO public.contract_templates (name, service_type, description, content) VALUES
(
  'Contrato Social Media',
  'social_media',
  'Template padrão para serviços de gestão de redes sociais',
  '<h2 style="text-align: center; margin-bottom: 20px;">CONTRATO DE PRESTAÇÃO DE SERVIÇOS DE SOCIAL MEDIA</h2>

<p><strong>CONTRATANTE:</strong> {{cliente_nome}}, inscrito no CNPJ sob nº {{cliente_cnpj}}, com sede em {{cliente_endereco}}, neste ato representado na forma de seu contrato social.</p>

<p><strong>CONTRATADA:</strong> {{empresa_nome}}, inscrita no CNPJ sob nº {{empresa_cnpj}}, com sede em {{empresa_endereco}}.</p>

<h3>CLÁUSULA PRIMEIRA - DO OBJETO</h3>
<p>O presente contrato tem por objeto a prestação de serviços de gestão de redes sociais, incluindo:</p>
<ul>
  <li>Criação e curadoria de conteúdo para redes sociais</li>
  <li>Gestão de calendário editorial</li>
  <li>Monitoramento e interação com seguidores</li>
  <li>Relatórios mensais de desempenho</li>
</ul>

<h3>CLÁUSULA SEGUNDA - DO VALOR E FORMA DE PAGAMENTO</h3>
<p>Pelos serviços prestados, a CONTRATANTE pagará à CONTRATADA o valor mensal de <strong>R$ {{valor}}</strong>, com vencimento todo dia 10 de cada mês.</p>

<h3>CLÁUSULA TERCEIRA - DO PRAZO</h3>
<p>O presente contrato terá vigência de {{data_inicio}} a {{data_fim}}, podendo ser renovado mediante acordo entre as partes.</p>

<h3>CLÁUSULA QUARTA - DA RESCISÃO</h3>
<p>O presente contrato poderá ser rescindido por qualquer das partes mediante aviso prévio de 30 (trinta) dias.</p>

<p style="margin-top: 40px;">{{cidade}}, {{data_atual}}</p>

<div style="display: flex; justify-content: space-between; margin-top: 60px;">
  <div style="text-align: center; width: 45%;">
    <p>_________________________________</p>
    <p><strong>CONTRATANTE</strong></p>
    <p>{{cliente_nome}}</p>
  </div>
  <div style="text-align: center; width: 45%;">
    <p>_________________________________</p>
    <p><strong>CONTRATADA</strong></p>
    <p>{{empresa_nome}}</p>
  </div>
</div>'
),
(
  'Contrato Tráfego Pago',
  'trafego',
  'Template padrão para serviços de gestão de tráfego pago',
  '<h2 style="text-align: center; margin-bottom: 20px;">CONTRATO DE PRESTAÇÃO DE SERVIÇOS DE TRÁFEGO PAGO</h2>

<p><strong>CONTRATANTE:</strong> {{cliente_nome}}, inscrito no CNPJ sob nº {{cliente_cnpj}}, com sede em {{cliente_endereco}}, neste ato representado na forma de seu contrato social.</p>

<p><strong>CONTRATADA:</strong> {{empresa_nome}}, inscrita no CNPJ sob nº {{empresa_cnpj}}, com sede em {{empresa_endereco}}.</p>

<h3>CLÁUSULA PRIMEIRA - DO OBJETO</h3>
<p>O presente contrato tem por objeto a prestação de serviços de gestão de tráfego pago, incluindo:</p>
<ul>
  <li>Criação e gerenciamento de campanhas no Meta Ads (Facebook/Instagram)</li>
  <li>Criação e gerenciamento de campanhas no Google Ads</li>
  <li>Otimização contínua de campanhas</li>
  <li>Relatórios semanais e mensais de performance</li>
  <li>Consultoria estratégica de investimento</li>
</ul>

<p><strong>Observação:</strong> O valor de investimento em mídia (verba de anúncios) é de responsabilidade exclusiva do CONTRATANTE e não está incluso no valor deste contrato.</p>

<h3>CLÁUSULA SEGUNDA - DO VALOR E FORMA DE PAGAMENTO</h3>
<p>Pelos serviços prestados, a CONTRATANTE pagará à CONTRATADA o valor mensal de <strong>R$ {{valor}}</strong>, com vencimento todo dia 10 de cada mês.</p>

<h3>CLÁUSULA TERCEIRA - DO PRAZO</h3>
<p>O presente contrato terá vigência de {{data_inicio}} a {{data_fim}}, podendo ser renovado mediante acordo entre as partes.</p>

<h3>CLÁUSULA QUARTA - DA RESCISÃO</h3>
<p>O presente contrato poderá ser rescindido por qualquer das partes mediante aviso prévio de 30 (trinta) dias.</p>

<p style="margin-top: 40px;">{{cidade}}, {{data_atual}}</p>

<div style="display: flex; justify-content: space-between; margin-top: 60px;">
  <div style="text-align: center; width: 45%;">
    <p>_________________________________</p>
    <p><strong>CONTRATANTE</strong></p>
    <p>{{cliente_nome}}</p>
  </div>
  <div style="text-align: center; width: 45%;">
    <p>_________________________________</p>
    <p><strong>CONTRATADA</strong></p>
    <p>{{empresa_nome}}</p>
  </div>
</div>'
),
(
  'Contrato Full Marketing',
  'full_marketing',
  'Template completo para serviços de marketing digital integrado',
  '<h2 style="text-align: center; margin-bottom: 20px;">CONTRATO DE PRESTAÇÃO DE SERVIÇOS DE MARKETING DIGITAL</h2>

<p><strong>CONTRATANTE:</strong> {{cliente_nome}}, inscrito no CNPJ sob nº {{cliente_cnpj}}, com sede em {{cliente_endereco}}, neste ato representado na forma de seu contrato social.</p>

<p><strong>CONTRATADA:</strong> {{empresa_nome}}, inscrita no CNPJ sob nº {{empresa_cnpj}}, com sede em {{empresa_endereco}}.</p>

<h3>CLÁUSULA PRIMEIRA - DO OBJETO</h3>
<p>O presente contrato tem por objeto a prestação de serviços completos de marketing digital, incluindo:</p>

<h4>1. Gestão de Redes Sociais</h4>
<ul>
  <li>Criação de conteúdo para Instagram, Facebook e LinkedIn</li>
  <li>Gestão de calendário editorial</li>
  <li>Monitoramento e SAC 2.0</li>
</ul>

<h4>2. Tráfego Pago</h4>
<ul>
  <li>Gestão de campanhas Meta Ads e Google Ads</li>
  <li>Otimização contínua e testes A/B</li>
  <li>Relatórios de performance</li>
</ul>

<h4>3. Produção de Conteúdo</h4>
<ul>
  <li>Produção fotográfica mensal</li>
  <li>Edição de vídeos para reels/stories</li>
  <li>Design de peças gráficas</li>
</ul>

<h4>4. Estratégia e Planejamento</h4>
<ul>
  <li>Planejamento estratégico mensal</li>
  <li>Reuniões de alinhamento quinzenais</li>
  <li>Consultoria de posicionamento</li>
</ul>

<h3>CLÁUSULA SEGUNDA - DO VALOR E FORMA DE PAGAMENTO</h3>
<p>Pelos serviços prestados, a CONTRATANTE pagará à CONTRATADA o valor mensal de <strong>R$ {{valor}}</strong>, com vencimento todo dia 10 de cada mês.</p>

<h3>CLÁUSULA TERCEIRA - DO PRAZO</h3>
<p>O presente contrato terá vigência de {{data_inicio}} a {{data_fim}}, com prazo mínimo de 6 (seis) meses, podendo ser renovado mediante acordo entre as partes.</p>

<h3>CLÁUSULA QUARTA - DA RESCISÃO</h3>
<p>O presente contrato poderá ser rescindido por qualquer das partes mediante aviso prévio de 30 (trinta) dias, respeitado o prazo mínimo de permanência.</p>

<h3>CLÁUSULA QUINTA - DA CONFIDENCIALIDADE</h3>
<p>As partes se comprometem a manter sigilo sobre todas as informações confidenciais compartilhadas durante a vigência deste contrato.</p>

<p style="margin-top: 40px;">{{cidade}}, {{data_atual}}</p>

<div style="display: flex; justify-content: space-between; margin-top: 60px;">
  <div style="text-align: center; width: 45%;">
    <p>_________________________________</p>
    <p><strong>CONTRATANTE</strong></p>
    <p>{{cliente_nome}}</p>
  </div>
  <div style="text-align: center; width: 45%;">
    <p>_________________________________</p>
    <p><strong>CONTRATADA</strong></p>
    <p>{{empresa_nome}}</p>
  </div>
</div>'
);