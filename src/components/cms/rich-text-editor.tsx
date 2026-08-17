"use client";

import * as React from "react";
import Image from "@tiptap/extension-image";
import { EditorContent, useEditor, useEditorState } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  Bold,
  FileText,
  Heading2,
  ImageIcon,
  Italic,
  Link2,
  List,
  ListOrdered,
  Quote,
  Redo2,
  Strikethrough,
  Undo2,
  Unlink,
} from "lucide-react";

import { FilePicker, ImagePicker } from "@/components/cms/media-picker";
import type { MediaAsset } from "@/components/cms/media-types";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type RichTextEditorProps = {
  value: string;
  onChange: (value: string) => void;
  mediaItems: MediaAsset[];
  label: string;
};

export function RichTextEditor({
  value,
  onChange,
  mediaItems,
  label,
}: RichTextEditorProps) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        link: {
          openOnClick: false,
          defaultProtocol: "https",
          HTMLAttributes: {
            class: "text-primary underline underline-offset-4",
            rel: "noopener noreferrer",
          },
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: "my-4 max-h-[480px] max-w-full rounded-xl object-contain",
        },
      }),
    ],
    content: value,
    editorProps: {
      attributes: {
        class:
          "min-h-[45vh] px-4 py-3 text-sm leading-7 outline-none [&_a]:text-primary [&_a]:underline [&_blockquote]:border-l-2 [&_blockquote]:pl-4 [&_blockquote]:text-muted-foreground [&_h2]:mb-2 [&_h2]:mt-5 [&_h2]:text-2xl [&_h2]:font-semibold [&_img]:my-4 [&_img]:max-h-[480px] [&_img]:max-w-full [&_img]:rounded-xl [&_li]:ml-5 [&_ol]:list-decimal [&_p]:my-2 [&_ul]:list-disc",
        "aria-label": `${label}正文富文本编辑器`,
      },
    },
    onUpdate: ({ editor: currentEditor }) => onChange(currentEditor.getHTML()),
  });

  React.useEffect(() => {
    if (editor && editor.getHTML() !== value) {
      editor.commands.setContent(value, { emitUpdate: false });
    }
  }, [editor, value]);

  const state = useEditorState({
    editor,
    selector: ({ editor: currentEditor }) => ({
      bold: currentEditor?.isActive("bold") ?? false,
      italic: currentEditor?.isActive("italic") ?? false,
      strike: currentEditor?.isActive("strike") ?? false,
      heading: currentEditor?.isActive("heading", { level: 2 }) ?? false,
      bulletList: currentEditor?.isActive("bulletList") ?? false,
      orderedList: currentEditor?.isActive("orderedList") ?? false,
      blockquote: currentEditor?.isActive("blockquote") ?? false,
      link: currentEditor?.isActive("link") ?? false,
      canUndo: currentEditor?.can().undo() ?? false,
      canRedo: currentEditor?.can().redo() ?? false,
    }),
  });

  const setLink = () => {
    if (!editor) return;
    const previous = editor.getAttributes("link").href as string | undefined;
    const href = window.prompt("请输入链接地址", previous ?? "https://");
    if (href === null) return;
    if (!href.trim()) {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor
      .chain()
      .focus()
      .extendMarkRange("link")
      .setLink({ href: href.trim(), target: "_blank" })
      .run();
  };

  const insertFile = (asset: MediaAsset) => {
    editor
      ?.chain()
      .focus()
      .insertContent({
        type: "paragraph",
        content: [
          {
            type: "text",
            text: asset.originalName,
            marks: [
              {
                type: "link",
                attrs: {
                  href: asset.url,
                  target: "_blank",
                  rel: "noopener noreferrer",
                },
              },
            ],
          },
        ],
      })
      .run();
  };

  if (!editor) {
    return (
      <div className="grid min-h-72 place-items-center rounded-xl border text-sm text-muted-foreground">
        正在加载编辑器…
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border bg-background focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/20">
      <div
        role="toolbar"
        aria-label={`${label}正文格式工具栏`}
        className="flex flex-wrap items-center gap-1 border-b bg-muted/30 p-2"
      >
        <ToolbarButton
          label="粗体"
          active={state?.bold}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <Bold />
        </ToolbarButton>
        <ToolbarButton
          label="斜体"
          active={state?.italic}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <Italic />
        </ToolbarButton>
        <ToolbarButton
          label="删除线"
          active={state?.strike}
          onClick={() => editor.chain().focus().toggleStrike().run()}
        >
          <Strikethrough />
        </ToolbarButton>
        <ToolbarButton
          label="二级标题"
          active={state?.heading}
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 2 }).run()
          }
        >
          <Heading2 />
        </ToolbarButton>
        <ToolbarButton
          label="无序列表"
          active={state?.bulletList}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <List />
        </ToolbarButton>
        <ToolbarButton
          label="有序列表"
          active={state?.orderedList}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered />
        </ToolbarButton>
        <ToolbarButton
          label="引用"
          active={state?.blockquote}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
        >
          <Quote />
        </ToolbarButton>
        <ToolbarButton label="设置链接" active={state?.link} onClick={setLink}>
          <Link2 />
        </ToolbarButton>
        <ToolbarButton
          label="移除链接"
          disabled={!state?.link}
          onClick={() => editor.chain().focus().unsetLink().run()}
        >
          <Unlink />
        </ToolbarButton>
        <span className="mx-1 h-5 w-px bg-border" aria-hidden="true" />
        <ImagePicker
          items={mediaItems}
          onSelect={(asset) => {
            editor
              .chain()
              .focus()
              .setImage({
                src: asset.url,
                alt: asset.altText || asset.originalName,
                title: asset.originalName,
              })
              .run();
          }}
          triggerLabel="插入图片"
          trigger={
            <Button type="button" size="sm" variant="outline">
              <ImageIcon />
              图片
            </Button>
          }
        />
        <FilePicker
          items={mediaItems}
          onSelect={insertFile}
          triggerLabel="插入文件"
          trigger={
            <Button type="button" size="sm" variant="outline">
              <FileText />
              文件
            </Button>
          }
        />
        <span className="mx-1 h-5 w-px bg-border" aria-hidden="true" />
        <ToolbarButton
          label="撤销"
          disabled={!state?.canUndo}
          onClick={() => editor.chain().focus().undo().run()}
        >
          <Undo2 />
        </ToolbarButton>
        <ToolbarButton
          label="重做"
          disabled={!state?.canRedo}
          onClick={() => editor.chain().focus().redo().run()}
        >
          <Redo2 />
        </ToolbarButton>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}

function ToolbarButton({
  label,
  active,
  className,
  ...props
}: React.ComponentProps<typeof Button> & {
  label: string;
  active?: boolean;
}) {
  return (
    <Button
      type="button"
      size="icon-sm"
      variant={active ? "secondary" : "ghost"}
      aria-label={label}
      aria-pressed={active}
      title={label}
      className={cn(className)}
      {...props}
    />
  );
}
