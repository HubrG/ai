import React, { useState, useEffect } from "react";
import { EditorState, ContentState, convertToRaw } from "draft-js";
import { Editor } from "react-draft-wysiwyg";
import "react-draft-wysiwyg/dist/react-draft-wysiwyg.css";
import htmlToDraft from "html-to-draftjs";
import draftToHtml from "draftjs-to-html";

interface ReusableWysiwygProps {
  showToolbar?: boolean;
  defaultValue?: string;
  onContentChange?: (content: string) => void;
  planLevel?: string;
}

const ReusableWysiwyg = ({
  showToolbar = true,
  defaultValue = "",
  onContentChange
}: ReusableWysiwygProps) => {
  const [editorState, setEditorState] = useState(() =>
    EditorState.createEmpty()
  );
  const [timeoutId, setTimeoutId] = useState<any>(null); // Utiliser `any` ou `number` ici

  useEffect(() => {
    const blocksFromHtml = htmlToDraft(defaultValue);
    const contentState = ContentState.createFromBlockArray(
      blocksFromHtml.contentBlocks
    );
    const newEditorState = EditorState.createWithContent(contentState);

    setEditorState(newEditorState);
    //   handleEditorStateChange(newEditorState);
  }, [defaultValue, setEditorState]);

  const handleEditorStateChange = (editorState: any) => {
    setEditorState(editorState);
  
    // Annule le timeout précédent si existant
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  
    // Crée un nouveau timeout
    const newTimeoutId = setTimeout(() => {
      const raw = convertToRaw(editorState.getCurrentContent()); // Récupère les données brutes de l'état de l'éditeur
      const rawHTML = draftToHtml(raw); // HTML brut depuis l'état de l'éditeur
  
      if (onContentChange) {
        onContentChange(rawHTML);
      }
    }, 800); // 1 seconde d'attente
  
    // Stocke l'identifiant du nouveau timeout
    setTimeoutId(newTimeoutId);
  };

  return (
    <Editor
      editorState={editorState}
      onEditorStateChange={handleEditorStateChange}
      wrapperClassName="wrapper-class"
      editorClassName="editor-class"
      toolbarClassName="toolbar-class"
      toolbarHidden={!showToolbar}
    />
  );
};

export default ReusableWysiwyg;
