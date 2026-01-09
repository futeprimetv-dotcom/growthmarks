import { LeadsList } from "@/components/comercial/LeadsList";
import { LeadRemindersAlert } from "@/components/comercial/LeadRemindersAlert";

export default function Leads() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Leads</h1>
        <p className="text-muted-foreground">Cadastre e gerencie seus leads</p>
      </div>

      <LeadRemindersAlert />

      <LeadsList />
    </div>
  );
}
