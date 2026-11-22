import appHome from "../assets/app/inicio.webp";

// Ecrã real da app do paciente dentro de um iPhone (ecrã 860×1864, proporção real).
export default function PhoneApp({ src = appHome }) {
  return (
    <div className="relative mx-auto w-[15rem] md:w-[17rem]">
      {/* botões laterais */}
      <span className="absolute -left-[3px] top-[15%] h-[3.5%] w-[3px] rounded-l bg-[#2b2b2e]" />
      <span className="absolute -left-[3px] top-[22%] h-[6.5%] w-[3px] rounded-l bg-[#2b2b2e]" />
      <span className="absolute -left-[3px] top-[30.5%] h-[6.5%] w-[3px] rounded-l bg-[#2b2b2e]" />
      <span className="absolute -right-[3px] top-[26%] h-[10%] w-[3px] rounded-r bg-[#2b2b2e]" />

      {/* chassis */}
      <div className="rounded-[3rem] bg-[#2b2b2e] p-[2px] shadow-2xl shadow-black/30 md:rounded-[3.3rem]">
        <div className="rounded-[2.9rem] bg-black p-[9px] md:rounded-[3.2rem] md:p-[10px]">
          <div className="relative overflow-hidden rounded-[2.3rem] bg-[#0b0d0f] md:rounded-[2.5rem]" style={{ aspectRatio: "860 / 1864" }}>
            <img src={src} alt="" loading="lazy" className="block h-full w-full object-cover" />
            {/* Dynamic Island */}
            <span className="absolute left-1/2 top-[1.3%] h-[2.9%] w-[27%] -translate-x-1/2 rounded-full bg-black" />
            {/* indicador de início */}
            <span className="absolute bottom-[0.9%] left-1/2 h-[0.45%] w-[34%] -translate-x-1/2 rounded-full bg-white/80" />
          </div>
        </div>
      </div>
    </div>
  );
}
