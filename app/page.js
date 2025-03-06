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
const API_URL = "http://localhost:8000";
const App = () => {
  const [cedula, setCedula] = useState("");
  const [fechanacimiento, setfechanacimiento] = useState("");
  const [tipocodigo, setTipocodigo] = useState("");
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("laboratorios");
  const [translations, setTranslations] = useState(es); // Carga el archivo de traducción
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
        acc[examName].push({ ...record, index });
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
        console.error('No hay registros para este examen');
        return;
      }
      
      const params = new URLSearchParams({
        fechanacimiento,
        tipocodigo
      }).toString();
  
      // Get indices for this exam name, optionally filtered by date
      const indices = groupedExams[examName]
        .filter(record => !date || record.Fecha === date)
        .map(record => record.index);
  
      if (indices.length === 0) {
        console.error('No hay registros para esta fecha');
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
        ? `reporte_laboratorio_${cedula}_${examName}_${date.replace(/\//g, '-')}.pdf`
        : `reporte_laboratorio_${cedula}_${examName}.pdf`;
      
      saveAs(blob, filename);
      console.log('PDF descargado exitosamente');
      
    } catch (err) {
      console.error('Error en la descarga:', err);
    }
  };
  return (
    <div className="container h-full mx-auto p-5  bg-fondo-blue grid grid-cols-2 gap-5 ">
      {/* Left column with logos */}
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

      {/* Right column with form and results */}
      <div className="flex flex-col items-start gap-5 mt-6">
        <div>
          <h1 className="text-5xl font-bold texto-blue">
            Portal de Resultados
          </h1>
        </div>

        {/* Form section */}
        <div className="flex flex-wrap gap-2 w-[670px]">
          <form onSubmit={handleSearch} className="flex flex-row gap-2">
            {/* Form inputs remain unchanged */}
            <select
              required
              value={tipocodigo}
              onChange={(e) => setTipocodigo(e.target.value)}
              className="p-2 border rounded w-15 bg-white"
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
              className="p-2 border rounded w-64"
              title="Por favor ingrese solo números"
            />
            <input
              type="text"
              value={fechanacimiento}
              onChange={handleDateChange}
              placeholder="AAAA"
              maxLength="4"
              className="p-2 border rounded w-32"
              required
              title="Por favor ingrese el año de nacimiento"
            />
            <button
              type="submit"
              disabled={loading}
              className="ml-2 bg-blue-500 text-white px-4 py-2 rounded grow"
            >
              Buscar
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
              className="object-contain"
              priority
            />
          </figure>
        </div>

        {error && <div className="text-red-500 mb-4">{error}</div>}

        {records.length > 0 && (
          <>
            <div className="w-[670px] border border-red-200 rounded-lg">
              <div className="border-b border-gray-200 ">
                <nav className="flex justify-between" aria-label="Tabs">
                  {/* Tabs remain unchanged */}
                  <button
                    className={`px-4 py-2 text-sm font-medium flex flex-row items-center gap-2 ${activeTab === "laboratorios"
                        ? " border-[#f9dbbd] font-extrabold text-4xl text-[#b0c4b1] bg-[#4a5759]/70 rounded-lg"
                        : "text-gray-500 hover:text-gray-700"
                      }`}
                    onClick={() => setActiveTab("laboratorios")}
                  >
                    <BeakerIcon className="size-6" />
                    <span>Laboratorios</span>
                  </button>

                  <button
                    className={`px-4 py-2 text-sm font-medium flex flex-row items-center gap-2 ${activeTab === "rx"
                        ? " border-[#f9dbbd] font-extrabold text-4xl text-[#b0c4b1] bg-[#4a5759]/70 rounded-lg"
                        : "text-gray-500 hover:text-gray-700"
                      }`}
                    onClick={() => setActiveTab("rx")}
                  >
                    <BoltIcon className="size-6" />
                    <span>RX</span>
                  </button>

                  <button
                    className={`px-4 py-2 text-sm font-medium flex flex-row items-center gap-2 ${activeTab === "mamografias"
                        ? " border-[#f9dbbd] font-extrabold text-4xl text-[#b0c4b1] bg-[#4a5759]/70 rounded-lg"
                        : "text-gray-500 hover:text-gray-700"
                      }`}
                    onClick={() => setActiveTab("mamografias")}
                  >
                    <CircleStackIcon className="size-6" />
                    <span>Mamografías</span>
                  </button>

                  <button
                    className={`px-4 py-2 text-sm font-medium flex flex-row items-center gap-2 ${activeTab === "ecografias"
                        ? " border-[#f9dbbd] font-extrabold text-4xl text-[#b0c4b1] bg-[#4a5759]/70 rounded-lg"
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
                  
                    {/* Modified to group by exam name */}
                    
                    {Object.keys(groupedExams).map((examName) => (
                      <div key={examName} className="mb-6 border-b pb-4">  
                      <table className="w-full table-auto">
                          <thead className="bg-gray-50 text-md font-semibold uppercase text-gray-400">
                            <tr className="text-cyan-500">
                              <th className="p-2 text-left">Fecha Examen</th>
                              <th className="p-2 text-left">Examen</th>
                              <th className="p-2 text-left">Acciones</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100 text-sm">
                            {/* Group records by date within each exam name */}
                            {Object.entries(
                              groupedExams[examName].reduce((dateGroups, record) => {
                                const date = record.Fecha;
                                if (!dateGroups[date]) {
                                  dateGroups[date] = [];
                                }
                                dateGroups[date].push(record);
                                return dateGroups;
                              }, {})
                            ).map(([date, dateRecords]) => (
                              <tr key={date} className="hover:bg-gray-50">
                                <td className="p-2 font-medium">{date}</td>
                                <td className="p-2 font-medium">{examName}</td>
                                <td className="p-2">
                                  <button
                                    onClick={() => handleGeneratePDF(examName, date)}
                                    className="text-red-800 hover:text-blue-700 flex items-center gap-1"
                                  >
                                    <DocumentArrowDownIcon className="size-6" />
                                    Descargar PDF
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ))}
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
