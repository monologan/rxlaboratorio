"use client"

import React, { useState } from 'react';
import axios from 'axios';
import { saveAs } from 'file-saver';

const App = () => {
  const [cedula, setCedula] = useState('');
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSearch = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(`http://localhost:8000/api/records/${cedula}`);
      setRecords(response.data.data);
    } catch (err) {
      setError('Error al buscar los registros');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePDF = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`http://localhost:8000/api/pdf/${cedula}`, {
        responseType: 'blob'
      });
      
      // Crear URL del blob y descargar
      const blob = new Blob([response.data], { type: 'application/pdf' });
      saveAs(blob, `reporte_${cedula}.pdf`);
    } catch (err) {
      setError('Error al generar el PDF');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Consulta de Registros</h1>
      
      <div className="mb-4">
        <input
          type="text"
          value={cedula}
          onChange={(e) => setCedula(e.target.value)}
          placeholder="Ingrese la cédula"
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

      {error && <div className="text-red-500 mb-4">{error}</div>}

      {records.length > 0 && (
        <>
          <table className="w-full border-collapse border">
            <thead>
              <tr>
                {Object.keys(records[0]).map((key) => (
                  <th key={key} className="border p-2">
                    {key}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {records.map((record, index) => (
                <tr key={index}>
                  {Object.values(record).map((value, i) => (
                    <td key={i} className="border p-2">
                      {value}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>

          <button
            onClick={handleGeneratePDF}
            disabled={loading}
            className="mt-4 bg-green-500 text-white px-4 py-2 rounded"
          >
            Generar PDF
          </button>
        </>
      )}
    </div>
  );
};

export default App;