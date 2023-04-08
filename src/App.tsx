import { createContext, useContext, useState } from "react";
import { ICreateClientOpts } from "matrix-js-sdk";
import { Login } from "./Login";
import { RoomList } from "matrix-js-sdk/lib/crypto/RoomList";
import { RoomListing } from "./RoomListing";
import { createBrowserRouter, RouterProvider } from "react-router-dom";

import "./App.css";
import { PadRoute } from "./Pad";

const ClientOptsContext = createContext<ICreateClientOpts | null>(null);

export const useClientOpts = (): ICreateClientOpts => {
  const opts = useContext(ClientOptsContext);
  if (!opts) {
    throw new Error(
      "useClientOpts must be used within a ClientOptsContext.Provider"
    );
  }
  return opts;
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
  const [clientOpts, setClientOpts] = useState<ICreateClientOpts | null>(null);

  if (clientOpts == null) {
    return (
      <Login
        onLoginSuccess={async (opts) => {
          console.debug("login successful");
          setClientOpts(opts);
        }}
      />
    );
  }

  return (
    <ClientOptsContext.Provider value={clientOpts}>
      <div className="App">
        <RouterProvider router={router} />
      </div>
    </ClientOptsContext.Provider>
  );
}

export default App;
