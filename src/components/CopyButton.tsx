"use client";

export default function CopyButton({ text, className }: { text: string; className?: string }) {
  const copyToClipboard = () => {
    navigator.clipboard.writeText(text);
    alert("Copied to clipboard!");
  };

  return (
    <button onClick={copyToClipboard} className={className}>
      Copy Embed Snippet
    </button>
  );
}
