"use client";
import React, { useState } from "react";
import axios from "axios";
import { saveAs } from "file-saver";
import Image from "next/image";
import {
  BeakerIcon,
  DocumentArrowDownIcon,
  BoltIcon,
  CircleStackIcon,
  SignalIcon
} from "@heroicons/react/24/solid";

const App = () => {
  const [cedula, setCedula] = useState("");
  const [fechanacimiento, setfechanacimiento] = useState("");
  const [tipocodigo, setTipocodigo] = useState("");
  const [records, setRecords] = useState([]);  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);  
  const [activeTab, setActiveTab] = useState("laboratorios");

  const formatYear = (input) => {
    // Remove any non-digit characters
    const cleaned = input.replace(/\D/g, "");
    // Only keep up to 4 digits
    return cleaned.slice(0, 4);
  };
  const handleDateChange = (e) => {
    const formatted = formatYear(e.target.value);
    setfechanacimiento(formatted);
  };
  const handleSearch = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch lab records
      const labResponse = await axios.get(`http://localhost:8000/api/records`, {
        params: {
          cedula: cedula || undefined,
          fechanacimiento: fechanacimiento || undefined,
          tipocodigo: tipocodigo || undefined
        }
      });
      setRecords(labResponse.data.data);
      
    } catch (err) {
      setError("Error al buscar los registros");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  const handleGeneratePDF = async (index) => {
    try {
      setLoading(true);

      // Use different endpoint based on active tab
      const endpoint =
        activeTab === "laboratorios"
          ? `http://localhost:8000/api/pdf/${cedula}`
          : `http://localhost:8000/api/RX-pdf/${cedula}`;

      const response = await axios({
        method: "post",
        url: endpoint,
        data: { selectedIndices: [index] }, // Send only the selected index
        responseType: "blob",
        headers: {
          "Content-Type": "application/json"
        }
      });

      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `reporte_${activeTab}_${cedula}_${index}.pdf`
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError("Error al generar el PDF");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  

  return (
    <div className="container h-full mx-auto p-5  bg-fondo-blue grid grid-cols-2 gap-5 ">
      <div className="p-10 mx-0">
        <Image
          src="/loguito2.svg"
          alt="Logo"
          width={150}
          height={87}
          className="object-contain mx-8"
          priority
        />
        <Image
          src="/black-girl.png"
          alt="Logo"
          width={500}
          height={700}
          className="object-contain mx-[9rem] my-[2rem]"
          priority
        />
      </div>

      {/* div de 4 elementos titulo-inputs-logo hospital */}
      <div className="flex flex-col  items-start gap-5 mt-6">
        <div>
          <h1 className="text-5xl font-bold texto-blue">
            Portal de Resultados
          </h1>
        </div>
        <div className="flex flex-wrap gap-2 w-[670px]">
          <select
            value={tipocodigo}
            onChange={(e) => setTipocodigo(e.target.value)}
            className="p-2 border rounded w-15 bg-white"
          >
            <option value="">Tipo</option>
            <option value="CC">CC</option>
            <option value="TI">TI</option>
            <option value="PA">PA</option>
          </select>
          <input
            type="text"
            value={cedula}
            onChange={(e) => setCedula(e.target.value)}
            placeholder="ingrese su cedula"
            className="p-2 border rounded w-64"
          />
          <input
            type="text"
            value={fechanacimiento}
            onChange={handleDateChange}
            placeholder="AAAA"
            maxLength="4"
            className="p-2 border rounded w-32 "
          />

          <button
            onClick={handleSearch}
            disabled={loading}
            className="ml-2 bg-blue-500 text-white px-4 py-2 rounded grow"
          >
            Buscar
          </button>
        </div>
        <div>
          <figure>
            <Image
              src="/logofinal.png"
              alt="Logo"
              width={500}
              height={700}
              className="object-contain"
              priority
            />
          </figure>
        </div>

        {error && <div className="text-red-500 mb-4">{error}</div>}

        {records.length > 0 && (
          <>
            <div
              className="w-[670px] border border-red-200 rounded-lg
              
            "
            >
              <div className="border-b border-gray-200 ">
                <nav className="flex justify-between" aria-label="Tabs">
                  <button
                    className={`px-4 py-2 text-sm font-medium flex flex-row items-center gap-2 ${activeTab === "laboratorios"
                        ? " border-[#f9dbbd] font-extrabold text-3xl text-[#b0c4b1] bg-[#4a5759]/70 rounded-lg"
                        : "text-gray-500 hover:text-gray-700"
                      }`}
                    onClick={() => setActiveTab("laboratorios")}
                  >
                    <BeakerIcon className="size-6" />
                    <span>Laboratorios</span>
                  </button>


                  <button
                    className={`px-4 py-2 text-sm font-medium flex flex-row items-center gap-2 ${activeTab === "rx"
                        ? " border-[#f9dbbd] font-extrabold text-3xl text-[#b0c4b1] bg-[#4a5759]/70 rounded-lg"
                        : "text-gray-500 hover:text-gray-700"
                      }`}
                    onClick={() => setActiveTab("rx")}
                  >
                    <BoltIcon className="size-6" />
                    <span>RX</span>
                  </button>


                  <button
                    className={`px-4 py-2 text-sm font-medium flex flex-row items-center gap-2 ${activeTab === "mamografias"
                        ? " border-[#f9dbbd] font-extrabold text-3xl text-[#b0c4b1] bg-[#4a5759]/70 rounded-lg"
                        : "text-gray-500 hover:text-gray-700"
                      }`}
                    onClick={() => setActiveTab("mamografias")}
                  >
                    <CircleStackIcon className="size-6" />
                    <span>Mamografías</span>
                  </button>


                  <button
                    className={`px-4 py-2 text-sm font-medium flex flex-row items-center gap-2 ${activeTab === "ecografias"
                        ? " border-[#f9dbbd] font-extrabold text-3xl text-[#b0c4b1] bg-[#4a5759]/70 rounded-lg"
                        : "text-gray-500 hover:text-gray-700"
                      }`}
                    onClick={() => setActiveTab("ecografias")}
                  >
                    <SignalIcon className="size-8" />
                    Ecografías
                  </button>


                </nav>
              </div>

              <div className="p-4">
                {activeTab === "laboratorios" && (
                  <div className="overflow-x-auto">
                    <table className="w-full table-auto">
                      <thead className="bg-gray-50 text-md font-semibold uppercase text-gray-400">
                        <tr className="text-cyan-500 ">
                          <th className="p-2 text-left">Fecha Examen</th>
                          <th className="p-2 text-left">Nombre Examen</th>
                          <th className="p-2 text-left">PDF</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 text-sm">
                        {records.map((record, index) => (
                          <tr key={index}>
                            <td className="p-2">{record.Fecha}</td>
                            <td className="p-2">{record.NombreExamen}</td>
                            <td className="p-2">
                              <button
                                onClick={() => handleGeneratePDF(index)}
                                disabled={loading}
                                className="text-red-500 hover:text-blue-700"
                                title="Descargar PDF"
                              >
                                <DocumentArrowDownIcon className="size-7" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                {activeTab === "rx" && <div>este es rx</div>}
                {activeTab === "mamografias" && <div>este es mamografias</div>}
                {activeTab === "ecografias" && <div>este es ecografias</div>}
              </div>
            </div>
            
          </>
        )}
      </div>
    </div>
  );
};
export default App;
