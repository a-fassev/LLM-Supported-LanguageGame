import { CenteredCard } from "@/components/game/layout/CenteredCard";
import { GameBackground } from "@/components/game/layout/GameBackground";
import { LoginForm } from "@/components/game/screens/LoginForm";
import { Card } from "@/components/ui/card";

export default function LoginPage() {
  return (
    <GameBackground mode="hub">
      <CenteredCard>
        <Card className="bg-transparent shadow-none ring-0">
          <LoginForm />
        </Card>
      </CenteredCard>
    </GameBackground>
  );
}
