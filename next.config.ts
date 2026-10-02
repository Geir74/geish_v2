import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // DEV-ONLY: tillat dev-ressurser (HMR + JS-chunks) naar serveren naas fra
  // LAN eller Tailscale i stedet for localhost. Uten dette blokkerer Next alt
  // under /_next/ fra fremmed origin, og siden hydreres aldri.
  allowedDevOrigins: ["192.168.50.77", "100.105.186.90"],
};

export default nextConfig;
