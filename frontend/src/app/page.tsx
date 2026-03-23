"use client";

import { getConstants } from "@/constants";
import { makeLinkRedirect } from "@/helper/makeLinkRedirect";
import { truncateString } from "@/helper/truncateString";
import { getAllFilesService } from "@/services/getAllFilesService";
import { uploadFiles } from "@/services/uploadFiles";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function Home() {
  const router = useRouter();
  const [files, setFiles] = useState<any[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  
  // New features state
  const [filterType, setFilterType] = useState("all");
  const [errorMessage, setErrorMessage] = useState("");
  const [currentFolder, setCurrentFolder] = useState<string>("");
  const [newFolderName, setNewFolderName] = useState("");
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [virtualFolders, setVirtualFolders] = useState<string[]>([]);

  const getFileType = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    const images = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'];
    const documents = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'txt', 'csv'];
    
    if (images.includes(ext || '')) return 'image';
    if (documents.includes(ext || '')) return 'document';
    return 'other';
  };

  const handleChange = async (event: any) => {
    try {
      setErrorMessage("");
      const selectedFiles = event.target.files;
      if (!selectedFiles || selectedFiles.length === 0) return;
      
      const file = selectedFiles[0];
      
      // Limit 5MB
      if (file.size > 5 * 1024 * 1024) {
        setErrorMessage("O arquivo excede o limite de 5MB.");
        return;
      }

      setIsUploading(true);
      setFiles([...selectedFiles]);
      
      const response = await uploadFiles(file, currentFolder);
      
      setUploadedFiles((prev) => [...prev, response]);
      setFiles([]);
    } catch (error: any) {
      console.error("Upload failed:", error);
      setErrorMessage(error.message || "Erro ao fazer upload do arquivo.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem(getConstants().LOCAL_STORAGE_TOKEN);
    router.push("/login");
  };

  useEffect(() => {
    const token = localStorage.getItem(getConstants().LOCAL_STORAGE_TOKEN);
    if (!token) {
      router.push("/login");
      return;
    }
    
    getAllFilesService()
      .then((response) => {
        setUploadedFiles([...response]);
      })
      .catch((error) => {
        console.error("Failed to load files:", error);
        router.push("/login");
      });
  }, [router]);

  // Folders logic
  const existingFolders = Array.from(new Set(uploadedFiles.map(f => f.folder).filter(Boolean)));
  const allFolders = Array.from(new Set([...existingFolders, ...virtualFolders]));

  // Filtering files
  const currentFolderFiles = uploadedFiles.filter(f => (f.folder || "") === currentFolder);
  const filteredFiles = currentFolderFiles.filter(file => {
    if (filterType === "all") return true;
    return getFileType(file.fileName) === filterType;
  });

  return (
    <main className="flex h-screen flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-amber-500 to-amber-600 w-full h-16 flex items-center justify-between px-6 shadow-md shrink-0">
        <div className="flex items-center">
          <h1 className="font-bold text-2xl text-white">📁 Simple Storage</h1>
        </div>
        <div className="flex items-center space-x-4">
          <span className="text-white font-medium bg-amber-700 bg-opacity-40 px-3 py-1 rounded-full text-sm shadow-inner flex items-center">
             🗃️ {uploadedFiles.length} {uploadedFiles.length === 1 ? 'arquivo' : 'arquivos'} no total
          </span>
          <span className="text-white text-sm">Bem-vindo!</span>
          <button
            onClick={handleLogout}
            className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white px-4 py-2 rounded-md transition-all duration-200 text-sm font-medium"
          >
            Sair
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-7xl mx-auto">
          
          {/* Toolbar */}
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center space-x-4">
              {currentFolder !== "" && (
                <button onClick={() => setCurrentFolder("")} className="text-gray-600 hover:text-gray-800 font-medium flex items-center bg-gray-200 hover:bg-gray-300 px-3 py-1.5 rounded-md transition-colors text-sm">
                  <span className="mr-2">⬅️</span> Voltar
                </button>
              )}
              <h2 className="text-2xl font-semibold text-gray-800">
                {currentFolder === "" ? "Meus Arquivos" : `Pasta: ${currentFolder}`}
              </h2>
            </div>
            
            <div className="flex space-x-4">
              <select 
                value={filterType} 
                onChange={(e) => setFilterType(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white shadow-sm"
              >
                <option value="all">Todos os tipos</option>
                <option value="image">Imagens</option>
                <option value="document">Documentos</option>
                <option value="other">Outros</option>
              </select>
              
              {currentFolder === "" && (
                <button
                  onClick={() => setIsCreatingFolder(true)}
                  className="bg-amber-100 hover:bg-amber-200 text-amber-700 px-4 py-2 rounded-md transition-colors text-sm font-medium border border-amber-200 shadow-sm"
                >
                  + Nova Pasta
                </button>
              )}
            </div>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-md shadow-sm flex justify-between items-center">
              <p>{errorMessage}</p>
              <button onClick={() => setErrorMessage("")} className="text-red-700 hover:text-red-900 font-bold text-xl">&times;</button>
            </div>
          )}

          {/* Create Folder Form */}
          {isCreatingFolder && (
            <div className="mb-6 bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex items-center space-x-3 max-w-md">
              <input 
                type="text" 
                placeholder="Nome da pasta..." 
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 flex-1"
                autoFocus
              />
              <button 
                onClick={() => {
                  if (newFolderName.trim()) {
                    if (!allFolders.includes(newFolderName.trim())) {
                      setVirtualFolders([...virtualFolders, newFolderName.trim()]);
                    }
                    setNewFolderName("");
                    setIsCreatingFolder(false);
                  }
                }}
                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md transition-colors text-sm font-medium"
              >
                Salvar
              </button>
              <button 
                onClick={() => {
                  setIsCreatingFolder(false);
                  setNewFolderName("");
                }}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-md transition-colors text-sm font-medium"
              >
                Cancelar
              </button>
            </div>
          )}

          {/* Grid Area */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6">
            
            {/* Folders (only at root level) */}
            {currentFolder === "" && allFolders.map((folder) => (
              <div
                key={folder}
                onClick={() => {
                  setCurrentFolder(folder);
                  setFilterType("all"); // Reset filter when entering a folder
                }}
                className="bg-amber-50 border-2 border-amber-200 hover:border-amber-400 rounded-lg p-4 flex flex-col items-center justify-center h-40 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer group"
              >
                <div className="text-amber-500 text-4xl mb-2 group-hover:scale-110 transition-transform duration-200">📁</div>
                <p className="text-sm text-center text-gray-700 font-medium break-all">
                  {truncateString(folder, 20)}
                </p>
                <p className="text-xs text-amber-600 mt-1">
                  {uploadedFiles.filter(f => f.folder === folder).length} arquivos
                </p>
              </div>
            ))}

            {/* Upload in progress */}
            {files.map((file, idx) => (
              <div
                key={idx}
                className="bg-white border-2 border-blue-300 rounded-lg p-4 flex flex-col items-center justify-center h-40 shadow-sm animate-pulse"
              >
                <div className="text-blue-500 text-3xl mb-2">⏳</div>
                <p className="text-sm text-center text-gray-600 mb-2 break-all">
                  {truncateString(file.name, 20)}
                </p>
                <p className="text-xs text-blue-500">Carregando...</p>
              </div>
            ))}

            {/* Filtered Files */}
            {filteredFiles.map((file) => {
              const fileType = getFileType(file.fileName);
              const icon = fileType === 'image' ? '🖼️' : fileType === 'document' ? '📄' : '📎';
              
              return (
                <div
                  key={file.fileName}
                  onClick={() =>
                    window.open(makeLinkRedirect(file.fileName), "_blank")
                  }
                  className="bg-white border-2 border-green-300 hover:border-green-400 rounded-lg p-4 flex flex-col items-center justify-center h-40 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer group"
                >
                  <div className="text-3xl mb-2 group-hover:scale-110 transition-transform duration-200">
                    {icon}
                  </div>
                  <p className="text-sm text-center text-gray-700 font-medium break-all px-2">
                    {truncateString(file.fileName?.split("_").slice(2).join("_") || file.fileName, 20)}
                  </p>
                  <p className="text-xs text-green-600 mt-1">Clique para abrir</p>
                </div>
              );
            })}

            {/* Upload Button */}
            <div className="bg-white border-2 border-dashed border-amber-400 hover:border-amber-500 rounded-lg p-4 flex flex-col items-center justify-center h-40 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer hover:bg-amber-50 group">
              <label className="cursor-pointer w-full h-full flex flex-col items-center justify-center">
                {isUploading ? (
                  <>
                    <div className="text-amber-500 text-3xl mb-2 animate-spin">⚙️</div>
                    <p className="text-sm text-center text-amber-600 font-medium">
                      Enviando arquivo...
                    </p>
                  </>
                ) : (
                  <>
                    <div className="text-amber-500 text-3xl mb-2 group-hover:scale-110 transition-transform duration-200">📤</div>
                    <p className="text-sm text-center text-gray-600 font-medium mb-1">
                      Adicionar arquivo
                    </p>
                    <p className="text-xs text-center text-gray-500">
                      Máximo 5MB
                    </p>
                  </>
                )}
                <input
                  type="file"
                  name="file"
                  className="hidden"
                  onChange={handleChange}
                  disabled={isUploading}
                />
              </label>
            </div>
          </div>
          
          {/* Empty states */}
          {currentFolder === "" && allFolders.length === 0 && uploadedFiles.length === 0 && (
            <div className="text-center py-12">
              <div className="text-6xl text-gray-300 mb-4">📁</div>
              <p className="text-xl text-gray-500 mb-2">Nenhum arquivo encontrado</p>
              <p className="text-gray-400">Comece fazendo upload do seu primeiro arquivo ou crie uma pasta!</p>
            </div>
          )}

          {currentFolder !== "" && filteredFiles.length === 0 && (
            <div className="text-center py-12">
              <div className="text-6xl text-gray-300 mb-4">📂</div>
              <p className="text-xl text-gray-500 mb-2">A pasta está vazia</p>
              <p className="text-gray-400">Faça upload de arquivos aqui para organizá-los.</p>
            </div>
          )}

        </div>
      </div>
    </main>
  );
}
