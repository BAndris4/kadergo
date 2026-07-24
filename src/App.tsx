import { useState, useEffect } from "react";
import { FopData, CreateFopFormState, EditFopFormState, CreateWorkerFormState, EditWorkerFormState, Munkas } from "./types/fop";
import {
  fetchFops,
  createFop,
  updateFop,
  deleteFop,
  createWorker,
  updateWorker,
  dismissWorker,
  deleteWorker,
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
import { ToastNotice } from "./components/ToastNotice";
import "./App.css";

export default function App() {
  const [fops, setFops] = useState<FopData[]>([]);
  const [expandedFopIds, setExpandedFopIds] = useState<number[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [isAddFopModalOpen, setIsAddFopModalOpen] = useState(false);
  const [fopToEdit, setFopToEdit] = useState<FopData | null>(null);
  const [fopToDelete, setFopToDelete] = useState<FopData | null>(null);

  const [fopForNewWorker, setFopForNewWorker] = useState<FopData | null>(null);
  const [workerToEdit, setWorkerToEdit] = useState<Munkas | null>(null);
  const [workerToDelete, setWorkerToDelete] = useState<Munkas | null>(null);

  useEffect(() => {
    async function loadData() {
      const activeData = await fetchFops();
      setFops(activeData);
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

  const handleAddFopSubmit = async (formData: CreateFopFormState) => {
    const newFop = await createFop(formData, fops);
    setFops((prev) => [newFop, ...prev]);
    setExpandedFopIds((prev) => [...prev, newFop.id]);
    setIsAddFopModalOpen(false);

    const fopOwnerName = [newFop.vezeteknev, newFop.keresztnev, newFop.apai_nev].filter(Boolean).join(" ");
    showToast(`ФОП "${fopOwnerName}" успішно збережено!`);
  };

  const handleEditFopSubmit = async (formData: EditFopFormState) => {
    const updatedFop = await updateFop(formData, fops);
    setFops((prev) => prev.map((f) => (f.id === updatedFop.id ? updatedFop : f)));
    setFopToEdit(null);

    const fopOwnerName = [updatedFop.vezeteknev, updatedFop.keresztnev, updatedFop.apai_nev].filter(Boolean).join(" ");
    showToast(`ФОП "${fopOwnerName}" успішно оновлено!`);
  };

  const handleConfirmDeleteFop = async () => {
    if (!fopToDelete) return;
    const fopOwnerName = [fopToDelete.vezeteknev, fopToDelete.keresztnev, fopToDelete.apai_nev].filter(Boolean).join(" ");
    const updated = await deleteFop(fopToDelete.id, fops);
    setFops(updated);
    setFopToDelete(null);
    setFopToEdit(null);
    showToast(`ФОП "${fopOwnerName}" успішно видалено z бази!`);
  };

  const handleAddWorkerSubmit = async (formData: CreateWorkerFormState) => {
    const createdWorker = await createWorker(formData, fops);
    setFops((prev) =>
      prev.map((fop) => {
        if (fop.id === formData.fop_id) {
          return { ...fop, munkasok: [...fop.munkasok, createdWorker] };
        }
        return fop;
      })
    );
    setFopForNewWorker(null);

    const workerName = [createdWorker.vezeteknev, createdWorker.keresztnev, createdWorker.apai_nev].filter(Boolean).join(" ");
    showToast(`Працівника "${workerName}" успішно оформлено!`);
  };

  const handleEditWorkerSubmit = async (formData: EditWorkerFormState) => {
    const updatedWorker = await updateWorker(formData, fops);
    setFops((prev) =>
      prev.map((fop) => ({
        ...fop,
        munkasok: fop.munkasok.map((m) => (m.id === updatedWorker.id ? updatedWorker : m)),
      }))
    );
    setWorkerToEdit(null);

    const workerName = [updatedWorker.vezeteknev, updatedWorker.keresztnev, updatedWorker.apai_nev].filter(Boolean).join(" ");
    showToast(`Дані працівника "${workerName}" успішно оновлено!`);
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

  const filteredFops = fops.filter((fop) => {
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
  });

  const osszesMunkasCount = fops.reduce((acc, fop) => acc + fop.munkasok.length, 0);

  return (
    <div className="w-full max-w-[1280px] mx-auto px-8 py-10 pb-20">
      <Header onOpenAddModal={() => setIsAddFopModalOpen(true)} />

      <StatsGrid fopCount={fops.length} workerCount={osszesMunkasCount} />

      <div className="mb-8">
        <SearchBar value={searchQuery} onChange={setSearchQuery} />
      </div>

      <main>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-2xl font-black font-heading text-[#133b47] tracking-tight">
            Список Фізичних Осіб-Підприємців (ФОП)
          </h2>
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
