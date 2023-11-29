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
  onContentChange,
  planLevel,
}: ReusableWysiwygProps) => {
  const [editorState, setEditorState] = useState(() =>
    EditorState.createEmpty()
  );

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
    const raw = convertToRaw(editorState.getCurrentContent()); // get raw data from editor state
    const rawHTML = draftToHtml(raw); // plain html from editor state
    if (onContentChange) {
      onContentChange(rawHTML);
    }
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
