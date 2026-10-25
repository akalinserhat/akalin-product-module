/**
 * Webakus ERP - Ürün Yönetimi Excel'den Veri Al (ExcelImportPage) Sayfası / Bileşeni.
 * BaseCardPage standart şablonundan türetilmiştir.
 * Projenin BaseCardPage mimarisine ve MD3 tasarım standartlarına tam uyumludur.
 * Seçili Excel dosyasını bulut depolamaya kaydetme opsiyonunu BaseSwitch ile sunar.
 */

import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { 
    FileSpreadsheet, 
    Upload, 
    Cloud, 
    Sparkles, 
    AlertCircle, 
    FolderUp, 
    FolderPlus,
    RefreshCw, 
    CheckCircle2,
    FileCheck,
    Layers,
    ExternalLink,
    HardDrive,
    FolderTree,
    FolderClosed
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import * as XLSX from 'xlsx';
import axios from 'axios';
import { 
    BaseCardPage, 
    Card, 
    BaseSwitch, 
    TabLayout, 
    DateInput, 
    CancelButton, 
    FilesOnClouds, 
    type FilesOnCloudsHandle,
    type ActionMenuItem,
    useModulGate 
} from '@akalin/ui';

export interface ExcelColumnDef {
    key: string;
    label: string;
    type: 'column' | 'select' | 'date';
    expectedType?: 'number' | 'string' | 'date';
    options?: { value: string, label: string }[];
    defaultValue?: any;
    visibleIf?: { key: string, value: any };
    required?: boolean;
}

export interface ExcelImportPageProps {
    isOpen?: boolean;
    onClose?: () => void;
    onImport: (data: any[]) => void;
    documentId?: number;
    documentGuid?: string;
    documentType?: string;
    documentNo?: string;
    columns: ExcelColumnDef[];
    isModal?: boolean;
    asPage?: boolean;
}

// Geriye dönük uyumluluk için alias
export type ExcelImportModalProps = ExcelImportPageProps;

export interface ExcelSheet {
    name: string;
    isActive: boolean;
    data: any[][];
    maxCols: number;
    validColumns: number[];
    mapping: Record<string, any>;
}

function escapeHtml(str: any): string {
    if (str == null) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

export const openExcelInNewTab = (
    fileName: string, 
    sheets: ExcelSheet[], 
    defaultSheetName?: string,
    tFunc?: (key: string, fallback: string) => string
): Window | null => {
    if (!sheets || sheets.length === 0) return null;

    const translate = tFunc || ((_k: string, fallback: string) => fallback);
    const activeSheetName = defaultSheetName || sheets[0]?.name || '';

    const sheetsHtml = sheets.map((sheet, sIdx) => {
        const isCurrent = sheet.name === activeSheetName || (!defaultSheetName && sIdx === 0);
        const colIndices = sheet.validColumns && sheet.validColumns.length > 0 
            ? sheet.validColumns 
            : (sheet.data.length > 0 ? Array.from({ length: sheet.maxCols || (sheet.data[0] as any[])?.length || 1 }, (_, i) => i) : []);

        const headerColsHtml = colIndices.map(cIdx => {
            const colLetter = XLSX.utils.encode_col(cIdx);
            return `<th class="col-letter">${colLetter}</th>`;
        }).join('');

        const tableRowsHtml = sheet.data.map((row, rIdx) => {
            const rowArray = (row || []) as any[];
            const cellsHtml = colIndices.map(cIdx => {
                const val = rowArray[cIdx];
                const displayVal = val != null ? String(val) : '';
                return `<td>${escapeHtml(displayVal)}</td>`;
            }).join('');

            return `<tr><th class="row-num">${rIdx + 1}</th>${cellsHtml}</tr>`;
        }).join('');

        return `
            <div id="sheet_container_${sIdx}" class="sheet-container ${isCurrent ? 'active' : ''}" style="display: ${isCurrent ? 'flex' : 'none'};">
                <div class="sheet-stats">
                    <span>${translate('Sayfa', 'Sayfa')}: <strong>${escapeHtml(sheet.name)}</strong></span>
                    <span>${translate('Satır', 'Satır')}: <strong>${sheet.data.length}</strong></span>
                    <span>${translate('Sütun', 'Sütun')}: <strong>${colIndices.length}</strong></span>
                </div>
                <div class="table-scroll-wrapper">
                    <table class="excel-table">
                        <thead>
                            <tr>
                                <th class="row-num-header">#</th>
                                ${headerColsHtml}
                            </tr>
                        </thead>
                        <tbody>
                            ${tableRowsHtml}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }).join('');

    const tabsHtml = sheets.length > 1 ? `
        <div class="tabs-bar">
            ${sheets.map((sheet, sIdx) => {
                const isCurrent = sheet.name === activeSheetName || (!defaultSheetName && sIdx === 0);
                return `
                    <button 
                        id="tab_btn_${sIdx}" 
                        class="tab-btn ${isCurrent ? 'active' : ''}" 
                        onclick="switchSheet(${sIdx})"
                    >
                        📄 ${escapeHtml(sheet.name)} (${sheet.data.length})
                    </button>
                `;
            }).join('')}
        </div>
    ` : '';

    const htmlDoc = `<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapeHtml(fileName)} - Webakus Excel Önizleme</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <style>
        :root {
            --primary: #2563eb;
            --primary-dark: #1d4ed8;
            --surface: #ffffff;
            --bg: #f8fafc;
            --border: #e2e8f0;
            --text-primary: #0f172a;
            --text-secondary: #64748b;
            --header-bg: #f1f5f9;
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            background-color: var(--bg);
            color: var(--text-primary);
            height: 100vh;
            display: flex;
            flex-direction: column;
            overflow: hidden;
        }
        .top-navbar {
            background: var(--surface);
            border-bottom: 1px solid var(--border);
            padding: 10px 20px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 16px;
            flex-shrink: 0;
            box-shadow: 0 1px 3px rgba(0,0,0,0.05);
        }
        .file-info {
            display: flex;
            align-items: center;
            gap: 12px;
            min-width: 0;
        }
        .file-icon {
            width: 36px;
            height: 36px;
            background: #ecfdf5;
            color: #059669;
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 18px;
            flex-shrink: 0;
        }
        .file-title-wrap {
            display: flex;
            flex-direction: column;
            overflow: hidden;
        }
        .file-name {
            font-size: 15px;
            font-weight: 700;
            color: var(--text-primary);
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
        .file-meta {
            font-size: 12px;
            color: var(--text-secondary);
        }
        .nav-actions {
            display: flex;
            align-items: center;
            gap: 12px;
            flex-shrink: 0;
        }
        .search-box {
            position: relative;
            display: flex;
            align-items: center;
        }
        .search-input {
            padding: 8px 12px 8px 32px;
            font-size: 13px;
            border: 1px solid var(--border);
            border-radius: 8px;
            outline: none;
            width: 240px;
            transition: all 0.2s;
            background: var(--bg);
        }
        .search-input:focus {
            border-color: var(--primary);
            width: 300px;
            background: #fff;
            box-shadow: 0 0 0 3px rgba(37,99,235,0.12);
        }
        .search-icon {
            position: absolute;
            left: 10px;
            color: var(--text-secondary);
            font-size: 13px;
            pointer-events: none;
        }
        .btn {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 8px 14px;
            font-size: 13px;
            font-weight: 500;
            border-radius: 8px;
            cursor: pointer;
            border: 1px solid var(--border);
            background: var(--surface);
            color: var(--text-primary);
            transition: background 0.15s;
        }
        .btn:hover { background: #f1f5f9; }
        .tabs-bar {
            background: #f1f5f9;
            border-bottom: 1px solid var(--border);
            padding: 6px 20px 0 20px;
            display: flex;
            gap: 4px;
            overflow-x: auto;
            flex-shrink: 0;
        }
        .tab-btn {
            padding: 8px 16px;
            font-size: 13px;
            font-weight: 500;
            color: var(--text-secondary);
            background: transparent;
            border: none;
            border-bottom: 2px solid transparent;
            cursor: pointer;
            border-radius: 6px 6px 0 0;
            transition: all 0.15s;
            white-space: nowrap;
        }
        .tab-btn:hover {
            color: var(--text-primary);
            background: rgba(255,255,255,0.5);
        }
        .tab-btn.active {
            color: var(--primary);
            background: var(--surface);
            font-weight: 600;
            border-bottom-color: var(--primary);
        }
        .main-content {
            flex: 1;
            overflow: hidden;
            display: flex;
            flex-direction: column;
            position: relative;
        }
        .sheet-container {
            height: 100%;
            display: flex;
            flex-direction: column;
        }
        .sheet-stats {
            padding: 8px 20px;
            font-size: 12px;
            color: var(--text-secondary);
            background: var(--surface);
            border-bottom: 1px solid var(--border);
            display: flex;
            gap: 20px;
            align-items: center;
            flex-shrink: 0;
        }
        .table-scroll-wrapper {
            flex: 1;
            overflow: auto;
            background: var(--surface);
        }
        .excel-table {
            border-collapse: separate;
            border-spacing: 0;
            width: 100%;
            font-size: 13px;
            table-layout: auto;
        }
        .excel-table th, .excel-table td {
            border-right: 1px solid var(--border);
            border-bottom: 1px solid var(--border);
            padding: 6px 10px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            max-width: 320px;
        }
        .excel-table thead th {
            position: sticky;
            top: 0;
            background: var(--header-bg);
            color: var(--text-secondary);
            font-weight: 600;
            font-size: 11px;
            text-align: center;
            z-index: 2;
            letter-spacing: 0.5px;
        }
        .excel-table thead th.col-letter {
            min-width: 100px;
        }
        .excel-table tbody th.row-num {
            position: sticky;
            left: 0;
            background: var(--header-bg);
            color: var(--text-secondary);
            font-weight: 500;
            font-size: 11px;
            width: 48px;
            min-width: 48px;
            max-width: 48px;
            text-align: center;
            z-index: 1;
        }
        .excel-table thead th.row-num-header {
            position: sticky;
            top: 0;
            left: 0;
            width: 48px;
            min-width: 48px;
            max-width: 48px;
            z-index: 4;
            background: #e2e8f0;
            color: var(--text-secondary);
        }
        .excel-table tbody tr:nth-child(even) td {
            background-color: #fafbfc;
        }
        .excel-table tbody tr:hover td {
            background-color: #eff6ff !important;
        }
        .excel-table tbody tr:hover th.row-num {
            background-color: #dbeafe !important;
            color: var(--primary);
        }
    </style>
</head>
<body>
    <header class="top-navbar">
        <div class="file-info">
            <div class="file-icon">📊</div>
            <div class="file-title-wrap">
                <span class="file-name">${escapeHtml(fileName)}</span>
                <span class="file-meta">${sheets.length} ${translate('Sayfa', 'Sayfa')} • Webakus ERP</span>
            </div>
        </div>
        <div class="nav-actions">
            <div class="search-box">
                <span class="search-icon">🔍</span>
                <input 
                    type="text" 
                    id="tableSearch" 
                    class="search-input" 
                    placeholder="${translate('ExcelImport_searchPlaceholder', 'Tabloda ara...')}" 
                    oninput="filterCurrentTable(this.value)"
                />
            </div>
            <span id="matchCountBadge" style="font-size: 12px; color: var(--text-secondary);"></span>
            <button class="btn" onclick="window.print()">🖨️ ${translate('Yazdır', 'Yazdır')}</button>
        </div>
    </header>

    ${tabsHtml}

    <main class="main-content">
        ${sheetsHtml}
    </main>

    <script>
        function switchSheet(sIdx) {
            document.querySelectorAll('.sheet-container').forEach(el => {
                el.style.display = 'none';
                el.classList.remove('active');
            });
            document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));
            
            const targetSheet = document.getElementById('sheet_container_' + sIdx);
            const targetBtn = document.getElementById('tab_btn_' + sIdx);
            if (targetSheet) {
                targetSheet.style.display = 'flex';
                targetSheet.classList.add('active');
            }
            if (targetBtn) {
                targetBtn.classList.add('active');
            }

            const searchInput = document.getElementById('tableSearch');
            if (searchInput && searchInput.value) {
                searchInput.value = '';
                filterCurrentTable('');
            }
        }

        function filterCurrentTable(query) {
            const q = (query || '').trim().toLowerCase();
            const activeSheet = document.querySelector('.sheet-container.active') || document.querySelector('.sheet-container[style*="display: flex"]');
            if (!activeSheet) return;

            const rows = activeSheet.querySelectorAll('tbody tr');
            let matched = 0;

            rows.forEach(row => {
                if (!q) {
                    row.style.display = '';
                    matched++;
                } else {
                    const text = row.textContent.toLowerCase();
                    if (text.includes(q)) {
                        row.style.display = '';
                        matched++;
                    } else {
                        row.style.display = 'none';
                    }
                }
            });

            const badge = document.getElementById('matchCountBadge');
            if (badge) {
                badge.textContent = q ? ('(' + matched + ' satır eşleşti)') : '';
            }
        }
    </script>
</body>
</html>`;

    const blob = new Blob([htmlDoc], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    return window.open(url, '_blank');
};

const ExcelImportPage: React.FC<ExcelImportPageProps> = ({ 
    isOpen = true, 
    onClose, 
    onImport, 
    documentId, 
    documentGuid, 
    documentType, 
    documentNo,
    columns,
    isModal = true,
    asPage = false
}) => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const location = useLocation();
    const { isActive: modulGateActive } = useModulGate('MOD_BULUT_DEPOLAMA');
    const isBulutActive = Boolean(modulGateActive);

    const isExcelImportRoute = location.pathname.endsWith('/excel-import');
    const isEffectivelyOpen = Boolean(isOpen) || isExcelImportRoute;
    const isModalMode = Boolean(isModal) && !asPage;

    const effectiveDocumentType = documentType || location.state?.documentType;
    const effectiveDocumentNo = documentNo || location.state?.documentNo;
    const effectiveDocumentId = documentId || location.state?.documentId;
    const effectiveDocumentGuid = documentGuid || location.state?.documentGuid;

    // Dosya ve veri durumları
    const [file, setFile] = useState<{ name: string; size?: number } | null>(null);
    const [selectedRawFile, setSelectedRawFile] = useState<File | null>(null);
    const [isCloudSource, setIsCloudSource] = useState(false);
    const [sheets, setSheets] = useState<ExcelSheet[]>([]);
    const [activeTab, setActiveTab] = useState<string>('');
    const [fileSourceTab, setFileSourceTab] = useState<'local' | 'cloud'>('local');
    const [cloudShowFolders, setCloudShowFolders] = useState<boolean>(false);
    
    // İşlem durumları
    const [isAiMatching, setIsAiMatching] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    
    // Bulut'a gönderme seçeneği (Bulut modülü pasif ise kapalı ve disabled kalır)
    const [sendToCloud, setSendToCloud] = useState<boolean>(true);

    const localFileInputRef = useRef<HTMLInputElement>(null);
    const filesOnCloudsRef = useRef<FilesOnCloudsHandle>(null);

    const handleClose = useCallback(() => {
        setFile(null);
        setSelectedRawFile(null);
        setIsCloudSource(false);
        setSheets([]);
        setActiveTab('');
        setIsDragging(false);
        setIsImporting(false);
        if (location.pathname.endsWith('/excel-import')) {
            const parentPath = location.pathname.replace(/\/excel-import$/, '');
            navigate(parentPath, {
                state: {
                    ...location.state
                }
            });
        }
        if (onClose) {
            onClose();
        }
    }, [location.pathname, location.state, navigate, onClose]);

    // Escape tuşu ile kapatma
    useEffect(() => {
        if (!isEffectivelyOpen) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                e.stopPropagation();
                handleClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isEffectivelyOpen, handleClose]);

    // Yerel dosya okuma ve işleme
    const processExcelWorkbook = useCallback((wb: XLSX.WorkBook, fileName: string, rawFile?: File) => {
        const parsedSheets: ExcelSheet[] = [];
        
        for (const sheetName of wb.SheetNames) {
            const ws = wb.Sheets[sheetName];
            if (ws['!ref']) {
                const range = XLSX.utils.decode_range(ws['!ref']);
                range.s.c = 0;
                range.s.r = 0;
                ws['!ref'] = XLSX.utils.encode_range(range);
            }
            const data = XLSX.utils.sheet_to_json<any[]>(ws, { header: 1 });
            
            if (data.length > 0) {
                const maxCols = Math.max(...data.map(row => (row as any[])?.length || 0), 0);
                
                const nonEmptyCols = new Set<number>();
                for (let i = 0; i < Math.min(data.length, 100); i++) {
                    const row = data[i] as any[];
                    if (row) {
                        for (let c = 0; c < row.length; c++) {
                            if (row[c] !== undefined && row[c] !== null && String(row[c]).trim() !== '') {
                                nonEmptyCols.add(c);
                            }
                        }
                    }
                }
                const validColumns = Array.from(nonEmptyCols).sort((a, b) => a - b);
                
                const initialMapping: Record<string, any> = {};
                columns?.forEach(col => {
                    initialMapping[col.key] = col.defaultValue !== undefined ? col.defaultValue : '';
                });

                parsedSheets.push({
                    name: sheetName,
                    isActive: parsedSheets.length === 0, // İlk sayfa varsayılan aktif
                    data: data,
                    maxCols: maxCols,
                    validColumns: validColumns,
                    mapping: initialMapping
                });
            }
        }
        
        if (parsedSheets.length > 0) {
            setSheets(parsedSheets);
            setActiveTab(parsedSheets[0].name);
            setFile({ name: fileName, size: rawFile?.size });
            if (rawFile) {
                setSelectedRawFile(rawFile);
                setIsCloudSource(false);
            }

            // Seçilen Excel dosyasını tarayıcının yeni sekmesinde otomatik aç
            try {
                const win = openExcelInNewTab(fileName, parsedSheets, parsedSheets[0].name, t);
                if (win && !win.closed && typeof win.closed !== 'undefined') {
                    toast.success(t('ExcelImport_openedInNewTab', 'Excel dosyası yeni sekmede açıldı.'));
                }
            } catch (err) {
                console.warn('Auto open in new tab failed:', err);
            }
        } else {
            toast.error(t('ExcelImport_emptyWorkbook', 'Excel dosyasındaki tüm sayfalar boş görünüyor.'));
        }
    }, [columns, t]);

    const handleOpenInNewTab = useCallback(() => {
        if (!sheets || sheets.length === 0) {
            toast.error(t('ExcelImport_noDataToPreview', 'Önizlenecek sayfa verisi bulunamadı.'));
            return;
        }
        const win = openExcelInNewTab(file?.name || 'excel_data.xlsx', sheets, activeTab, t);
        if (!win || win.closed || typeof win.closed === 'undefined') {
            toast.error(t('ExcelImport_popupBlockedNotice', "Tarayıcınız yeni sekmeyi engelledi. Lütfen 'Yeni Sekmede Aç' butonuna tıklayın."));
        } else {
            toast.success(t('ExcelImport_openedInNewTab', 'Excel dosyası yeni sekmede açıldı.'));
        }
    }, [file?.name, sheets, activeTab, t]);

    const handleLocalFileSelect = useCallback((selectedFile: File) => {
        if (!selectedFile) return;

        const ext = selectedFile.name.split('.').pop()?.toLowerCase();
        if (!['xlsx', 'xls', 'csv'].includes(ext || '')) {
            toast.error(t('ExcelImport_invalidFileExt', 'Lütfen geçerli bir Excel (.xlsx, .xls) veya CSV dosyası seçin.'));
            return;
        }

        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                const bstr = evt.target?.result;
                const wb = XLSX.read(bstr, { type: 'binary', cellDates: true });
                processExcelWorkbook(wb, selectedFile.name, selectedFile);
            } catch (error) {
                console.error('Local Excel read error:', error);
                toast.error(t('ExcelImport_fileReadError', 'Excel dosyası okunurken bir hata oluştu.'));
            }
        };
        reader.readAsBinaryString(selectedFile);
    }, [processExcelWorkbook, t]);

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleLocalFileSelect(e.dataTransfer.files[0]);
        }
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        if (!isDragging) setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    // Buluttan seçilen dosyayı indirip işleme
    const handleCloudFileSelect = async (cloudFile: any) => {
        if (!cloudFile) return;

        if (cloudFile.localFile) {
            handleLocalFileSelect(cloudFile.localFile);
            return;
        }

        const fileName = cloudFile.dosyaAdi || cloudFile.ad || cloudFile.name || '';
        const ext = fileName.split('.').pop()?.toLowerCase();
        if (!['xlsx', 'xls', 'csv'].includes(ext || '')) {
            toast.error(t('ExcelImport_invalidFileExt', 'Lütfen geçerli bir Excel (.xlsx, .xls) veya CSV dosyası seçin.'));
            return;
        }

        const fileId = cloudFile.id || cloudFile.Id;
        if (!fileId) {
            toast.error(t('ExcelImport_invalidCloudFileId', 'Seçilen bulut dosyasının kimliği bulunamadı.'));
            return;
        }

        const toastId = toast.loading(t('ExcelImport_downloading', 'Bulut dosyası indiriliyor...'));
        try {
            const response = await axios.get(`/api/Storage/Download/${fileId}`, { 
                responseType: 'arraybuffer' 
            });
            const data = new Uint8Array(response.data);
            const wb = XLSX.read(data, { type: 'array', cellDates: true });
            setIsCloudSource(true);
            setSelectedRawFile(null);
            processExcelWorkbook(wb, fileName);
            toast.dismiss(toastId);
        } catch (error: any) {
            console.error('Download/Read Error:', error);
            toast.dismiss(toastId);
            const serverMsg = error.response?.data?.message || (typeof error.response?.data === 'string' ? error.response.data : null);
            toast.error(serverMsg || error.message || t('ExcelImport_fileReadError', 'Excel dosyası okunurken bir hata oluştu.'));
        }
    };

    const updateSheet = (sheetName: string, updates: Partial<ExcelSheet>) => {
        setSheets(prev => prev.map(s => s.name === sheetName ? { ...s, ...updates } : s));
    };

    const updateMapping = (sheetName: string, field: string, value: string) => {
        setSheets(prev => prev.map(s => {
            if (s.name === sheetName) {
                return {
                    ...s,
                    isActive: true,
                    mapping: { ...s.mapping, [field]: value }
                };
            }
            return s;
        }));
    };

    // ✨ Yapay Zeka (AI) Otomatik Sütun Eşleştirme
    const handleAiAutoMatch = async () => {
        const currentSheet = sheets.find(s => s.name === activeTab);
        if (!currentSheet || currentSheet.data.length === 0) {
            toast.error(t('ExcelImport_noValidData', 'Eşleştirilecek veri veya sayfa bulunamadı.'));
            return;
        }

        setIsAiMatching(true);
        const toastId = toast.loading(t('ExcelImport_aiMatching', 'Yapay zeka sütun başlıklarını ve verileri analiz ediyor...'));

        try {
            const excelKolonlari = currentSheet.validColumns.map(i => {
                const headerValue = currentSheet.data.length > 0 && currentSheet.data[0][i] !== undefined && currentSheet.data[0][i] !== null
                    ? String(currentSheet.data[0][i]).trim()
                    : `${t('ExcelImport_columnPrefix', 'Sütun')} ${XLSX.utils.encode_col(i)}`;
                return { index: i, baslik: headerValue };
            });

            const hedefAlanlar = columns.map(c => ({
                key: c.key,
                label: c.label,
                expectedType: c.expectedType || (c.type === 'date' ? 'date' : 'string'),
                required: Boolean(c.required)
            }));

            // İlk 4 satırı örnek olarak gönder
            const ornekSatirlar = currentSheet.data.slice(0, 4).map(row => 
                currentSheet.validColumns.map(colIdx => row?.[colIdx] != null ? String(row[colIdx]) : '')
            );

            const payload = {
                belgeTuru: effectiveDocumentType || 'Belge',
                hedefAlanlar,
                excelKolonlari,
                ornekSatirlar
            };

            const response = await axios.post('/api/AiAjanlar/excel-kolon-esle', payload);
            toast.dismiss(toastId);

            if (response.data?.basarili && response.data?.eslesmeler) {
                const eslesmeler: Record<string, number | null> = response.data.eslesmeler;
                let matchCount = 0;

                setSheets(prev => prev.map(s => {
                    if (s.name === activeTab) {
                        const newMapping = { ...s.mapping };
                        Object.entries(eslesmeler).forEach(([fieldKey, colIdx]) => {
                            if (colIdx !== null && colIdx !== undefined) {
                                newMapping[fieldKey] = String(colIdx);
                                matchCount++;
                            }
                        });
                        return {
                            ...s,
                            isActive: true,
                            mapping: newMapping
                        };
                    }
                    return s;
                }));

                if (matchCount > 0) {
                    toast.success(t('ExcelImport_aiMatchSuccess', 'Sütunlar yapay zeka ile otomatik eşleştirildi.'));
                } else {
                    toast(t('ExcelImport_aiMatchNotFound', 'Eşleştirilecek sütun bulunamadı.'));
                }
            } else {
                toast.error(response.data?.aciklama || t('ExcelImport_aiMatchError', 'Yapay zeka eşleştirme hatası'));
            }
        } catch (error: any) {
            toast.dismiss(toastId);
            const msg = error.response?.data?.mesaj || error.message || t('ExcelImport_aiMatchError', 'Yapay zeka eşleştirme hatası');
            toast.error(msg);
        } finally {
            setIsAiMatching(false);
        }
    };

    // İçeri Aktarma İşlemi
    const handleImport = async () => {
        const activeSheets = sheets.filter(s => s.isActive);
        if (activeSheets.length === 0) {
            toast.error(t('ExcelImport_noActiveSheet', 'Lütfen aktarılacak en az bir sayfa (sheet) seçin veya sütun eşleştirmesi yapın.'));
            return;
        }

        const mappedData: any[] = [];
        
        for (const sheet of activeSheets) {
            const missingRequired = columns.filter(col => {
                if (col.visibleIf && sheet.mapping[col.visibleIf.key] !== col.visibleIf.value) return false;
                return col.required && (sheet.mapping[col.key] === '' || sheet.mapping[col.key] == null);
            });

            if (missingRequired.length > 0) {
                const missingLabels = missingRequired.map(c => c.label).join(', ');
                toast.error(t('ExcelImport_missingRequired', 'Lütfen zorunlu alanları eşleştirin: ') + missingLabels + ` (${sheet.name})`);
                return;
            }

            sheet.data.forEach((row) => {
                const rowArray = row as any[];
                let rowData: any = {};
                let hasMappedColumnData = false;

                columns.forEach(col => {
                    if (col.visibleIf && sheet.mapping[col.visibleIf.key] !== col.visibleIf.value) return;

                    let rawValue = sheet.mapping[col.key];

                    if (col.type === 'column') {
                        const colIndex = rawValue !== '' ? parseInt(rawValue) : -1;
                        let cellValue = colIndex >= 0 ? rowArray[colIndex] : null;
                        
                        if (cellValue != null && String(cellValue).trim() !== '') {
                            hasMappedColumnData = true;
                        }

                        if (col.expectedType === 'number') {
                            let parsedNum: number | null = null;
                            if (cellValue != null && String(cellValue).trim() !== '') {
                                if (typeof cellValue === 'number') {
                                    parsedNum = cellValue;
                                } else if (!(cellValue instanceof Date)) {
                                    let s = String(cellValue).trim();
                                    s = s.replace(/[^\d.,-]/g, '');
                                    if (/^-?[\d.,]+$/.test(s)) {
                                        if (s.includes('.') && s.includes(',')) {
                                            s = s.replace(/\./g, '').replace(',', '.');
                                        } else if (s.includes(',')) {
                                            s = s.replace(',', '.');
                                        } else if ((s.match(/\./g) || []).length > 1) {
                                            if (/^-?\d{1,3}(\.\d{3})+$/.test(s)) {
                                                s = s.replace(/\./g, '');
                                            }
                                        }
                                        const n = Number(s);
                                        if (!isNaN(n)) parsedNum = n;
                                    }
                                }
                            }
                            rowData[col.key] = parsedNum;
                        } else if (col.expectedType === 'date') {
                            let parsedDate = '';
                            if (cellValue != null) {
                                if (cellValue instanceof Date) {
                                    const d = new Date(cellValue.getTime() - (cellValue.getTimezoneOffset() * 60000));
                                    parsedDate = d.toISOString().split('T')[0];
                                } else {
                                    parsedDate = String(cellValue).trim();
                                }
                            }
                            rowData[col.key] = parsedDate;
                        } else {
                            rowData[col.key] = cellValue != null ? String(cellValue).trim() : '';
                        }
                    } else if (col.type === 'select' || col.type === 'date') {
                        rowData[col.key] = rawValue;
                    }
                });

                if (hasMappedColumnData) {
                    mappedData.push(rowData);
                }
            });
        }

        if (mappedData.length === 0) {
            toast.error(t('ExcelImport_noValidData', 'Aktarılacak geçerli veri bulunamadı. Lütfen zorunlu alanların dolu olduğundan emin olun.'));
            return;
        }

        setIsImporting(true);

        // Bulut depolama seçeneği aktifse seçili Excel dosyasını bulut'a yükle
        if (isBulutActive && sendToCloud && selectedRawFile) {
            try {
                const formData = new FormData();
                if (effectiveDocumentType) formData.append('belgeTuru', effectiveDocumentType);
                if (effectiveDocumentId) formData.append('belgeId', effectiveDocumentId.toString());
                if (effectiveDocumentGuid) formData.append('belgeGuid', effectiveDocumentGuid);
                if (effectiveDocumentNo) formData.append('belgeNo', effectiveDocumentNo);
                formData.append('dosya', selectedRawFile);

                await axios.post('/api/Storage/Upload', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                toast.success(t('ExcelImport_cloudUploadSuccess', 'Excel dosyası bulut depolamaya başarıyla kaydedildi.'));
            } catch (cloudErr) {
                console.error('Cloud auto-upload error:', cloudErr);
                toast.error(t('ExcelImport_cloudUploadError', 'Dosya içeri aktarıldı ancak bulut depolamaya yüklenirken bir hata oluştu.'));
            }
        }

        setIsImporting(false);
        onImport(mappedData);
        handleClose();
    };

    const sendToCloudAction = useMemo<ActionMenuItem>(() => {
        const isEffectiveChecked = isBulutActive && sendToCloud && !isCloudSource;
        return {
            label: t('Buluta_Kaydet', 'Buluta Kaydet'),
            icon: <Cloud size={16} className={isEffectiveChecked ? "text-primary" : "text-secondary"} />,
            isDefault: true,
            default: true,
            variant: isEffectiveChecked ? 'primary' : 'default',
            disabled: !isBulutActive || isCloudSource,
            title: isCloudSource 
                ? t('ExcelImport_alreadyOnCloud', 'Zaten Bulutta') 
                : (!isBulutActive 
                    ? t('ExcelImport_moduleDisabled', 'Modül Pasif') 
                    : t('Buluta_Kaydet', 'Buluta Kaydet')),
            onClick: () => {
                if (!isCloudSource && isBulutActive) {
                    setSendToCloud(prev => !prev);
                }
            },
            badge: (
                <span className={`badge ${isEffectiveChecked ? 'badge-primary' : 'badge-neutral'} text-11`}>
                    {isEffectiveChecked ? t('Aktif', 'Aktif') : t('Pasif', 'Pasif')}
                </span>
            ),
            custom: (
                <div title={isCloudSource ? t('ExcelImport_alreadyOnCloud', 'Zaten Bulutta') : undefined}>
                    <BaseSwitch
                        id="excelImportSendToCloudSwitch_actionMenu"
                        checked={isEffectiveChecked}
                        disabled={!isBulutActive || isCloudSource}
                        onChange={(e) => setSendToCloud(e.target.checked)}
                        label={
                            <span className="flex items-center gap-8">
                                <Cloud size={15} className={isEffectiveChecked ? "text-primary" : "text-secondary"} />
                                <span>{t('Buluta_Kaydet', 'Buluta Kaydet')}</span>
                            </span>
                        }
                        className="action-menu-switch-item"
                    />
                </div>
            ),
            dividerAbove: true
        };
    }, [isBulutActive, sendToCloud, isCloudSource, t]);

    const activeTabActions = useMemo<ActionMenuItem[]>(() => {
        if (fileSourceTab === 'cloud') {
            return [
                {
                    label: cloudShowFolders 
                        ? t('Klasorleri_Gizle', 'Klasörleri Gizle') 
                        : t('Klasorleri_Goster', 'Klasörleri Göster'),
                    icon: cloudShowFolders ? <FolderClosed size={16} /> : <FolderTree size={16} />,
                    isDefault: true,
                    default: true,
                    variant: cloudShowFolders ? 'primary' : 'default',
                    onClick: () => setCloudShowFolders(prev => !prev),
                    title: cloudShowFolders 
                        ? t('Klasorleri_Gizle', 'Klasörleri Gizle') 
                        : t('Klasorleri_Goster', 'Klasörleri Göster')
                }
            ];
        }

        return [
            ...(isBulutActive ? [sendToCloudAction] : []),
            {
                label: t('ExcelImport_chooseFileBtn', 'Dosya Seç'),
                icon: <Upload size={16} />,
                onClick: () => localFileInputRef.current?.click()
            }
        ];
    }, [fileSourceTab, cloudShowFolders, isBulutActive, sendToCloudAction, t]);

    const cardExtraActions = useMemo<ActionMenuItem[]>(() => {
        if (!file) return [];
        return [
            {
                label: t('ExcelImport_openInNewTab', 'Yeni Sekmede Aç'),
                icon: <ExternalLink size={16} />,
                onClick: handleOpenInNewTab
            },
            {
                label: t('ExcelImport_changeFile', 'Başka Dosya Seç'),
                icon: <RefreshCw size={16} />,
                onClick: () => {
                    setFile(null);
                    setSelectedRawFile(null);
                    setIsCloudSource(false);
                }
            },
            ...(isBulutActive ? [{
                ...sendToCloudAction,
                isDefault: false,
                default: false
            }] : [])
        ];
    }, [file, handleOpenInNewTab, isBulutActive, sendToCloudAction, t]);

    if (isModalMode && !isEffectivelyOpen) {
        return null;
    }

    const activeSheetData = sheets.find(s => s.name === activeTab);

    const subtitleText = file
        ? `${file.name} • ${sheets.reduce((acc, s) => acc + s.data.length, 0)} ${t('satır', 'satır')}`
        : (effectiveDocumentNo 
            ? `${t('Belge No')}: ${effectiveDocumentNo}`
            : (effectiveDocumentType 
                ? `${t('Belge')}: ${t(effectiveDocumentType)}` 
                : t('ExcelImport_subtitle', 'Excel dosyasından veri aktarımı ve sütun eşleştirme')));

    const subtitleBadge = file ? (
        <div className="flex items-center gap-8">
            <span className="badge badge-primary font-medium">{sheets.length} {t('Sayfa', 'Sayfa')}</span>
            {isCloudSource ? (
                <span className="badge badge-info flex items-center gap-4 text-11">
                    <Cloud size={12} /> {t('ExcelImport_sourceCloud', 'Bulut Dosyası')}
                </span>
            ) : (
                <span className="badge badge-neutral flex items-center gap-4 text-11">
                    <Upload size={12} /> {t('ExcelImport_sourceLocal', 'Yerel Dosya')}
                </span>
            )}
        </div>
    ) : (effectiveDocumentType ? t(effectiveDocumentType) : undefined);

    const cardContent = (
        <BaseCardPage
            id="excelImportCardPage"
            icon={<FileSpreadsheet size={20} />}
            title={t('ExcelImport_title', "Excel'den Veri Al")}
            subtitleLeft={subtitleText}
            subtitleRight={subtitleBadge}
            showBackButton={true}
            onClose={handleClose}
            onBack={handleClose}
            hideSaveButton={!file}
            saveButtonText={t('ExcelImport_importButton', 'İçeri Aktar')}
            onSave={handleImport}
            isSaving={isImporting}
            extraDropdownActions={cardExtraActions}
            footerExtra={<CancelButton onClick={handleClose} />}
            asForm={false}
            className="excel-import-card-page"
            headerExtra={
                file ? (
                    <div className="flex items-center gap-8">
                        <button
                            type="button"
                            className="btn btn-secondary btn-sm flex items-center gap-6"
                            onClick={handleOpenInNewTab}
                            title={t('ExcelImport_openInNewTabTitle', 'Excel dosyasını yeni sekmede görüntüleyin')}
                        >
                            <ExternalLink size={14} />
                            <span>{t('ExcelImport_openInNewTab', 'Yeni Sekmede Aç')}</span>
                        </button>
                        <button
                            type="button"
                            className="btn btn-secondary btn-sm flex items-center gap-6"
                            onClick={() => {
                                setFile(null);
                                setSelectedRawFile(null);
                                setIsCloudSource(false);
                            }}
                        >
                            <RefreshCw size={14} />
                            <span>{t('ExcelImport_changeFile', 'Başka Dosya Seç')}</span>
                        </button>
                    </div>
                ) : undefined
            }
        >
            <div className="excel-import-content">
                {/* 1. Dosya Seçilmemişse: Dosya Yükleme / Bulut Seçim Bölümü */}
                {!file ? (
                    <div className="excel-upload-section">
                        <div className="flex items-center gap-12 pb-16 border-b border-glass">
                            <div className="icon-box-md rounded-10 bg-primary-light text-primary flex items-center justify-center">
                                <FolderUp size={20} />
                            </div>
                            <div className="flex flex-col">
                                <h3 className="m-0 text-16 font-bold text-primary">
                                    {t('ExcelImport_chooseFileCardTitle', 'İçeri Aktarılacak Excel Dosyasını Belirleyin')}
                                </h3>
                                <span className="text-12 text-secondary mt-2">
                                    {t('ExcelImport_dropzoneSub', 'Desteklenen dosya formatları: .xlsx, .xls, .csv')}
                                </span>
                            </div>
                        </div>

                        <div className="flex flex-col gap-16">
                            {isBulutActive && (
                                <TabLayout
                                    tabs={[
                                        { id: 'local', label: t('ExcelImport_tabLocal', 'Bilgisayarımdan Yükle'), icon: <Upload size={16} /> },
                                        { id: 'cloud', label: t('ExcelImport_tabCloud', 'Bulut Dosyalarımdan Seç'), icon: <Cloud size={16} /> }
                                    ]}
                                    activeTabId={fileSourceTab}
                                    onChange={(tabId) => setFileSourceTab(tabId as 'local' | 'cloud')}
                                    actions={activeTabActions}
                                    actionMenuProps={{ showDefaultActionAsButton: true }}
                                />
                            )}

                            {fileSourceTab === 'local' ? (
                                <div className="flex flex-col gap-16">
                                    <input
                                        type="file"
                                        ref={localFileInputRef}
                                        accept=".xlsx, .xls, .csv"
                                        className="hidden"
                                        onChange={(e) => {
                                            if (e.target.files && e.target.files[0]) {
                                                handleLocalFileSelect(e.target.files[0]);
                                            }
                                        }}
                                    />

                                    <div
                                        className={`ai-file-dropzone cursor-pointer ${isDragging ? 'active' : ''}`}
                                        onClick={() => localFileInputRef.current?.click()}
                                        onDragOver={handleDragOver}
                                        onDragLeave={handleDragLeave}
                                        onDrop={handleDrop}
                                    >
                                        <div className="ai-file-dropzone-icon">
                                            <FileSpreadsheet size={32} />
                                        </div>
                                        <span className="font-semibold text-15 text-primary mb-4">
                                            {t('ExcelImport_dropzoneTitle', 'Excel Dosyası Seçin veya Sürükleyip Bırakın')}
                                        </span>
                                        <span className="text-12 text-secondary mb-16">
                                            {t('ExcelImport_dropzoneSub', 'Desteklenen dosya formatları: .xlsx, .xls, .csv')}
                                        </span>
                                        <button
                                            type="button"
                                            className="btn btn-primary btn-sm flex items-center gap-6 pointer-events-none"
                                        >
                                            <FolderUp size={15} />
                                            <span>{t('ExcelImport_chooseFileBtn', 'Dosya Seç')}</span>
                                        </button>
                                    </div>

                                    <div className="flex flex-row items-center gap-8 p-12 rounded-8 bg-tertiary border border-glass text-13 text-secondary">
                                        <AlertCircle size={16} className="shrink-0 text-primary" />
                                        <span>{t('ExcelImport_headerNotice', 'Excel tablonuzun ilk satırının sütun başlıklarını içerdiğinden emin olun.')}</span>
                                    </div>
                                </div>
                            ) : (
                                <div className="min-h-420 h-480 flex flex-col border border-glass rounded-12 p-8 overflow-hidden bg-surface">
                                    <FilesOnClouds 
                                        ref={filesOnCloudsRef}
                                        isOpen={true} 
                                        isModal={false}
                                        showFolderTree={cloudShowFolders}
                                        isAttachedOnly={!cloudShowFolders}
                                        onAttachedOnlyChange={(val) => setCloudShowFolders(!val)}
                                        isSelectMode={true}
                                        hideToolbarActions={true}
                                        documentId={effectiveDocumentId}
                                        documentGuid={effectiveDocumentGuid}
                                        documentType={effectiveDocumentType}
                                        documentNo={effectiveDocumentNo}
                                        onSelectFile={handleCloudFileSelect}
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    /* 2. Dosya Seçilmişse: Sayfa ve Sütun Eşleştirme Kartı */
                    sheets.length > 0 && (
                        <div className="excel-mapping-card">
                            {/* Section Header */}
                            <div className="flex items-center justify-between pb-16 border-b border-glass flex-wrap gap-12">
                                <div className="flex items-center gap-12">
                                    <div className="icon-box-md rounded-10 bg-primary-light text-primary flex items-center justify-center">
                                        <Layers size={20} />
                                    </div>
                                    <div className="flex flex-col">
                                        <div className="flex items-center gap-8">
                                            <h3 className="m-0 text-16 font-bold text-primary">
                                                {t('ExcelImport_sheetsAndMappingTitle', 'Sayfa ve Sütun Eşleştirme')}
                                            </h3>
                                            <span className="badge badge-primary text-11 font-medium">
                                                {sheets.length} {t('Sayfa', 'Sayfa')}
                                            </span>
                                        </div>
                                        <span className="text-12 text-secondary mt-2">
                                            {t('ExcelImport_sheetsAndMappingDesc', 'İçe aktarmak istediğiniz sayfaları seçin ve sütun eşleştirmelerini tanımlayın.')}
                                        </span>
                                    </div>
                                </div>

                                {activeSheetData && (
                                    <div className="flex items-center gap-12">
                                        <button
                                            type="button"
                                            className="btn btn-primary-outline btn-sm flex items-center gap-6"
                                            onClick={handleAiAutoMatch}
                                            disabled={isAiMatching}
                                            title={t('ExcelImport_aiAutoMatch', 'Yapay Zeka ile Otomatik Eşleştir')}
                                        >
                                            <Sparkles size={14} className={isAiMatching ? 'animate-spin text-accent' : 'text-accent'} />
                                            <span className="font-medium">
                                                {isAiMatching 
                                                    ? t('ExcelImport_aiMatching', 'Eşleştiriliyor...') 
                                                    : t('ExcelImport_aiAutoMatch', 'Yapay Zeka ile Otomatik Eşleştir')
                                                }
                                            </span>
                                        </button>
                                        <span className="badge badge-neutral text-12 font-medium">
                                            {activeSheetData.data.length} {t('satır', 'satır')}
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Sheet Tabs */}
                            {sheets.length > 1 && (
                                <div className="excel-sheet-tabs-wrapper">
                                    <TabLayout 
                                        tabs={sheets.map(s => ({
                                            id: s.name,
                                            name: s.name,
                                            label: s.name,
                                            icon: s.isActive ? <CheckCircle2 size={14} className="text-success" /> : null
                                        }))}
                                        activeTabId={activeTab}
                                        onChange={(tabId: string | number) => setActiveTab(tabId as string)}
                                    />
                                </div>
                            )}

                            {/* Active Sheet Mapping Body */}
                            {activeSheetData && (
                                <div className="flex flex-col gap-16">
                                    <div className="flex items-center justify-between p-16 rounded-12 bg-tertiary border border-glass">
                                        <BaseSwitch
                                            id={`sheetActiveSwitch_${activeSheetData.name}`}
                                            checked={activeSheetData.isActive}
                                            onChange={(e) => updateSheet(activeSheetData.name, { isActive: e.target.checked })}
                                            label={
                                                <div className="flex items-center gap-8">
                                                    <span className="font-semibold text-14 text-primary">
                                                        {t('ExcelImport_importThisSheet', 'Bu Sayfayı (Sheet) İçeri Aktar')}
                                                    </span>
                                                    <span className="text-13 text-secondary font-medium">
                                                        ({activeSheetData.name})
                                                    </span>
                                                </div>
                                            }
                                        />
                                        <div className="flex items-center gap-8 text-12 text-secondary font-medium">
                                            <span className="badge badge-neutral">
                                                {activeSheetData.validColumns.length} {t('ExcelImport_detectedColumns', 'dolu sütun tespit edildi')}
                                            </span>
                                        </div>
                                    </div>

                                    {activeSheetData.isActive ? (
                                        <div className="form-grid gap-20">
                                            {columns.map(col => {
                                                if (col.visibleIf) {
                                                    const dependsOnValue = activeSheetData.mapping[col.visibleIf.key];
                                                    if (dependsOnValue !== col.visibleIf.value) return null;
                                                }
                                                
                                                const isMapped = Boolean(activeSheetData.mapping[col.key]);

                                                return (
                                                    <div className="form-group flex flex-col gap-6" key={col.key}>
                                                        <label className="form-field-label excel-mapping-label font-semibold text-13 text-primary">
                                                            <span>
                                                                {col.label} {col.required && <span className="text-danger">*</span>}
                                                            </span>
                                                            {isMapped && (
                                                                <span className="excel-mapping-badge">
                                                                    <CheckCircle2 size={12} /> {t('ExcelImport_mapped', 'Eşleştirildi')}
                                                                </span>
                                                            )}
                                                        </label>
                                                        {col.type === 'column' && (
                                                            <select 
                                                                className="form-input excel-mapping-select" 
                                                                value={activeSheetData.mapping[col.key] || ''}
                                                                onChange={(e) => updateMapping(activeSheetData.name, col.key, e.target.value)}
                                                            >
                                                                <option value="">{t('ExcelImport_selectColPlaceholder', 'Seçiniz...')}</option>
                                                                {activeSheetData.validColumns.map(i => {
                                                                    const headerLabel = (activeSheetData.data.length > 0 && activeSheetData.data[0][i] !== undefined && activeSheetData.data[0][i] !== null && String(activeSheetData.data[0][i]).trim() !== '')
                                                                        ? ` (${String(activeSheetData.data[0][i]).substring(0, 30)})` 
                                                                        : '';
                                                                    return (
                                                                        <option key={i} value={i}>
                                                                            {t('ExcelImport_columnPrefix', 'Sütun')} {XLSX.utils.encode_col(i)}{headerLabel}
                                                                        </option>
                                                                    );
                                                                })}
                                                            </select>
                                                        )}
                                                        {col.type === 'select' && (
                                                            <select 
                                                                className="form-input excel-mapping-select" 
                                                                value={activeSheetData.mapping[col.key] || ''}
                                                                onChange={(e) => updateMapping(activeSheetData.name, col.key, e.target.value)}
                                                            >
                                                                {col.options?.map(opt => (
                                                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                                                ))}
                                                            </select>
                                                        )}
                                                        {col.type === 'date' && (
                                                            <DateInput 
                                                                className="form-input excel-mapping-select"
                                                                value={activeSheetData.mapping[col.key] || ''}
                                                                onChange={(e: any) => updateMapping(activeSheetData.name, col.key, typeof e === 'string' ? e : e?.target?.value || '')}
                                                                placeholder={t('Tarih Seçiniz', 'Tarih Seçiniz')}
                                                            />
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <div className="p-16 rounded-10 bg-tertiary text-secondary text-13 text-center border border-glass">
                                            {t('ExcelImport_sheetDisabledNotice', 'Bu sayfa içeri aktarılmayacak olarak işaretlendi.')}
                                        </div>
                                    )}

                                    <div className="flex flex-row items-center gap-10 p-14 rounded-10 bg-tertiary border border-glass text-13 text-secondary">
                                        <AlertCircle size={18} className="shrink-0 text-primary" />
                                        <span>{t('ExcelImport_invalidRowsNotice', 'Kod veya Fiyat bilgisi tutarsız olan satırlar (Örn: Boş, 0, Metin) içeri aktarım sırasında yoksayılacaktır.')}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    )
                )}
            </div>
        </BaseCardPage>
    );

    if (isModalMode) {
        const contentArea = typeof document !== 'undefined' ? (document.querySelector('.content-area') as HTMLElement) : null;
        if (contentArea && getComputedStyle(contentArea).position === 'static') {
            contentArea.style.position = 'relative';
        }

        const modalElement = (
            <div className="excel-import-modal-wrapper">
                {cardContent}
            </div>
        );

        if (contentArea) {
            return createPortal(modalElement, contentArea);
        }
        return modalElement;
    }

    return cardContent;
};

export default ExcelImportPage;
export { ExcelImportPage as ExcelImportModal };
