"use client";

import React, { useState } from "react";
import axios from "axios";
import { saveAs } from "file-saver";
import Image from "next/image";

const App = () => {
  const [cedula, setCedula] = useState("");
  const [factura, setFactura] = useState("");
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedRecords, setSelectedRecords] = useState([]);

  const handleSearch = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(
        `http://localhost:8000/api/records?cedula=${cedula}&factura=${factura}`
      );
      setRecords(response.data.data);
    } catch (err) {
      setError("Error al buscar los registros");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePDF = async () => {
    try {
      setLoading(true);
      const recordsToDownload =
        selectedRecords.length > 0
          ? selectedRecords
          : records.map((_, index) => index);

      const response = await axios({
        method: "post",
        url: `http://localhost:8000/api/pdf/${cedula}`,
        data: { selectedIndices: recordsToDownload },
        responseType: "blob",
        headers: {
          "Content-Type": "application/json"
        }
      });

      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `reporte_${cedula}.pdf`);
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

  const handleCheckboxChange = (index) => {
    setSelectedRecords((prev) => {
      if (prev.includes(index)) {
        return prev.filter((i) => i !== index);
      } else {
        return [...prev, index];
      }
    });
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

      {/* div de 3 elementos titulo-inputs-logo hospital */}
      <div className="flex flex-col  items-start gap-5 mt-6">
        <div>
          <h1 className="text-5xl font-bold texto-blue">
            Portal de Resultados
          </h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <input
            type="text"
            value={cedula}
            onChange={(e) => setCedula(e.target.value)}
            placeholder="ingrese su cedula"
            className="p-2 border rounded"
          />
          <input
            type="text"
            value={factura}
            onChange={(e) => setFactura(e.target.value)}
            placeholder="ingrese su factura"
            className="p-2 border rounded"
          />

          <button
            onClick={handleSearch}
            disabled={loading}
            className="ml-2 bg-blue-500 text-white px-4 py-2 rounded"
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
            <div className="flex flex-wrap w-[670px] gap-5 border-2 border-rose-500/40 rounded-lg p-2">
              <span className="font-bold">Factura: </span>
              <p>{factura}</p>
              <span className="font-bold">Documento de Identificacion: </span>
              <p>{cedula}</p>
              <span className="font-bold">Nombre Paciente: </span>
              <p>{records[0].Nombre}</p>
            </div>

            <div className="mx-0 w-full max-w-2xl rounded-sm border border-gray-200 bg-white shadow-lg">
              <header className="border-b border-gray-100 px-5 py-4">
                <div className="font-semibold text-gray-800">
                  Resultados Laboratorio
                </div>
              </header>

              <div className="overflow-x-auto p-2">
                <table className="w-full table-auto">
                  <thead className="bg-gray-50  text-md font-semibold uppercase text-gray-400">
                    <tr>                      
                      {Object.keys(records[0]).filter((key) => key !== "Nombre").map((key) => (
                          <th key={key} className="text-left font-semibold">
                            {key}
                          </th>                          
                        ))}
                        <th className="p-1">✅</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-sm">
                    {records.map((record, index) => (
                      <tr key={index}>
                        
                        {Object.entries(record)
                          .filter(([key]) => key !== "Nombre")
                          .map(([_, value], i) => (
                            <td key={i} className="p-2">
                              {value}
                            </td>
                          ))}
                          <td className="p-2">
                          <input
                            type="checkbox"
                            checked={selectedRecords.includes(index)}
                            onChange={() => handleCheckboxChange(index)}
                            className="h-4 w-4 p-2"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex justify-end space-x-4 border-t border-gray-100 px-5 py-4 text-2xl font-bold">
                <button
                  onClick={handleGeneratePDF}
                  disabled={loading}
                  className="mt-4 bg-green-500 text-white px-4 py-2 rounded"
                >
                  Generar PDF
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default App;
