import { createContext, useContext, useEffect, useState } from "react";
import { ClientEvent, MatrixClient } from "matrix-js-sdk";
import { Login } from "./Login";
import { RoomList } from "matrix-js-sdk/lib/crypto/RoomList";
import { RoomListing } from "./RoomListing";
import { createBrowserRouter, RouterProvider } from "react-router-dom";

import "./App.css";
import { PadRoute } from "./Pad";

// init matrix client
export const ClientContext = createContext<MatrixClient | null>(null);

export const useClientContext = () => {
  const client = useContext(ClientContext);
  if (!client) {
    throw new Error(
      "useClientContext must be used within a ClientContext.Provider"
    );
  }
  return client;
};

const router = createBrowserRouter([
  {
    path: "/",
    element: <RoomListing />,
  },
  {
    path: "/:roomId",
    element: <PadRoute />,
  },
]);

function App() {
  const [clientStatus, setClientStatus] = useState<
    "logged-out" | "syncing" | "ready"
  >("logged-out");
  const [client, setClient] = useState<MatrixClient | null>(null);

  if (client == null) {
    return (
      <Login
        onLoginSuccess={async (client) => {
          console.debug("login successful");
          client.once(ClientEvent.Sync, function (state, prevState, res) {
            console.log("Matrix client state changed:", state);
            if (state === "PREPARED") {
              setClientStatus("ready");
            }
          });
          setClient((prev) => {
            if (prev) {
              client.stopClient();
              return prev;
            }
            return client;
          });
          setClientStatus("syncing");
        }}
      />
    );
  }

  if (clientStatus !== "ready") {
    return <p>Loading...</p>;
  }

  return (
    <ClientContext.Provider value={client}>
      <div className="App">
        <RouterProvider router={router} />
      </div>
    </ClientContext.Provider>
  );
}

export default App;
