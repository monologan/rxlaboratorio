"use client";
import React, { useState, useEffect } from "react";
import axios from "axios";
import { saveAs } from "file-saver";
import Image from "next/image";
import es from "./es.json"; // Importa el archivo de traducción
import {
  BeakerIcon,
  DocumentArrowDownIcon,
  BoltIcon,
  CircleStackIcon,
  SignalIcon
} from "@heroicons/react/24/solid";

const API_URL = "http://192.168.42.247:8000";
const App = () => {
  const [cedula, setCedula] = useState("");
  const [fechanacimiento, setfechanacimiento] = useState("");
  const [tipocodigo, setTipocodigo] = useState("");
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("laboratorios");
  const [translations, setTranslations] = useState(es);
  // Carga el archivo de traducción
  // Add state to track grouped exams
  const [groupedExams, setGroupedExams] = useState({});

  useEffect(() => {
    if (error) {
      console.log("El estado error se ha actualizado:", error);
    }
  }, [error]);

  // Add effect to group records by exam name when records change
  useEffect(() => {
    if (records.length > 0) {
      const grouped = records.reduce((acc, record, index) => {
        const examName = record.NombreExamen;
        if (!acc[examName]) {
          acc[examName] = [];
        }
        acc[examName].push({
          ...record,
          index
        });
        return acc;
      }, {});
      setGroupedExams(grouped);
    }
  }, [records]);

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

  const handleSearch = async (e) => {
    e.preventDefault();

    if (!tipocodigo || !cedula || !fechanacimiento) {
      setError("Por favor, complete todos los campos.");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const labResponse = await axios.get(`${API_URL}/api/records`, {
        params: {
          cedula: cedula || undefined,
          fechanacimiento: fechanacimiento || undefined,
          tipocodigo: tipocodigo || undefined
        }
      });

      if (labResponse.data.data.length === 0) {
        setError("No se encontraron registros para este número de documento");
        setRecords([]);
      } else {
        setRecords(labResponse.data.data);
        setError(null);
      }
    } catch (err) {
      setError("Error al buscar los registros");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  // Modified to handle both exam name and date
  const handleGeneratePDF = async (examName, date = null) => {
    try {
      if (!groupedExams[examName] || groupedExams[examName].length === 0) {
        console.error("No hay registros para este examen");
        return;
      }

      const params = new URLSearchParams({
        fechanacimiento,
        tipocodigo
      }).toString();

      // Get indices for this exam name, optionally filtered by date
      const indices = groupedExams[examName]
        .filter((record) => !date || record.Fecha === date)
        .map((record) => record.index);

      if (indices.length === 0) {
        console.error("No hay registros para esta fecha");
        return;
      }

      const response = await axios({
        method: "post",
        url: `${API_URL}/api/pdf/${cedula}?${params}`,
        data: {
          selectedIndices: indices
        },
        responseType: "blob",
        headers: {
          "Content-Type": "application/json"
        }
      });

      const blob = new Blob([response.data], { type: "application/pdf" });
      const filename = date
        ? `reporte_laboratorio_${cedula}_${examName}_${date.replace(
            /\//g,
            "-"
          )}.pdf`
        : `reporte_laboratorio_${cedula}_${examName}.pdf`;

      saveAs(blob, filename);
      console.log("PDF descargado exitosamente");
    } catch (err) {
      console.error("Error en la descarga:", err);
    }
  };
  return (
    <div className="flex flex-col min-h-screen">
      <div className="container mx-auto p-1 bg-fondo-blue grid grid-cols-1 md:grid-cols-2 gap-5 flex-grow">
        {/* Left column with logos */}
        <div className="p-4 md:p-10 mx-0">
          <Image
            src="/loguito2.svg"
            alt="Logo"
            width={150}
            height={87}
            className="object-contain mx-auto md:mx-8"
            priority
          />
          <Image
            src="/black-girl.png"
            alt="Logo"
            width={500}
            height={700}
            className="hidden md:block object-contain mx-auto md:mx-[9rem] my-[2rem] max-w-full h-auto"
            priority
          />
        </div>

        {/* Right column with form and results */}
        <div className="flex flex-col items-center md:items-start gap-5 mt-6 px-4 md:px-0">
          <div>
            <h1 className="text-3xl md:text-5xl font-bold texto-blue text-center md:text-left">
              Portal de Resultados
            </h1>
          </div>
          {/* Form section */}
          <div className="flex flex-wrap gap-2 w-full md:w-[670px]">
            <form
              
              className="flex flex-col md:flex-row gap-2 w-full"
            > 
              <select
                required
                value={tipocodigo}
                onChange={(e) => setTipocodigo(e.target.value)}
                className="p-2 border rounded w-full md:w-15 bg-white"
                title="Por favor seleccione un tipo de documento"
              >
                <option value="">Tipo</option>
                <option value="CC">CC</option>
                <option value="TI">TI</option>
                <option value="PA">PA</option>
              </select>
              <input
                required
                type="text"
                value={cedula}
                onChange={(e) => {
                  const re = /^[0-9\b]+$/;
                  if (e.target.value === "" || re.test(e.target.value)) {
                    setCedula(e.target.value);
                  }
                }}
                pattern="[0-9]*"
                placeholder="ingrese su cedula"
                className="p-2 border rounded w-full md:w-64"
                title="Por favor ingrese solo números"
              />
              <input
                type="text"
                value={fechanacimiento}
                onChange={handleDateChange}
                placeholder="AAAA"
                maxLength="4"
                className="p-2 border rounded w-full md:w-32"
                required
                title="Por favor ingrese el año de nacimiento"
              />
              <button
                type="button"
                disabled={loading}
                className="w-full md:w-auto ml-0 md:ml-2 bg-blue-500 text-white px-4 py-2 rounded touch-manipulation min-h-[44px] active:bg-blue-600 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                onClick={(e) => {
                  // Prevent default behavior
                  e.preventDefault();
                  // Stop event propagation
                  e.stopPropagation();
                  // Add a small delay to ensure the event is fully processed
                  setTimeout(() => {
                    handleSearch(e);
                  }, 10);
                }}
                onTouchStart={(e) => {
                  // Prevent default touch behavior
                  e.preventDefault();
                }}
              >
                {loading ? "Buscando..." : "Buscar"}
              </button>
            </form>
          </div>
          <div>
            <figure>
              <Image
                src="/logofinal.png"
                alt="Logo"
                width={500}
                height={700}
                className="object-contain max-w-full h-auto"
                priority
              />
            </figure>
          </div>
          {error && <div className="text-red-500 mb-4 text-center md:text-left">{error}</div>}
          {records.length > 0 && (
            <>
              <div className="w-full md:w-[670px] border border-red-200 rounded-lg overflow-x-auto">
                <div className="border-b border-gray-200">
                  <nav className="flex flex-wrap md:flex-nowrap justify-between" aria-label="Tabs">
                    <button
                      className={`px-2 md:px-4 py-2 text-sm font-medium flex flex-row items-center gap-2 ${
                        activeTab === "laboratorios"
                          ? " border-[#f9dbbd] font-extrabold text-2xl md:text-4xl text-[#b0c4b1] bg-[#4a5759]/70 rounded-lg"
                          : "text-gray-500 hover:text-gray-700"
                      }`}
                      onClick={() => setActiveTab("laboratorios")}
                    >
                      <BeakerIcon className="size-4 md:size-6" />
                      <span>Laboratorios</span>
                    </button>

                    <button
                      className={`px-2 md:px-4 py-2 text-sm font-medium flex flex-row items-center gap-2 ${
                        activeTab === "rx"
                          ? " border-[#f9dbbd] font-extrabold text-2xl md:text-4xl text-[#b0c4b1] bg-[#4a5759]/70 rounded-lg"
                          : "text-gray-500 hover:text-gray-700"
                      }`}
                      onClick={() => setActiveTab("rx")}
                    >
                      <BoltIcon className="size-4 md:size-6" />
                      <span>RX</span>
                    </button>

                    <button
                      className={`px-2 md:px-4 py-2 text-sm font-medium flex flex-row items-center gap-2 ${
                        activeTab === "mamografias"
                          ? " border-[#f9dbbd] font-extrabold text-2xl md:text-4xl text-[#b0c4b1] bg-[#4a5759]/70 rounded-lg"
                          : "text-gray-500 hover:text-gray-700"
                      }`}
                      onClick={() => setActiveTab("mamografias")}
                    >
                      <CircleStackIcon className="size-4 md:size-6" />
                      <span>Mamografías</span>
                    </button>

                    <button
                      className={`px-2 md:px-4 py-2 text-sm font-medium flex flex-row items-center gap-2 ${
                        activeTab === "ecografias"
                          ? " border-[#f9dbbd] font-extrabold text-2xl md:text-4xl text-[#b0c4b1] bg-[#4a5759]/70 rounded-lg"
                          : "text-gray-500 hover:text-gray-700"
                      }`}
                      onClick={() => setActiveTab("ecografias")}
                    >
                      <SignalIcon className="size-6 md:size-8" />
                      Ecografías
                    </button>
                  </nav>
                </div>
                <div className="p-4">
                  {activeTab === "laboratorios" && (
                    <div className="overflow-x-auto w-full">
                      <table className="min-w-full divide-y divide-gray-200 table-auto">
                        <thead className="bg-gray-50">
                          <tr>
                            <th scope="col" className="px-2 md:px-6 py-2 md:py-3 text-left text-xs md:text-base font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                              Fecha
                            </th>
                            <th scope="col" className="px-2 md:px-6 py-2 md:py-3 text-left text-xs md:text-base font-medium text-gray-500 uppercase tracking-wider">
                              Examen
                            </th>
                            <th scope="col" className="px-2 md:px-6 py-2 md:py-3 text-left text-xs md:text-base font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                              Acciones
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-cyan-100 divide-y divide-gray-200">
                          {Object.keys(groupedExams).flatMap((examName) =>
                            Object.entries(
                              groupedExams[examName].reduce(
                                (dateGroups, record) => {
                                  const date = record.Fecha;
                                  if (!dateGroups[date]) {
                                    dateGroups[date] = [];
                                  }
                                  dateGroups[date].push(record);
                                  return dateGroups;
                                },
                                {}
                              )
                            ).map(([date, dateRecords]) => (
                              <tr key={`${examName}-${date}`} className="hover:bg-gray-50">
                                <td className="px-2 md:px-6 py-2 md:py-4 text-xs md:text-sm text-gray-500 whitespace-nowrap">
                                  {date}
                                </td>
                                <td className="px-2 md:px-6 py-2 md:py-4 text-xs md:text-sm text-gray-900 break-words max-w-[150px] md:max-w-none">
                                  {examName}
                                </td>
                                <td className="px-2 md:px-6 py-2 md:py-4 text-xs md:text-sm font-medium whitespace-nowrap">
                                  <button
                                    onClick={() => handleGeneratePDF(examName, date)}
                                    className="text-red-800 hover:text-blue-700 flex items-center gap-1 text-xs md:text-sm"
                                  >
                                    <DocumentArrowDownIcon className="size-4 md:size-5" />
                                    <span className="hidden md:inline">Descargar PDF</span>
                                    <span className="md:hidden">PDF</span>
                                  </button>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {activeTab === "rx" && <div>Estamos en construccion 👷🚧</div>}
                  {activeTab === "mamografias" && <div>Estamos en construccion 👷🚧</div>}
                  {activeTab === "ecografias" && <div>Estamos en construccion 👷🚧</div>}
                </div>
              </div>
            </>
          )}
        </div>
        
        <footer className="col-span-1 md:col-span-2 w-full relative">
          <Image
            src="/black-girl.png"
            alt="Logo"
            width={500}
            height={700}
            className="md:hidden object-contain mx-auto max-w-full h-auto mb-4"
            priority
          />
          <div className="flex flex-col md:flex-row items-center justify-evenly gap-4 md:gap-2 mb-2 p-4">
            <Image
              src="/loguito2.svg"
              alt="Logo Footer"
              width={100}
              height={58}
              className="object-contain"
              priority
            />
            <div className="text-center md:text-left">
              <p className="text-gray-500 text-sm">
                © {new Date().getFullYear()}
                Hospital Ruben Cruz Velez. Todos los derechos reservados.
              </p>
              <p className="text-gray-400 text-xs mt-1">
                Dirección: Calle 20 # 14 - 45, Tuluá - Valle del Cauca - Colombia
                | Tel: +57(602) 231 7323
              </p>
            </div>
            <span className="text-gray-400/60 text-xs mt-1">made with 💖 by Gerardo Valdes - Warcom S.A.</span>
          </div>
        </footer>
      </div>
    </div>
  );
};
export default App;
