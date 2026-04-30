export default function SectionBreak() {
  return (
    <div className="flex items-center justify-center py-2">
      <div
        style={{
          width: "100%",
          maxWidth: "480px",
          height: "1px",
          background: "linear-gradient(to right, transparent 0%, rgba(154,92,46,0.35) 30%, rgba(200,150,92,0.55) 50%, rgba(154,92,46,0.35) 70%, transparent 100%)",
        }}
      />
    </div>
  );
}