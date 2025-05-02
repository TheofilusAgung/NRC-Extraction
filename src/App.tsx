import React, { useState } from 'react';
import Papa from 'papaparse';
import { Upload, Download, FileWarning } from 'lucide-react';

interface ParsedData {
  data: any[];
  columns: string[];
}

function App() {
  const [parsedData, setParsedData] = useState<ParsedData | null>(null);
  const [processedData, setProcessedData] = useState<any[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      complete: (results) => {
        setParsedData({
          data: results.data,
          columns: results.meta.fields || []
        });
        setError(null);
      },
      header: true,
      error: (error) => {
        setError(`Error parsing CSV: ${error.message}`);
      }
    });
  };

  const processData = () => {
    if (!parsedData) return;

    try {
      const processed = parsedData.data.map((row: any) => {
        const actionLog = row['ACTION LOG'] || '';
        
        // Extract AMM reference
        const ammMatch = actionLog.match(/(AMM|MAINTENANCE MANUAL|AMM TASK|Refer to)\s([\d-]+)/);
        const ammRef = ammMatch ? ammMatch[2] : '';

        // Extract other references
        const otherRefs = (actionLog.match(/(SB|CMM|SRM|SOPM|NDT|NTM B747 PART|SWPM|IAI|IAI MAINTENANCE MANUAL|WDM|AIPC|FIM)\s([\d-]+)/g) || [])
          .map(match => match.trim());

        return {
          ...row,
          'AMM REF': ammRef,
          'AMM REFERENCE TYPE': otherRefs.join(', ')
        };
      });

      setProcessedData(processed);
      setError(null);
    } catch (err) {
      setError(`Error processing data: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const downloadCSV = () => {
    if (!processedData) return;

    const csv = Papa.unparse(processedData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', 'processed_data.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">CSV Regular Expression Extractor</h1>
          <p className="mt-2 text-gray-600">Upload your CSV file to extract AMM references and other maintenance documents</p>
        </div>

        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Upload CSV File</label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
              <div className="space-y-1 text-center">
                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                <div className="flex text-sm text-gray-600">
                  <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
                    <span>Upload a file</span>
                    <input
                      id="file-upload"
                      name="file-upload"
                      type="file"
                      className="sr-only"
                      accept=".csv"
                      onChange={handleFileUpload}
                    />
                  </label>
                  <p className="pl-1">or drag and drop</p>
                </div>
                <p className="text-xs text-gray-500">CSV files only</p>
              </div>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-50 rounded-md">
              <div className="flex">
                <FileWarning className="h-5 w-5 text-red-400" />
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Error</h3>
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          {parsedData && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">
                  {parsedData.data.length} rows loaded
                </span>
                <button
                  onClick={processData}
                  className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Process Data
                </button>
              </div>

              {processedData && (
                <button
                  onClick={downloadCSV}
                  className="w-full flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  <Download className="mr-2 h-5 w-5" />
                  Download Processed CSV
                </button>
              )}
            </div>
          )}
        </div>

        {processedData && (
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Preview</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {Object.keys(processedData[0]).map((header) => (
                      <th
                        key={header}
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {processedData.slice(0, 5).map((row, idx) => (
                    <tr key={idx}>
                      {Object.values(row).map((value: any, cellIdx) => (
                        <td
                          key={cellIdx}
                          className="px-6 py-4 whitespace-nowrap text-sm text-gray-500"
                        >
                          {value}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;