import { useCRMSettings } from "./useCRMSettings";
import { Lead } from "./useLeads";

const DEFAULT_WEIGHTS = {
  temperature: 30,
  estimated_value: 25,
  urgency: 20,
  closing_probability: 15,
  invests_in_marketing: 10,
};

export function useLeadScore() {
  const { data: settings } = useCRMSettings();
  const weights = settings?.lead_score_weights || DEFAULT_WEIGHTS;

  const calculateScore = (lead: Partial<Lead>): number => {
    let score = 0;

    // Temperature (0-100 based on cold/warm/hot)
    const temperatureScore = lead.temperature === 'hot' ? 100 
      : lead.temperature === 'warm' ? 60 
      : 20;
    score += (temperatureScore * weights.temperature) / 100;

    // Estimated value (normalized 0-100, max R$50k)
    const maxValue = 50000;
    const valueScore = Math.min(((lead.estimated_value || 0) / maxValue) * 100, 100);
    score += (valueScore * weights.estimated_value) / 100;

    // Urgency (based on urgency field)
    const urgencyScore = lead.urgency === 'alta' ? 100 
      : lead.urgency === 'media' ? 60 
      : 20;
    score += (urgencyScore * weights.urgency) / 100;

    // Closing probability (direct percentage)
    const probabilityScore = lead.closing_probability || 0;
    score += (probabilityScore * weights.closing_probability) / 100;

    // Invests in marketing (boolean)
    const marketingScore = lead.invests_in_marketing ? 100 : 0;
    score += (marketingScore * weights.invests_in_marketing) / 100;

    return Math.round(score);
  };

  return { calculateScore, weights };
}
