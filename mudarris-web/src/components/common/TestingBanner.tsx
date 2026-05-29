// Feature flag — set to false (or delete this file) to remove the banner
const SHOW_TESTING_BANNER = true;

function TestingBanner() {
  return (
    <div
      style={{
        width: "100%",
        backgroundColor: "#6B0F1A", // dark maroon
        color: "#FFFFFF",
        fontWeight: "bold",
        fontSize: "clamp(0.95rem, 2.5vw, 1.15rem)",
        textAlign: "center",
        padding: "12px 16px",
        direction: "rtl",
        letterSpacing: "0.02em",
        lineHeight: 1.5,
        boxSizing: "border-box",
      }}
      role="alert"
      aria-live="polite"
    >
      🚧 الموقع قيد التطوير والتجربة (TESTING) 🚧
    </div>
  );
}

export { SHOW_TESTING_BANNER, TestingBanner };
