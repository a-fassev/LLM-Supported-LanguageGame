import { CenteredCard } from "@/components/game/layout/CenteredCard";
import { GameBackground } from "@/components/game/layout/GameBackground";
import { RegisterForm } from "@/components/game/screens/RegisterForm";
import { Card } from "@/components/ui/card";

export default function RegisterPage() {
  return (
    <GameBackground mode="hub">
      <CenteredCard>
        <Card className="bg-transparent shadow-none ring-0">
          <RegisterForm />
        </Card>
      </CenteredCard>
    </GameBackground>
  );
}
