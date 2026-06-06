"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { login, getSession } from "@/lib/api-client";
import { authUiLabels } from "@/lib/game/clientMessages";
import { useGameSession } from "@/lib/game/session-context";

export function LoginForm() {
  const router = useRouter();
  const { setSession } = useGameSession();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending(true);

    const loginResult = await login({ username, password });
    if (!loginResult.ok) {
      setError(loginResult.error);
      setPending(false);
      return;
    }

    const token = loginResult.data.token;
    const sessionResult = await getSession(token);
    if (!sessionResult.ok) {
      setError(sessionResult.error);
      setPending(false);
      return;
    }

    setSession({ token, account: sessionResult.data });
    router.replace("/menu");
  }

  return (
    <form onSubmit={onSubmit}>
      <CardHeader className="px-0 pt-0 text-center">
        <CardTitle className="text-2xl font-black text-[#5a2612] drop-shadow-[0_1px_0_rgba(255,246,216,0.95)]">
          Accedi
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3.5 px-0">
        <div className="space-y-2">
          <Label className="font-semibold text-[#5a2612]" htmlFor="username">
            {authUiLabels.username}
          </Label>
          <Input
            id="username"
            autoComplete="username"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            placeholder={authUiLabels.usernamePlaceholder}
            className="h-10 rounded-md border border-[#8f5a33]/20 bg-[#fffaf1]/88 px-3.5 text-[#3d1b0f] shadow-[inset_0_1px_2px_rgba(82,39,14,0.06),0_1px_0_rgba(255,255,255,0.7)] placeholder:text-[#7a4a2c]/65 focus-visible:border-[#b85c22]/65 focus-visible:ring-3 focus-visible:ring-[#d77a32]/20"
            required
          />
        </div>
        <div className="space-y-2">
          <Label className="font-semibold text-[#5a2612]" htmlFor="password">
            {authUiLabels.password}
          </Label>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder={authUiLabels.passwordPlaceholder}
            className="h-10 rounded-md border border-[#8f5a33]/20 bg-[#fffaf1]/88 px-3.5 text-[#3d1b0f] shadow-[inset_0_1px_2px_rgba(82,39,14,0.06),0_1px_0_rgba(255,255,255,0.7)] placeholder:text-[#7a4a2c]/65 focus-visible:border-[#b85c22]/65 focus-visible:ring-3 focus-visible:ring-[#d77a32]/20"
            required
          />
        </div>
        {error ? (
          <p className="rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive">
            {error}
          </p>
        ) : null}
      </CardContent>
      <CardFooter className="flex flex-col gap-2 border-0 bg-transparent px-0 pb-0">
        <Button
          className="h-10 w-full rounded-md border border-[#e7b074]/36 bg-[#9f4519] px-4 font-bold text-white shadow-[0_5px_12px_rgba(87,34,10,0.18),0_1px_0_rgba(255,238,202,0.22)_inset] hover:bg-[#b24d1f] hover:shadow-[0_7px_16px_rgba(87,34,10,0.22),0_1px_0_rgba(255,238,202,0.26)_inset]"
          type="submit"
          disabled={pending}
        >
          {pending ? "Accesso..." : "Accedi"}
        </Button>
        <Button
          className="h-10 w-full rounded-md border border-[#8f5a33]/22 bg-[#fff8eb]/58 px-4 font-semibold text-[#5a2612] shadow-sm shadow-[#5d2b0e]/8 hover:bg-[#fff3de] hover:text-[#3d1b0f]"
          type="button"
          variant="outline"
          onClick={() => router.push("/register")}
        >
          Registrati
        </Button>
      </CardFooter>
    </form>
  );
}
