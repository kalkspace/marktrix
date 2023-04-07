import React, { FormEvent, useCallback, useEffect, useState } from "react";
import { useClientContext } from "./App";
import { AutoDiscovery, MatrixClient, createClient } from "matrix-js-sdk";

interface SessionResumptionDetails {
  baseUrl: string;
  accessToken: string;
  userId: string;
}

const SESSION_RESUMPTION_KEY = "marktrix.session";

export const Login: React.FC<{
  onLoginSuccess: (client: MatrixClient) => void;
}> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState<any | null>(null);

  useEffect(() => {
    (async () => {
      // try session resumption
      const resumedSession = localStorage.getItem(SESSION_RESUMPTION_KEY);
      if (resumedSession) {
        try {
          const {
            baseUrl,
            accessToken,
            userId,
          }: Partial<SessionResumptionDetails> = JSON.parse(resumedSession);
          if (accessToken && baseUrl && userId) {
            const client = createClient({ baseUrl, userId });
            client.setAccessToken(accessToken);
            await client.startClient({ initialSyncLimit: 10 });
            setLoginError(null);
            onLoginSuccess(client);
            return;
          }
        } catch (e) {
          console.debug("failed to resume session", e);
        }
      }
    })();
  }, []);

  const login = useCallback(
    (ev: FormEvent) => {
      ev.preventDefault();
      (async () => {
        try {
          const [_, servername] = username.split(":");

          const clientConfig = await AutoDiscovery.findClientConfig(servername);
          const { state, error } = clientConfig["m.homeserver"];
          if (state !== AutoDiscovery.SUCCESS) {
            throw new Error(`unable to discover homeserver: ${error}`);
          }
          console.log(clientConfig["m.homeserver"]);

          const baseUrl = (clientConfig["m.homeserver"] as any)?.["base_url"];
          const client = createClient({ baseUrl });
          // Spec: https://www.matrix.org/docs/guides/client-server-api#login
          await client.login("m.login.password", {
            user: username,
            password: password,
          });
          await client.startClient({ initialSyncLimit: 10 });

          // persist to localstorage
          const session: SessionResumptionDetails = {
            baseUrl,
            accessToken: client.getAccessToken() as string,
            userId: client.getUserId() as string,
          };
          localStorage.setItem(SESSION_RESUMPTION_KEY, JSON.stringify(session));

          setLoginError(null);
          onLoginSuccess(client);
        } catch (e) {
          console.error("login failed", e);
          setLoginError(e);
        }
      })();
    },
    [username, password, onLoginSuccess]
  );

  return (
    <form onSubmit={login}>
      {loginError && (
        <div role="alert">Failed to login: {String(loginError)}</div>
      )}
      <input
        type="username"
        placeholder="username"
        value={username}
        onChange={(event) => setUsername(event.target.value)}
      />
      <input
        type="password"
        placeholder="password"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
      />
      <button type="submit">Log in</button>
    </form>
  );
};
