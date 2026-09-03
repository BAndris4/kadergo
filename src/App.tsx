import { useState, useEffect } from "react";
import { FopData, FolderGroup, CreateFopFormState, EditFopFormState, CreateWorkerFormState, EditWorkerFormState, Munkas, DiscoveredFopDto } from "./types/fop";
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
  pickRootFolder,
  getSavedMinWage,
  saveMinWage,
  ensureFopDirectory,
  scanDiscoveredFopFolders,
  importSelectedFops,
  updateFopFolderAndGroup,
  fetchFolderGroups,
  createFolderGroup,
  updateFolderGroup,
  deleteFolderGroup,
  moveFopToGroup,
  openFolderInExplorer,
  pickFopFolder,
} from "./services/fopService";
import { checkUpdateOnStartup } from "./services/updaterService";
import { Update } from "@tauri-apps/plugin-updater";
import { Header } from "./components/common/Header";
import { StatsGrid } from "./components/common/StatsGrid";
import { SearchBar } from "./components/common/SearchBar";
import { FopContextMenu } from "./components/common/FopContextMenu";
import { FolderGroupModal } from "./components/modals/FolderGroupModal";
import { CategorySection } from "./components/common/CategorySection";
import { AddFopModal } from "./components/AddFopModal/AddFopModal";
import { EditFopModal } from "./components/modals/EditFopModal";
import { AddWorkerModal } from "./components/AddWorkerModal/AddWorkerModal";
import { EditWorkerModal } from "./components/modals/EditWorkerModal";
import { DeleteConfirmModal } from "./components/modals/DeleteConfirmModal";
import { DeleteWorkerConfirmModal } from "./components/modals/DeleteWorkerConfirmModal";
import { SettingsModal } from "./components/modals/SettingsModal";
import { UpdateModal } from "./components/modals/UpdateModal";
import { FolderScanModal } from "./components/modals/FolderScanModal";
import { ToastNotice } from "./components/common/ToastNotice";
import { DocumentGeneratorView } from "./views/DocumentGeneratorView";
import { MagnifyingGlassIcon, PlusIcon, FolderPlusIcon } from "@heroicons/react/24/outline";
import "./App.css";

export default function App() {
  const [activeTab, setActiveTab] = useState<"generator" | "management">("generator");
  const [fops, setFops] = useState<FopData[]>([]);
  const [selectedFopId, setSelectedFopId] = useState<number | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [folderGroups, setFolderGroups] = useState<FolderGroup[]>([]);
  const [isFolderGroupModalOpen, setIsFolderGroupModalOpen] = useState(false);
  const [folderGroupToEdit, setFolderGroupToEdit] = useState<FolderGroup | null>(null);
  const [draggingFopId, setDraggingFopId] = useState<number | null>(null);
  const [rootFolder, setRootFolder] = useState<string>("");
  const [minWage, setMinWage] = useState<number>(8647);

  const [expandedFopIds, setExpandedFopIds] = useState<number[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Custom Context Menu State
  const [contextMenuState, setContextMenuState] = useState<{
    isOpen: boolean;
    x: number;
    y: number;
    fop: FopData | null;
  }>({
    isOpen: false,
    x: 0,
    y: 0,
    fop: null,
  });

  // Synthetic Pointer Drag State
  const [pointerDragState, setPointerDragState] = useState<{
    isDragging: boolean;
    fop: FopData | null;
    x: number;
    y: number;
    offsetX: number;
    offsetY: number;
    width: number;
    hoveredGroupName: string | null | "__NONE__";
  }>({
    isDragging: false,
    fop: null,
    x: 0,
    y: 0,
    offsetX: 0,
    offsetY: 0,
    width: 380,
    hoveredGroupName: "__NONE__",
  });

  const handlePointerDragStart = (fop: FopData, clientX: number, clientY: number, rect: DOMRect) => {
    setDraggingFopId(fop.id);
    setPointerDragState({
      isDragging: true,
      fop,
      x: clientX,
      y: clientY,
      offsetX: Math.min(Math.max(20, clientX - rect.left), rect.width - 20),
      offsetY: Math.min(Math.max(20, clientY - rect.top), rect.height - 20),
      width: rect.width,
      hoveredGroupName: "__NONE__",
    });
  };

  useEffect(() => {
    if (!pointerDragState.isDragging || !pointerDragState.fop) return;

    const handlePointerMove = (e: PointerEvent) => {
      const elem = document.elementFromPoint(e.clientX, e.clientY);
      const categoryElem = elem?.closest("[data-category-dropzone]");
      let hoveredGroup: string | null | "__NONE__" = "__NONE__";
      if (categoryElem) {
        const groupName = categoryElem.getAttribute("data-category-dropzone");
        hoveredGroup = groupName === "__UNCATEGORIZED__" ? null : groupName;
      }

      setPointerDragState((prev) => ({
        ...prev,
        x: e.clientX,
        y: e.clientY,
        hoveredGroupName: hoveredGroup,
      }));
    };

    const handlePointerUp = async (e: PointerEvent) => {
      const elem = document.elementFromPoint(e.clientX, e.clientY);
      const categoryElem = elem?.closest("[data-category-dropzone]");
      if (categoryElem && pointerDragState.fop) {
        const groupName = categoryElem.getAttribute("data-category-dropzone");
        const targetGroup = groupName === "__UNCATEGORIZED__" ? null : groupName;
        await handleDropFopToGroup(pointerDragState.fop.id, targetGroup);
      }
      setDraggingFopId(null);
      setPointerDragState({
        isDragging: false,
        fop: null,
        x: 0,
        y: 0,
        offsetX: 0,
        offsetY: 0,
        width: 380,
        hoveredGroupName: "__NONE__",
      });
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [pointerDragState.isDragging, pointerDragState.fop]);

  const [isAddFopModalOpen, setIsAddFopModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [availableUpdateInfo, setAvailableUpdateInfo] = useState<Update | null>(null);
  const [hasUpdateNotification, setHasUpdateNotification] = useState<boolean>(false);

  const [discoveredFops, setDiscoveredFops] = useState<DiscoveredFopDto[]>([]);
  const [isScanModalOpen, setIsScanModalOpen] = useState(false);

  const [fopToEdit, setFopToEdit] = useState<FopData | null>(null);
  const [fopToDelete, setFopToDelete] = useState<FopData | null>(null);

  const [fopForNewWorker, setFopForNewWorker] = useState<FopData | null>(null);
  const [workerToEdit, setWorkerToEdit] = useState<Munkas | null>(null);
  const [workerToDelete, setWorkerToDelete] = useState<Munkas | null>(null);

  // Disable browser default right-click menu globally & enable WebView2 drag drop
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };
    const handleGlobalDragOver = (e: DragEvent) => {
      e.preventDefault();
    };
    const handleGlobalDrop = (e: DragEvent) => {
      e.preventDefault();
    };

    window.addEventListener("contextmenu", handleContextMenu);
    window.addEventListener("dragover", handleGlobalDragOver);
    window.addEventListener("drop", handleGlobalDrop);

    return () => {
      window.removeEventListener("contextmenu", handleContextMenu);
      window.removeEventListener("dragover", handleGlobalDragOver);
      window.removeEventListener("drop", handleGlobalDrop);
    };
  }, []);

  useEffect(() => {
    async function loadData() {
      const activeData = await fetchFops();
      const savedRoot = getSavedRootFolder();
      const savedWage = getSavedMinWage();

      setFops(activeData);
      if (savedRoot) setRootFolder(savedRoot);
      setMinWage(savedWage);

      let grps = await fetchFolderGroups();
      const existingFopGroupNames = Array.from(new Set(activeData.map((f) => f.folder_group?.trim()).filter(Boolean) as string[]));
      for (const grpName of existingFopGroupNames) {
        if (!grps.some((g) => g.name.toLowerCase() === grpName.toLowerCase())) {
          try {
            await createFolderGroup(grpName, "#f8a44c");
          } catch (_) {}
        }
      }
      grps = await fetchFolderGroups();
      setFolderGroups(grps);

      if (activeData.length > 0) {
        setExpandedFopIds([activeData[0].id]);
      }

      // Silent background update check on app launch
      checkUpdateOnStartup().then((updateObj) => {
        if (updateObj) {
          setAvailableUpdateInfo(updateObj);
          setHasUpdateNotification(true);
        }
      });
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
    await importSelectedFops(selectedItems);
    const updated = await fetchFops();
    setFops(updated);
    if (updated.length > 0) {
      setSelectedFopId(updated[0].id);
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
    try {
      const updated = await updateFop(formData, fops);
      setFops((prev) => prev.map((f) => (f.id === updated.id ? updated : f)));
      setFopToEdit(null);
      showToast(`Дані ФОП "${updated.vezeteknev} ${updated.keresztnev}" успішно оновлено!`);
    } catch (err) {
      console.error("Failed to update FOP:", err);
      showToast("Помилка при оновленні даних ФОП!");
    }
  };

  const handleConfirmDeleteFop = async () => {
    if (!fopToDelete) return;
    const name = `${fopToDelete.vezeteknev} ${fopToDelete.keresztnev}`;
    await deleteFop(fopToDelete.id, fops);
    const updated = await fetchFops();
    setFops(updated);
    if (selectedFopId === fopToDelete.id) {
      setSelectedFopId(null);
    }
    setFopToDelete(null);
    showToast(`ФОП "${name}" успішно видалено!`);
  };

  const handleAddWorkerSubmit = async (formData: CreateWorkerFormState) => {
    if (!fopForNewWorker) return;
    try {
      await createWorker({ ...formData, fop_id: fopForNewWorker.id }, fops);
      const updatedFops = await fetchFops();
      setFops(updatedFops);
      setFopForNewWorker(null);
      showToast(`Працівника "${formData.vezeteknev} ${formData.keresztnev}" успішно додано!`);
    } catch (err) {
      console.error("Failed to create worker:", err);
      showToast("Помилка при додаванні працівника!");
    }
  };

  const handleEditWorkerSubmit = async (formData: EditWorkerFormState) => {
    try {
      await updateWorker(formData, fops);
      const updatedFops = await fetchFops();
      setFops(updatedFops);
      setWorkerToEdit(null);
      showToast(`Дані працівника успішно оновлено!`);
    } catch (err) {
      console.error("Failed to update worker:", err);
      showToast("Помилка при оновленні працівника!");
    }
  };

  const handleDismissWorker = async (dismissalDate: string) => {
    if (!workerToEdit) return;
    try {
      await dismissWorker(workerToEdit.id, dismissalDate, fops);
      const updatedFops = await fetchFops();
      setFops(updatedFops);
      setWorkerToEdit(null);
      showToast(`Працівника звільнено успішно!`);
    } catch (err) {
      console.error("Failed to dismiss worker:", err);
      showToast("Помилка при звільненні працівника!");
    }
  };

  const handleConfirmDeleteWorker = async () => {
    if (!workerToDelete) return;
    const workerName = [workerToDelete.vezeteknev, workerToDelete.keresztnev, workerToDelete.apai_nev].filter(Boolean).join(" ");
    await deleteWorker(workerToDelete.id, fops);
    const updatedFops = await fetchFops();
    setFops(updatedFops);
    setWorkerToDelete(null);
    showToast(`Працівника "${workerName}" успішно видалено з бази даних!`);
  };

  const handleCreateOrUpdateFolderGroup = async (name: string, color: string) => {
    if (folderGroupToEdit) {
      await updateFolderGroup(folderGroupToEdit.id, name, color);
      showToast(`Папку "${name}" успішно оновлено!`);
    } else {
      await createFolderGroup(name, color);
      showToast(`Папку "${name}" успішно створено!`);
    }
    const updatedGrps = await fetchFolderGroups();
    setFolderGroups(updatedGrps);
    const updatedFops = await fetchFops();
    setFops(updatedFops);
  };

  const handleDeleteFolderGroup = async (group: FolderGroup) => {
    if (!window.confirm(`Ви впевнені, що хочете видалити папку "${group.name}"? ФОП залишаться в базі без папки.`)) {
      return;
    }
    await deleteFolderGroup(group.id);
    showToast(`Папку "${group.name}" видалено.`);
    if (selectedGroup === group.name) {
      setSelectedGroup(null);
    }
    const updatedGrps = await fetchFolderGroups();
    setFolderGroups(updatedGrps);
    const updatedFops = await fetchFops();
    setFops(updatedFops);
  };

  const handleDropFopToGroup = async (fopId: number, targetGroupName: string | null) => {
    await moveFopToGroup(fopId, targetGroupName);
    const updatedFops = await fetchFops();
    setFops(updatedFops);
    if (targetGroupName) {
      showToast(`ФОП успішно переміщено у папку "${targetGroupName}"!`);
    } else {
      showToast(`ФОП відкріплено від папки.`);
    }
  };

  const handleUpdateFolderAndGroup = async (
    fopId: number,
    folderPath: string | null,
    folderGroup: string | null
  ) => {
    try {
      await updateFopFolderAndGroup(fopId, folderPath, folderGroup);
      const updated = await fetchFops();
      setFops(updated);
      showToast("Папку та групу ФОП успішно оновлено!");
    } catch (err: any) {
      console.error("Failed to update folder & group:", err);
      showToast(`Помилка оновлення папки: ${err?.message || String(err)}`);
    }
  };

  const filteredFops = fops
    .filter((fop) => {
      if (selectedGroup !== null) {
        if (selectedGroup === "__NO_GROUP__") {
          if (fop.folder_group && fop.folder_group.trim()) return false;
        } else {
          if (fop.folder_group !== selectedGroup) return false;
        }
      }

      const query = searchQuery.toLowerCase().trim();
      if (!query) return true;

      const fopName = [fop.vezeteknev, fop.keresztnev, fop.apai_nev].filter(Boolean).join(" ").toLowerCase();
      const fopKod = (fop.kod || fop.fop_kod || "").toLowerCase();
      const fopGroup = (fop.folder_group || "").toLowerCase();

      const matchesFop = fopName.includes(query) || fopKod.includes(query) || fopGroup.includes(query);

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

  const handlePickRootFolder = async () => {
    const chosen = await pickRootFolder();
    if (chosen) {
      setRootFolder(chosen);
      saveRootFolder(chosen);
      showToast(`Головну папку збереження встановлено: "${chosen}"`);
    }
  };

  return (
    <div className="w-full max-w-[1600px] mx-auto px-10 py-10 pb-24">
      <Header
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
        onOpenUpdate={() => setIsUpdateModalOpen(true)}
        onGoHome={handleGoHome}
        hasUpdateNotification={hasUpdateNotification}
        availableVersion={availableUpdateInfo?.version}
        hasRootFolder={Boolean(rootFolder && rootFolder.trim().length > 0)}
        onPickFolder={handlePickRootFolder}
      />

      {/* VIEW 1: Document Generator Main View */}
      {activeTab === "generator" && (
        <DocumentGeneratorView
          key={docKey}
          fops={fops}
          selectedFopId={selectedFopId}
          onSelectFop={setSelectedFopId}
          rootFolder={rootFolder}
          onRootFolderChange={setRootFolder}
          minWage={minWage}
          onShowToast={showToast}
          onEditWorker={(w) => setWorkerToEdit(w)}
          onDeleteWorker={(w) => setWorkerToDelete(w)}
          onAddWorker={(fId) => {
            const targetFop = fops.find((f) => f.id === fId) || null;
            setFopForNewWorker(targetFop);
          }}
          onEditFop={(f) => setFopToEdit(f)}
          onUpdateFopList={(updatedList) => setFops(updatedList)}
          folderGroups={folderGroups}
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
              <div className="flex items-center gap-3 flex-wrap">
                <button
                  onClick={() => {
                    setFolderGroupToEdit(null);
                    setIsFolderGroupModalOpen(true);
                  }}
                  className="px-5 py-2.5 rounded-2xl bg-white hover:bg-[#f2f7f6] text-[#133b47] border-2 border-[#cbd8d6] hover:border-[#133b47] font-black text-xs transition-all shadow-xs cursor-pointer flex items-center gap-2 transform hover:-translate-y-0.5"
                >
                  <FolderPlusIcon className="w-4.5 h-4.5 stroke-[2.2] text-[#f8a44c]" />
                  <span>Створити нову папку</span>
                </button>
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

            <div className="flex flex-col gap-6">
              {filteredFops.length === 0 ? (
                <div className="p-10 text-center text-[#59747c] font-bold text-base bg-white rounded-3xl border-2 border-[#c6d7d5] shadow-sm">
                  ФОП за вашим запитом не знайдено.
                </div>
              ) : selectedGroup === null ? (
                <>
                  {/* Categorized Sections */}
                  {folderGroups.map((grp) => {
                    const fopsInGrp = filteredFops.filter((f) => f.folder_group === grp.name);
                    return (
                      <CategorySection
                        key={grp.id}
                        group={grp}
                        fops={fopsInGrp}
                        allGroups={folderGroups}
                        expandedFopIds={expandedFopIds}
                        draggingFopId={draggingFopId}
                        pointerHoveredGroup={pointerDragState.hoveredGroupName}
                        onPointerDragStart={handlePointerDragStart}
                        onToggleExpand={toggleFopExpand}
                        onEditClick={(targetFop) => setFopToEdit(targetFop)}
                        onAddWorkerClick={(targetFop) => setFopForNewWorker(targetFop)}
                        onEditWorkerClick={(targetWorker) => setWorkerToEdit(targetWorker)}
                        onDeleteWorkerClick={(targetWorker) => setWorkerToDelete(targetWorker)}
                        onUpdateFolderAndGroup={handleUpdateFolderAndGroup}
                        onContextMenu={(targetFop, x, y) => setContextMenuState({ isOpen: true, x, y, fop: targetFop })}
                        onDropFop={handleDropFopToGroup}
                        onEditGroup={(g) => {
                          setFolderGroupToEdit(g);
                          setIsFolderGroupModalOpen(true);
                        }}
                        onDeleteGroup={handleDeleteFolderGroup}
                      />
                    );
                  })}

                  {/* Uncategorized Section (FOPs without category) */}
                  <CategorySection
                    group={null}
                    fops={filteredFops.filter((f) => !f.folder_group || !f.folder_group.trim())}
                    allGroups={folderGroups}
                    expandedFopIds={expandedFopIds}
                    draggingFopId={draggingFopId}
                    pointerHoveredGroup={pointerDragState.hoveredGroupName}
                    onPointerDragStart={handlePointerDragStart}
                    onToggleExpand={toggleFopExpand}
                    onEditClick={(targetFop) => setFopToEdit(targetFop)}
                    onAddWorkerClick={(targetFop) => setFopForNewWorker(targetFop)}
                    onEditWorkerClick={(targetWorker) => setWorkerToEdit(targetWorker)}
                    onDeleteWorkerClick={(targetWorker) => setWorkerToDelete(targetWorker)}
                    onUpdateFolderAndGroup={handleUpdateFolderAndGroup}
                    onContextMenu={(targetFop, x, y) => setContextMenuState({ isOpen: true, x, y, fop: targetFop })}
                    onDropFop={handleDropFopToGroup}
                  />
                </>
              ) : selectedGroup === "__NO_GROUP__" ? (
                <CategorySection
                  group={null}
                  fops={filteredFops.filter((f) => !f.folder_group || !f.folder_group.trim())}
                  allGroups={folderGroups}
                  expandedFopIds={expandedFopIds}
                  draggingFopId={draggingFopId}
                  pointerHoveredGroup={pointerDragState.hoveredGroupName}
                  onPointerDragStart={handlePointerDragStart}
                  onToggleExpand={toggleFopExpand}
                  onEditClick={(targetFop) => setFopToEdit(targetFop)}
                  onAddWorkerClick={(targetFop) => setFopForNewWorker(targetFop)}
                  onEditWorkerClick={(targetWorker) => setWorkerToEdit(targetWorker)}
                  onDeleteWorkerClick={(targetWorker) => setWorkerToDelete(targetWorker)}
                  onUpdateFolderAndGroup={handleUpdateFolderAndGroup}
                  onContextMenu={(targetFop, x, y) => setContextMenuState({ isOpen: true, x, y, fop: targetFop })}
                  onDropFop={handleDropFopToGroup}
                />
              ) : (
                (() => {
                  const targetGrp = folderGroups.find((g) => g.name === selectedGroup) || null;
                  return (
                    <CategorySection
                      group={targetGrp}
                      fops={filteredFops.filter((f) => f.folder_group === selectedGroup)}
                      allGroups={folderGroups}
                      expandedFopIds={expandedFopIds}
                      draggingFopId={draggingFopId}
                      pointerHoveredGroup={pointerDragState.hoveredGroupName}
                      onPointerDragStart={handlePointerDragStart}
                      onToggleExpand={toggleFopExpand}
                      onEditClick={(targetFop) => setFopToEdit(targetFop)}
                      onAddWorkerClick={(targetFop) => setFopForNewWorker(targetFop)}
                      onEditWorkerClick={(targetWorker) => setWorkerToEdit(targetWorker)}
                      onDeleteWorkerClick={(targetWorker) => setWorkerToDelete(targetWorker)}
                      onUpdateFolderAndGroup={handleUpdateFolderAndGroup}
                      onContextMenu={(targetFop, x, y) => setContextMenuState({ isOpen: true, x, y, fop: targetFop })}
                      onDropFop={handleDropFopToGroup}
                      onEditGroup={(g) => {
                        setFolderGroupToEdit(g);
                        setIsFolderGroupModalOpen(true);
                      }}
                      onDeleteGroup={handleDeleteFolderGroup}
                    />
                  );
                })()
              )}
            </div>

            {/* Floating Solid Drag Card following mouse cursor */}
            {pointerDragState.isDragging && pointerDragState.fop && (
              <div
                style={{
                  position: "fixed",
                  left: `${pointerDragState.x - pointerDragState.offsetX}px`,
                  top: `${pointerDragState.y - pointerDragState.offsetY}px`,
                  width: `${pointerDragState.width}px`,
                  pointerEvents: "none",
                  zIndex: 99999999,
                  transform: "rotate(1.5deg) scale(1.02)",
                  boxShadow: "0 25px 50px -12px rgba(19, 59, 71, 0.45)",
                  transition: "transform 0.1s ease-out",
                }}
                className="bg-white/95 backdrop-blur-md rounded-[28px] border-2 border-[#133b47] overflow-hidden select-none ring-4 ring-[#f8a44c]/30 p-6 flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-13 h-13 rounded-2xl bg-[#133b47] text-[#f8a44c] flex items-center justify-center font-black text-xl shadow-md shrink-0">
                    {pointerDragState.fop.vezeteknev.charAt(0)}
                  </div>
                  <div className="flex flex-col gap-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="font-black text-lg text-[#133b47] font-heading tracking-tight">
                        {[pointerDragState.fop.vezeteknev, pointerDragState.fop.keresztnev, pointerDragState.fop.apai_nev].filter(Boolean).join(" ")}
                      </span>
                      {pointerDragState.fop.kod && (
                        <span className="px-3 py-0.5 rounded-full text-xs font-black bg-[#f8a44c] text-[#133b47] shadow-xs">
                          {pointerDragState.fop.kod}
                        </span>
                      )}
                    </div>
                    <span className="text-xs font-extrabold text-[#607d85]">
                      Перетягніть у потрібну папку та відпустіть
                    </span>
                  </div>
                </div>
              </div>
            )}
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

      <FolderGroupModal
        isOpen={isFolderGroupModalOpen}
        editingGroup={folderGroupToEdit}
        onClose={() => {
          setIsFolderGroupModalOpen(false);
          setFolderGroupToEdit(null);
        }}
        onSubmit={handleCreateOrUpdateFolderGroup}
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
        initialUpdateInfo={availableUpdateInfo}
        onUpdateProcessed={() => {
          setHasUpdateNotification(false);
          setAvailableUpdateInfo(null);
        }}
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

      {contextMenuState.isOpen && contextMenuState.fop && (
        <FopContextMenu
          x={contextMenuState.x}
          y={contextMenuState.y}
          fop={contextMenuState.fop}
          groups={folderGroups}
          onClose={() => setContextMenuState({ isOpen: false, x: 0, y: 0, fop: null })}
          onSelectGroup={handleDropFopToGroup}
          onEditFop={(f) => setFopToEdit(f)}
          onAddWorker={(f) => setFopForNewWorker(f)}
          onPickFolder={async (f) => {
            const chosen = await pickFopFolder();
            if (chosen) {
              await handleUpdateFolderAndGroup(f.id, chosen, f.folder_group || null);
            }
          }}
          onOpenExplorer={(path) => openFolderInExplorer(path)}
          onDeleteFop={(f) => setFopToDelete(f)}
        />
      )}

      {toastMessage && <ToastNotice message={toastMessage} />}
    </div>
  );
}
