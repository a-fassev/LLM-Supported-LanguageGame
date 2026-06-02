"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { register, suggestUsername, login, getSession } from "@/lib/api-client";
import { useGameSession } from "@/lib/game/session-context";

export function RegisterForm() {
  const router = useRouter();
  const { setSession } = useGameSession();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [pending, setPending] = useState(false);
  const [loadingUsername, setLoadingUsername] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void (async () => {
      setLoadingUsername(true);
      const result = await suggestUsername();
      if (!active) return;
      if (result.ok) {
        setUsername(result.data.username);
      } else {
        setError(result.error);
      }
      setLoadingUsername(false);
    })();
    return () => {
      active = false;
    };
  }, []);

  async function onRegenerate() {
    setLoadingUsername(true);
    const result = await suggestUsername();
    if (result.ok) {
      setUsername(result.data.username);
      setError(null);
    } else {
      setError(result.error);
    }
    setLoadingUsername(false);
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);

    let registerResult = await register({ username, password, passwordConfirm });
    if (!registerResult.ok && registerResult.code === "username_taken") {
      registerResult = await register({ password, passwordConfirm });
    }
    if (!registerResult.ok) {
      setError(registerResult.error);
      setPending(false);
      return;
    }
    const registeredUsername = registerResult.data.username;
    setUsername(registeredUsername);

    const loginResult = await login({ username: registeredUsername, password });
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
        <CardTitle className="text-center text-2xl">Registrati</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 px-0">
        <div className="space-y-2">
          <Label htmlFor="username">Nome utente</Label>
          <div className="flex gap-2">
            <Input id="username" value={username} readOnly />
            <Button type="button" variant="outline" onClick={onRegenerate} disabled={pending || loadingUsername}>
              Rigenera
            </Button>
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="passwordConfirm">Ripeti password</Label>
          <Input
            id="passwordConfirm"
            type="password"
            autoComplete="new-password"
            value={passwordConfirm}
            onChange={(event) => setPasswordConfirm(event.target.value)}
            required
          />
        </div>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
      </CardContent>
      <CardFooter className="flex flex-col gap-2 px-0 pb-0">
        <Button className="w-full" type="submit" disabled={pending || loadingUsername || username.length < 3}>
          {pending ? "Registrazione..." : loadingUsername ? "Preparazione..." : "Registrati"}
        </Button>
        <Button className="w-full" type="button" variant="outline" onClick={() => router.push("/login")}>
          Hai già un account? Accedi
        </Button>
      </CardFooter>
    </form>
  );
}
