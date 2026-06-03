import { CenteredCard } from "@/components/game/layout/CenteredCard";
import { RegisterForm } from "@/components/game/screens/RegisterForm";
import { Card } from "@/components/ui/card";

export default function RegisterPage() {
  return (
    <CenteredCard>
      <Card className="bg-transparent shadow-none ring-0">
        <RegisterForm />
      </Card>
    </CenteredCard>
  );
}
