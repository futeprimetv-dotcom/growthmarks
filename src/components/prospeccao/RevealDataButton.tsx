import { useState } from "react";
import { Eye, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useRevealProspectData } from "@/hooks/useProspects";

interface Props {
  prospectId: string;
  emailsCount: number;
  phonesCount: number;
  isRevealed: boolean;
  emails?: string[];
  phones?: string[];
}

export function RevealDataButton({ prospectId, emailsCount, phonesCount, isRevealed, emails, phones }: Props) {
  const [revealedData, setRevealedData] = useState<{ emails: string[]; phones: string[] } | null>(
    isRevealed && emails && phones ? { emails, phones } : null
  );
  const revealMutation = useRevealProspectData();

  const handleReveal = async () => {
    const result = await revealMutation.mutateAsync(prospectId);
    setRevealedData(result);
  };

  if (revealedData) {
    return (
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="text-green-600">
            <Eye className="h-4 w-4 mr-1" />
            Ver dados
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-72">
          <div className="space-y-3">
            {revealedData.emails.length > 0 && (
              <div>
                <h4 className="font-medium text-sm mb-1">Emails</h4>
                <div className="space-y-1">
                  {revealedData.emails.map((email, i) => (
                    <a
                      key={i}
                      href={`mailto:${email}`}
                      className="text-sm text-primary hover:underline block"
                    >
                      {email}
                    </a>
                  ))}
                </div>
              </div>
            )}
            {revealedData.phones.length > 0 && (
              <div>
                <h4 className="font-medium text-sm mb-1">Telefones</h4>
                <div className="space-y-1">
                  {revealedData.phones.map((phone, i) => (
                    <a
                      key={i}
                      href={`tel:${phone.replace(/\D/g, '')}`}
                      className="text-sm text-primary hover:underline block"
                    >
                      {phone}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>
    );
  }

  const totalCount = emailsCount + phonesCount;
  if (totalCount === 0) {
    return (
      <span className="text-sm text-muted-foreground">Sem dados</span>
    );
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleReveal}
      disabled={revealMutation.isPending}
    >
      {revealMutation.isPending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <>
          <Eye className="h-4 w-4 mr-1" />
          Revelar ({totalCount})
        </>
      )}
    </Button>
  );
}
