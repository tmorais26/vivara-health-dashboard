import appHome from "../assets/app/inicio.webp";

// Ecrã real da app do utente dentro de uma moldura de telemóvel.
export default function PhoneApp({ src = appHome }) {
  return (
    <div className="mx-auto w-[15.5rem] rounded-[2.6rem] border-[7px] border-brand-dark bg-brand-dark shadow-xl md:w-[17rem]">
      <div className="overflow-hidden rounded-[2.1rem]">
        <img src={src} alt="" loading="lazy" className="block w-full" />
      </div>
    </div>
  );
}
