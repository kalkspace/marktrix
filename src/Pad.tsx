import React, { useCallback, useEffect, useState } from "react";
import Editor, { OnMount } from "@monaco-editor/react";
import { useParams } from "react-router-dom";
import { Doc as YDoc, Text as YText } from "yjs";
import { MonacoBinding } from "y-monaco";
import { useClientOpts } from "./App";
import { MatrixProvider } from "./provider";
import { createClient } from "matrix-js-sdk";

export const Pad: React.FC<{ roomId: string }> = ({ roomId }) => {
  const [yText, setYText] = useState<YText | null>(null);

  const clientOpts = useClientOpts();
  // todo: does it race when `roomId` changes?
  useEffect(() => {
    const doc = new YDoc();
    const client = createClient(clientOpts);
    const provider = new MatrixProvider(doc, client, roomId);

    provider.initialize().then(() => {
      setYText(doc.getText("monaco"));
    });

    return () => {
      provider.destroy();
    };
  }, [clientOpts, roomId]);

  const mountHandler = useCallback<OnMount>(
    (editor) => {
      const editorModel = editor.getModel();
      if (!editorModel || !yText) {
        return;
      }
      new MonacoBinding(yText, editorModel, new Set([editor]));
    },
    [yText]
  );

  if (!yText) {
    return <p>Loading...</p>;
  }

  return (
    <div
      style={{
        height: "100vh",
        width: "100vw",
        padding: "1rem",
        boxSizing: "border-box",
      }}
    >
      <Editor
        defaultLanguage="markdown"
        onMount={mountHandler}
        options={{
          minimap: {
            enabled: false,
          },
          wordWrap: "on",
        }}
      />
    </div>
  );
};

export const PadRoute: React.FC<{}> = () => {
  const { roomId } = useParams();

  if (!roomId) {
    return <p>Missing room ID</p>;
  }

  return <Pad roomId={roomId} />;
};
