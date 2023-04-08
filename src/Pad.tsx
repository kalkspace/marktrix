import React, { useCallback, useEffect, useState } from "react";
import Editor, { OnMount } from "@monaco-editor/react";
import { useParams } from "react-router-dom";
import { Doc as YDoc, Text as YText } from "yjs";
import { MonacoBinding } from "y-monaco";
import { useClientContext } from "./App";
import { MatrixProvider } from "./provider";

export const Pad: React.FC<{ roomId: string }> = ({ roomId }) => {
  const [yText, setYText] = useState<YText | null>(null);

  const client = useClientContext();
  // todo: does it race when `roomId` changes?
  useEffect(() => {
    const doc = new YDoc();
    const provider = new MatrixProvider(doc, client, roomId);

    setYText(doc.getText("monaco"));

    return () => {
      provider.destroy();
    };
  }, [client, roomId]);

  const mountHandler = useCallback<OnMount>(
    (editor) => {
      const editorModel = editor.getModel();
      if (!editorModel || !yText) {
        return;
      }
      const monacoBinding = new MonacoBinding(
        yText,
        editorModel,
        new Set([editor])
      );
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
