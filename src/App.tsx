import { useState, useEffect } from "react";
import { FopData, CreateFopFormState, EditFopFormState, CreateWorkerFormState, EditWorkerFormState, Munkas, DiscoveredFopDto } from "./types/fop";
import {
  fetchFops,
  createFop,
  updateFop,
  deleteFop,
  createWorker,
  updateWorker,
  dismissWorker,
  deleteWorker,
  getSavedRootFolder,
  saveRootFolder,
  getSavedMinWage,
  saveMinWage,
  ensureFopDirectory,
  scanDiscoveredFopFolders,
  importSelectedFops,
} from "./services/fopService";
import { Header } from "./components/Header";
import { StatsGrid } from "./components/StatsGrid";
import { SearchBar } from "./components/SearchBar";
import { FopCard } from "./components/FopCard";
import { AddFopModal } from "./components/AddFopModal/AddFopModal";
import { EditFopModal } from "./components/EditFopModal";
import { AddWorkerModal } from "./components/AddWorkerModal/AddWorkerModal";
import { EditWorkerModal } from "./components/EditWorkerModal";
import { DeleteConfirmModal } from "./components/DeleteConfirmModal";
import { DeleteWorkerConfirmModal } from "./components/DeleteWorkerConfirmModal";
import { SettingsModal } from "./components/SettingsModal";
import { UpdateModal } from "./components/UpdateModal";
import { FolderScanModal } from "./components/FolderScanModal";
import { ToastNotice } from "./components/ToastNotice";
import { DocumentGeneratorView } from "./views/DocumentGeneratorView";
import { MagnifyingGlassIcon, PlusIcon } from "@heroicons/react/24/outline";
import "./App.css";

export default function App() {
  const [activeTab, setActiveTab] = useState<"generator" | "management">("generator");
  const [fops, setFops] = useState<FopData[]>([]);
  const [selectedFopId, setSelectedFopId] = useState<number | null>(null);
  const [rootFolder, setRootFolder] = useState<string>("");
  const [minWage, setMinWage] = useState<number>(8647);

  const [expandedFopIds, setExpandedFopIds] = useState<number[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [isAddFopModalOpen, setIsAddFopModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [discoveredFops, setDiscoveredFops] = useState<DiscoveredFopDto[]>([]);
  const [isScanModalOpen, setIsScanModalOpen] = useState(false);

  const [fopToEdit, setFopToEdit] = useState<FopData | null>(null);
  const [fopToDelete, setFopToDelete] = useState<FopData | null>(null);

  const [fopForNewWorker, setFopForNewWorker] = useState<FopData | null>(null);
  const [workerToEdit, setWorkerToEdit] = useState<Munkas | null>(null);
  const [workerToDelete, setWorkerToDelete] = useState<Munkas | null>(null);

  useEffect(() => {
    async function loadData() {
      const activeData = await fetchFops();
      const savedRoot = getSavedRootFolder();
      const savedWage = getSavedMinWage();

      setFops(activeData);
      if (savedRoot) setRootFolder(savedRoot);
      setMinWage(savedWage);

      if (activeData.length > 0) {
        setExpandedFopIds([activeData[0].id]);
      }

    }
    loadData();
  }, []);

  const toggleFopExpand = (id: number) => {
    setExpandedFopIds((prev) =>
      prev.includes(id) ? prev.filter((fopId) => fopId !== id) : [...prev, id]
    );
  };

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const handleRootFolderChange = (newPath: string) => {
    setRootFolder(newPath);
    saveRootFolder(newPath);
  };

  const handleMinWageChange = (newWage: number) => {
    setMinWage(newWage);
    saveMinWage(newWage);
  };

  const handleStartFolderScan = async () => {
    if (!rootFolder) {
      showToast("Спочатку оберіть головну папку збереження в Налаштуваннях!");
      return;
    }
    const discovered = await scanDiscoveredFopFolders(rootFolder);
    if (discovered.length === 0) {
      showToast("У цій папці не знайдено підпапок у форматі 'КОД ПРІЗВИЩЕ ІМ'Я ПО БАТЬКОВІ'.");
      return;
    }
    setDiscoveredFops(discovered);
    setIsScanModalOpen(true);
  };

  const handleConfirmImportFops = async (selectedItems: DiscoveredFopDto[]) => {
    const updatedFops = await importSelectedFops(selectedItems);
    setFops(updatedFops);
    if (updatedFops.length > 0) {
      const newlyImported = updatedFops.find((f: FopData) =>
        selectedItems.some((s) => s.kod === f.kod || s.kod === f.fop_kod)
      );
      if (newlyImported) {
        setSelectedFopId(newlyImported.id);
        setExpandedFopIds((prev) => [...new Set([...prev, newlyImported.id])]);
      } else if (!selectedFopId) {
        setSelectedFopId(updatedFops[0].id);
      }
    }
    showToast(`Успішно імпортовано ${selectedItems.length} обраних ФОП з папки!`);
  };

  const handleAddFopSubmit = async (formData: CreateFopFormState) => {
    if (!rootFolder) {
      showToast("Спочатку оберіть головну папку збереження в Налаштуваннях!");
      setIsSettingsModalOpen(true);
      return;
    }

    const newFop = await createFop(formData, fops);
    const fullName = [newFop.vezeteknev, newFop.keresztnev, newFop.apai_nev].filter(Boolean).join(" ");
    await ensureFopDirectory(rootFolder, newFop.kod || newFop.fop_kod || "", fullName);

    const updatedFops = await fetchFops();
    setFops(updatedFops);
    setSelectedFopId(newFop.id);
    setExpandedFopIds((prev) => [...prev, newFop.id]);
    setIsAddFopModalOpen(false);

    showToast(`ФОП "${newFop.vezeteknev} ${newFop.keresztnev}" успішно створено та створено папку!`);
  };

  const handleEditFopSubmit = async (formData: EditFopFormState) => {
    await updateFop(formData, fops);
    const updated = await fetchFops();
    setFops(updated);
    setFopToEdit(null);
    showToast(`Дані ФОП "${formData.vezeteknev} ${formData.keresztnev}" оновлено!`);
  };

  const handleConfirmDeleteFop = async () => {
    if (!fopToDelete) return;
    const fopName = [fopToDelete.vezeteknev, fopToDelete.keresztnev, fopToDelete.apai_nev].filter(Boolean).join(" ");
    const updated = await deleteFop(fopToDelete.id, fops);
    setFops(updated);
    if (selectedFopId === fopToDelete.id) {
      setSelectedFopId(updated.length > 0 ? updated[0].id : null);
    }
    setFopToDelete(null);
    setFopToEdit(null);
    showToast(`ФОП "${fopName}" успішно видалено з системи!`);
  };

  const handleAddWorkerSubmit = async (formData: CreateWorkerFormState) => {
    if (!fopForNewWorker) return;
    await createWorker(formData, fops);
    const updated = await fetchFops();
    setFops(updated);
    setFopForNewWorker(null);
    showToast(`Працівника "${formData.vezeteknev} ${formData.keresztnev}" успішно додано!`);
  };

  const handleEditWorkerSubmit = async (formData: EditWorkerFormState) => {
    if (!workerToEdit) return;
    await updateWorker(formData, fops);
    const updated = await fetchFops();
    setFops(updated);
    setWorkerToEdit(null);
    showToast(`Дані працівника "${formData.vezeteknev} ${formData.keresztnev}" успішно оновлено!`);
  };

  const handleDismissWorker = async (date: string) => {
    if (!workerToDelete) return;
    const workerName = [workerToDelete.vezeteknev, workerToDelete.keresztnev, workerToDelete.apai_nev].filter(Boolean).join(" ");
    const updated = await dismissWorker(workerToDelete.id, date, fops);
    setFops(updated);
    setWorkerToDelete(null);
    showToast(`Працівника "${workerName}" успішно звільнено!`);
  };

  const handleConfirmDeleteWorker = async () => {
    if (!workerToDelete) return;
    const workerName = [workerToDelete.vezeteknev, workerToDelete.keresztnev, workerToDelete.apai_nev].filter(Boolean).join(" ");
    const updated = await deleteWorker(workerToDelete.id, fops);
    setFops(updated);
    setWorkerToDelete(null);
    showToast(`Працівника "${workerName}" успішно видалено з бази!`);
  };

  const filteredFops = fops
    .filter((fop) => {
      const fopNev = [fop.vezeteknev, fop.keresztnev, fop.apai_nev].filter(Boolean).join(" ").toLowerCase();
      const fopKod = (fop.kod || "").toLowerCase();
      const query = searchQuery.toLowerCase();

      const matchesFop = fopNev.includes(query) || (fopKod ? fopKod.includes(query) : false);
      const matchesWorker = fop.munkasok.some((m) => {
        const mName = [m.vezeteknev, m.keresztnev, m.apai_nev].filter(Boolean).join(" ").toLowerCase();
        const mKod = (m.kod || "").toLowerCase();
        return mName.includes(query) || (mKod ? mKod.includes(query) : false);
      });

      return matchesFop || matchesWorker;
    })
    .sort((a, b) => {
      const nameA = [a.vezeteknev, a.keresztnev, a.apai_nev].filter(Boolean).join(" ");
      const nameB = [b.vezeteknev, b.keresztnev, b.apai_nev].filter(Boolean).join(" ");
      return nameA.localeCompare(nameB, "uk", { sensitivity: "base" });
    });

  const [docKey, setDocKey] = useState<number>(0);

  const handleGoHome = () => {
    setActiveTab("generator");
    setDocKey((prev) => prev + 1);
  };

  const osszesMunkasCount = fops.reduce((acc, fop) => acc + fop.munkasok.length, 0);

  return (
    <div className="w-full max-w-[1600px] mx-auto px-10 py-10 pb-24">
      <Header
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
        onOpenUpdate={() => setIsUpdateModalOpen(true)}
        onGoHome={handleGoHome}
      />

      {/* VIEW 1: Document Generator Main View */}
      {activeTab === "generator" && (
        <DocumentGeneratorView
          key={docKey}
          fops={fops}
          selectedFopId={selectedFopId}
          onSelectFop={setSelectedFopId}
          rootFolder={rootFolder}
          minWage={minWage}
          onShowToast={showToast}
          onEditWorker={(w) => setWorkerToEdit(w)}
          onDeleteWorker={(w) => setWorkerToDelete(w)}
          onAddWorker={(fId) => {
            const targetFop = fops.find((f) => f.id === fId) || null;
            setFopForNewWorker(targetFop);
          }}
        />
      )}


      {/* VIEW 2: FOP & Workers Database Management View */}
      {activeTab === "management" && (
        <div className="flex flex-col gap-6 animate-fadeIn">
          <StatsGrid fopCount={fops.length} workerCount={osszesMunkasCount} />

          <div className="mb-2">
            <SearchBar value={searchQuery} onChange={setSearchQuery} />
          </div>

          <main>
            <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
              <h2 className="text-2xl font-black font-heading text-[#133b47] tracking-tight">
                Реєстр Фізичних Осіб-Підприємців (ФОП)
              </h2>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleStartFolderScan}
                  className="px-5 py-2.5 rounded-2xl bg-[#133b47] hover:bg-[#0f2e38] text-[#f8a44c] font-black text-xs transition-all shadow-md cursor-pointer flex items-center gap-2 transform hover:-translate-y-0.5"
                >
                  <MagnifyingGlassIcon className="w-4.5 h-4.5 stroke-[2.2]" />
                  <span>Розпізнати папки ФОП</span>
                </button>
                <button
                  onClick={() => setIsAddFopModalOpen(true)}
                  className="px-5 py-2.5 rounded-2xl bg-[#f8a44c] hover:bg-[#f59533] text-[#133b47] font-black text-xs transition-all shadow-md cursor-pointer flex items-center gap-2 transform hover:-translate-y-0.5"
                >
                  <PlusIcon className="w-4.5 h-4.5 stroke-[3]" />
                  <span>Додати нового ФОП</span>
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-5">
              {filteredFops.length === 0 ? (
                <div className="p-10 text-center text-[#59747c] font-bold text-base bg-white rounded-3xl border-2 border-[#c6d7d5] shadow-sm">
                  ФОП за вашим запитом не знайдено.
                </div>
              ) : (
                filteredFops.map((fop) => (
                  <FopCard
                    key={fop.id}
                    fop={fop}
                    isExpanded={expandedFopIds.includes(fop.id)}
                    onToggleExpand={toggleFopExpand}
                    onEditClick={(targetFop) => setFopToEdit(targetFop)}
                    onAddWorkerClick={(targetFop) => setFopForNewWorker(targetFop)}
                    onEditWorkerClick={(targetWorker) => setWorkerToEdit(targetWorker)}
                    onDeleteWorkerClick={(targetWorker) => setWorkerToDelete(targetWorker)}
                  />
                ))
              )}
            </div>
          </main>
        </div>
      )}

      <AddFopModal
        isOpen={isAddFopModalOpen}
        onClose={() => setIsAddFopModalOpen(false)}
        onSubmit={handleAddFopSubmit}
      />

      <EditFopModal
        isOpen={!!fopToEdit}
        fop={fopToEdit}
        onClose={() => setFopToEdit(null)}
        onSubmit={handleEditFopSubmit}
        onDeleteClick={(targetFop) => setFopToDelete(targetFop)}
      />

      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        rootFolder={rootFolder}
        onRootFolderChange={handleRootFolderChange}
        minWage={minWage}
        onMinWageChange={handleMinWageChange}
        onShowToast={showToast}
        onScanFolders={handleStartFolderScan}
        onFopsCleared={() => {
          setFops([]);
          setSelectedFopId(null);
        }}
      />

      <UpdateModal
        isOpen={isUpdateModalOpen}
        onClose={() => setIsUpdateModalOpen(false)}
      />

      <FolderScanModal
        isOpen={isScanModalOpen}
        discoveredFops={discoveredFops}
        onClose={() => setIsScanModalOpen(false)}
        onImport={handleConfirmImportFops}
        onOpenAddModal={() => setIsAddFopModalOpen(true)}
      />

      <DeleteConfirmModal
        isOpen={!!fopToDelete}
        fopName={
          fopToDelete
            ? [fopToDelete.vezeteknev, fopToDelete.keresztnev, fopToDelete.apai_nev].filter(Boolean).join(" ")
            : ""
        }
        onClose={() => setFopToDelete(null)}
        onConfirm={handleConfirmDeleteFop}
      />

      <AddWorkerModal
        isOpen={!!fopForNewWorker}
        fopId={fopForNewWorker?.id || null}
        fopOwnerName={
          fopForNewWorker
            ? [fopForNewWorker.vezeteknev, fopForNewWorker.keresztnev, fopForNewWorker.apai_nev].filter(Boolean).join(" ")
            : ""
        }
        onClose={() => setFopForNewWorker(null)}
        onSubmit={handleAddWorkerSubmit}
      />

      <EditWorkerModal
        isOpen={!!workerToEdit}
        worker={workerToEdit}
        onClose={() => setWorkerToEdit(null)}
        onSubmit={handleEditWorkerSubmit}
      />

      <DeleteWorkerConfirmModal
        isOpen={!!workerToDelete}
        workerName={
          workerToDelete
            ? [workerToDelete.vezeteknev, workerToDelete.keresztnev, workerToDelete.apai_nev].filter(Boolean).join(" ")
            : ""
        }
        onClose={() => setWorkerToDelete(null)}
        onDismiss={handleDismissWorker}
        onDeletePermanent={handleConfirmDeleteWorker}
      />

      {toastMessage && <ToastNotice message={toastMessage} />}
    </div>
  );
}
