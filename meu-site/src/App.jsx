import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import ComoFunciona from "./pages/ComoFunciona";
import Medicos from "./pages/Medicos";
import Utentes from "./pages/Utentes";
import Funcionalidades from "./pages/Funcionalidades";
import Precos from "./pages/Precos";
import FaqPage from "./pages/FaqPage";
import Contacto from "./pages/Contacto";
import Sobre from "./pages/Sobre";
import Legal from "./pages/Legal";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/como-funciona" element={<ComoFunciona />} />
        <Route path="/medicos" element={<Medicos />} />
        <Route path="/utentes" element={<Utentes />} />
        <Route path="/funcionalidades" element={<Funcionalidades />} />
        <Route path="/precos" element={<Precos />} />
        <Route path="/faq" element={<FaqPage />} />
        <Route path="/contacto" element={<Contacto />} />
        <Route path="/sobre" element={<Sobre />} />
        <Route path="/privacidade" element={<Legal kind="privacidade" />} />
        <Route path="/termos" element={<Legal kind="termos" />} />
        <Route path="*" element={<Home />} />
      </Route>
    </Routes>
  );
}
