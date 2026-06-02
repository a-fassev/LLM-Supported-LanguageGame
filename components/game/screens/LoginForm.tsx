"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { login, getSession } from "@/lib/api-client";
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
      <CardHeader className="px-0 pt-0">
        <CardTitle className="text-center text-2xl">Accedi</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 px-0">
        <div className="space-y-2">
          <Label htmlFor="username">Nome utente</Label>
          <Input
            id="username"
            autoComplete="username"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            placeholder="nome-utente"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </div>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
      </CardContent>
      <CardFooter className="flex flex-col gap-2 px-0 pb-0">
        <Button className="w-full" type="submit" disabled={pending}>
          {pending ? "Accesso..." : "Accedi"}
        </Button>
        <Button className="w-full" type="button" variant="outline" onClick={() => router.push("/register")}>
          Registrati
        </Button>
      </CardFooter>
    </form>
  );
}
