interface Props {
  isOpen: boolean;
  onClick: () => void;
}

export function ToggleButton({ isOpen, onClick }: Props) {
  if (isOpen) return null;

  return (
    <button
      onClick={onClick}
      title="Show conversation tree (Ctrl+Shift+T)"
      style={{
        position: "fixed",
        right: "0",
        top: "50%",
        transform: "translateY(-50%)",
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "2px",
        padding: "8px 4px",
        border: "1px solid var(--gptree-border, #565869)",
        borderRight: "none",
        borderRadius: "6px 0 0 6px",
        background: "var(--gptree-bg, #212121)",
        color: "var(--gptree-text, #ECECF1)",
        cursor: "pointer",
        fontSize: "10px",
        fontFamily: "system-ui, sans-serif",
        opacity: 0.6,
        transition: "opacity 0.15s",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
      onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.6")}
    >
      <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor">
        <path d="M2 4h4v2H4v3H2V4zm14 0h-4v2h2v3h2V4zM2 13h2v3h2v2H2v-5zm14 3v-3h2v5h-4v-2h2z" />
        <path d="M6 7h8v2H6zm0 4h8v2H6z" fill="currentColor" opacity="0.5" />
      </svg>
      <span>Tree</span>
    </button>
  );
}
