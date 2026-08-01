interface Props {
  onClose: () => void;
}

export function PanelHeader({ onClose }: Props) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "8px 10px",
        borderBottom: "1px solid var(--gptree-border, #565869)",
        flexShrink: 0,
        minHeight: "36px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
        <svg
          width="16"
          height="16"
          viewBox="0 0 20 20"
          fill="var(--gptree-accent, #10A37F)"
        >
          <path d="M2 4h4v2H4v3H2V4zm14 0h-4v2h2v3h2V4zM2 13h2v3h2v2H2v-5zm14 3v-3h2v5h-4v-2h2z" />
          <path
            d="M6 7h8v2H6zm0 4h8v2H6z"
            fill="var(--gptree-accent, #10A37F)"
            opacity="0.5"
          />
        </svg>
        <span
          style={{
            fontWeight: 600,
            fontSize: "13px",
            color: "var(--gptree-text, #ECECF1)",
          }}
        >
          Conversation Tree
        </span>
      </div>

      <div style={{ display: "flex", gap: "2px" }}>
        {/* Close button */}
        <button
          onClick={onClose}
          title="Close panel"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "28px",
            height: "28px",
            border: "none",
            borderRadius: "4px",
            background: "transparent",
            color: "var(--gptree-muted, #8E8EA0)",
            cursor: "pointer",
          }}
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 14 14"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <path d="M1 1l12 12M13 1L1 13" />
          </svg>
        </button>
      </div>
    </div>
  );
}
