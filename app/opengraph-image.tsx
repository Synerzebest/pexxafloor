import { ImageResponse } from "next/og";
export const alt = "PexxaFloor — Chauffage au sol · Vloerverwarming · Underfloor heating";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export default function Image() {
  return new ImageResponse(
    <div style={{ width:"100%", height:"100%", display:"flex", flexDirection:"column", justifyContent:"center", padding:80, background:"#fff7ed", borderTop:"16px solid #ea580c", fontFamily:"sans-serif" }}>
      <div style={{ display:"flex", color:"#ea580c", fontSize:96, fontWeight:700 }}>PexxaFloor</div>
      <div style={{ display:"flex", marginTop:36, color:"#111827", fontSize:42 }}>Chauffage au sol · Vloerverwarming</div>
      <div style={{ display:"flex", marginTop:16, color:"#57534e", fontSize:32 }}>Underfloor heating</div>
      <div style={{ display:"flex", marginTop:48, color:"#9a3412", fontSize:26 }}>pexxafloor.be</div>
    </div>, size
  );
}
