import olxLogo from "@/assets/olx-logo.png";

export function Logo({ size = 28 }: { size?: number }) {
  return (
    <span className="olx-logo inline-flex items-center" style={{ height: size }}>
      <img
        src={olxLogo}
        alt="OLX"
        style={{ height: size, width: "auto", objectFit: "contain" }}
      />
    </span>
  );
}
