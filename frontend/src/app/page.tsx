'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { apiService } from '@/services/api.service';
import type { IDirectory, IFile } from '@/types';
import Link from 'next/link';
import {
    Folder,
    FileText,
    Upload,
    FolderPlus,
    Trash2,
    Edit3,
    Download,
    ExternalLink,
    ChevronRight,
    Home,
    HardDrive,
    Loader2,
    AlertCircle,
    CheckCircle2,
    X,
    ArrowUpRight,
} from 'lucide-react';

interface BreadcrumbItem {
    id?: string;
    name: string;
}

function formatBytes(bytes: number): string {
    if (!bytes || bytes <= 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

export default function DriveHomePage() {
    const { user, isLoading: authLoading } = useAuth();

    const [currentDir, setCurrentDir] = useState<IDirectory | null>(null);
    const [directories, setDirectories] = useState<IDirectory[]>([]);
    const [files, setFiles] = useState<IFile[]>([]);
    const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([{ name: 'My Drive' }]);

    const [storageUsage, setStorageUsage] = useState<{ usedBytes: number; maxBytes: number }>({
        usedBytes: 0,
        maxBytes: 1024 ** 3,
    });

    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [toast, setToast] = useState<string | null>(null);

    // Upload state
    const [uploading, setUploading] = useState<boolean>(false);
    const [uploadProgress, setUploadProgress] = useState<number>(0);
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    // Modals state
    const [showCreateDirModal, setShowCreateDirModal] = useState<boolean>(false);
    const [newDirName, setNewDirName] = useState<string>('');

    const [renameTarget, setRenameTarget] = useState<{
        type: 'file' | 'directory';
        id: string;
        currentName: string;
    } | null>(null);
    const [renameValue, setRenameValue] = useState<string>('');

    const showNotification = (msg: string) => {
        setToast(msg);
        setTimeout(() => setToast(null), 3500);
    };

    const loadDirectory = useCallback(async (dirId?: string) => {
        try {
            setLoading(true);
            setError(null);
            const [dirRes, usageRes] = await Promise.all([
                apiService.getDirectoryContents(dirId),
                apiService.getStorageUsage().catch(() => null),
            ]);

            if (dirRes.success && dirRes.data) {
                setCurrentDir(dirRes.data.directory);
                setDirectories(dirRes.data.directories || []);
                setFiles(dirRes.data.files || []);
            }

            if (usageRes?.success && usageRes.data) {
                setStorageUsage(usageRes.data);
            }
        } catch (err: any) {
            setError(err.message || 'Failed to load directory contents');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (user) {
            loadDirectory( undefined );
        }
    }, [user, loadDirectory]);

    const handleNavigateToFolder = (dir: IDirectory) => {
        setBreadcrumbs((prev) => [...prev, { id: dir._id, name: dir.name }]);
        loadDirectory(dir._id);
    };

    const handleBreadcrumbClick = (index: number) => {
        const target = breadcrumbs[index];
        setBreadcrumbs((prev) => prev.slice(0, index + 1));
        loadDirectory(target.id);
    };

    const handleCreateDirectory = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newDirName.trim()) return;

        try {
            await apiService.createDirectory(newDirName.trim(), currentDir?._id || null);
            setNewDirName('');
            setShowCreateDirModal(false);
            showNotification('Folder created successfully');
            loadDirectory(breadcrumbs[breadcrumbs.length - 1]?.id);
        } catch (err: any) {
            setError(err.message || 'Failed to create folder');
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            setUploading(true);
            setUploadProgress(0);
            setError(null);

            await apiService.uploadFileWithProgress(
                file,
                currentDir?._id || null,
                (percent) => setUploadProgress(percent),
            );

            showNotification(`Uploaded "${file.name}" successfully`);
            loadDirectory(breadcrumbs[breadcrumbs.length - 1]?.id);
        } catch (err: any) {
            setError(err.message || 'File upload failed');
        } finally {
            setUploading(false);
            setUploadProgress(0);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const handleRenameSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!renameTarget || !renameValue.trim()) return;

        try {
            if (renameTarget.type === 'directory') {
                await apiService.renameDirectory(renameTarget.id, renameValue.trim());
                showNotification('Folder renamed');
            } else {
                await apiService.renameFile(renameTarget.id, renameValue.trim());
                showNotification('File renamed');
            }
            setRenameTarget(null);
            setRenameValue('');
            loadDirectory(breadcrumbs[breadcrumbs.length - 1]?.id);
        } catch (err: any) {
            setError(err.message || 'Rename failed');
        }
    };

    const handleDeleteDirectory = async (dir: IDirectory) => {
        if (!confirm(`Delete folder "${dir.name}" and all its contents?`)) return;
        try {
            await apiService.deleteDirectory(dir._id);
            showNotification(`Folder "${dir.name}" deleted`);
            loadDirectory(breadcrumbs[breadcrumbs.length - 1]?.id);
        } catch (err: any) {
            setError(err.message || 'Failed to delete folder');
        }
    };

    const handleDeleteFile = async (file: IFile) => {
        if (!confirm(`Delete file "${file.name}"?`)) return;
        try {
            await apiService.deleteFile(file._id);
            showNotification(`File "${file.name}" deleted`);
            loadDirectory(breadcrumbs[breadcrumbs.length - 1]?.id);
        } catch (err: any) {
            setError(err.message || 'Failed to delete file');
        }
    };

    if (authLoading) {
        return (
            <div className="flex min-h-[80vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
            </div>
        );
    }

    // Unauthenticated Landing View
    if (!user) {
        return (
            <div className="relative overflow-hidden py-20 px-4">
                <div className="mx-auto max-w-4xl text-center">
                    <span className="inline-flex items-center gap-2 rounded-full border border-brand-500/30 bg-brand-500/10 px-4 py-1.5 text-xs font-semibold text-brand-400 mb-6">
                        <HardDrive className="h-3.5 w-3.5" />
                        Next-Gen Cloud Storage Platform
                    </span>
                    <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-fg mb-6">
                        Store, Manage &amp; Scale Your Files with{' '}
                        <span className="bg-gradient-to-r from-brand-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
                            DevDrive
                        </span>
                    </h1>
                    <p className="mx-auto max-w-2xl text-lg text-fg-muted mb-10">
                        Built with a modular TypeScript architecture, Redis-backed sessions, OAuth 2.0,
                        Role-Based Access Control, and seamless Stripe &amp; Razorpay subscriptions.
                    </p>
                    <div className="flex flex-wrap items-center justify-center gap-4">
                        <Link
                            href="/register"
                            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-brand-600 px-7 py-3.5 text-base font-semibold text-fg shadow-lg shadow-brand-500/25 hover:from-brand-500 hover:to-brand-500 transition-all"
                        >
                            Create Free Account
                            <ArrowUpRight className="h-5 w-5" />
                        </Link>
                        <Link
                            href="/login"
                            className="rounded-xl border border-line-strong bg-surface px-7 py-3.5 text-base font-semibold text-fg hover:bg-surface-raised transition-colors"
                        >
                            Sign In to Drive
                        </Link>
                        <Link
                            href="/pricing"
                            className="rounded-xl border border-line bg-surface/50 px-7 py-3.5 text-base font-semibold text-fg-muted hover:text-fg transition-colors"
                        >
                            View Plans
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    const usagePercent = Math.min(
        100,
        Math.round((storageUsage.usedBytes / (storageUsage.maxBytes || 1)) * 100),
    );

    return (
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
            {/* Toast Notification */}
            {toast && (
                <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-xl border border-success-500/40 bg-surface/95 px-4 py-3 text-sm font-medium text-success-400 shadow-2xl">
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    <span>{toast}</span>
                </div>
            )}

            {/* Top Bar: Storage Quota & Actions */}
            <div className="mb-8 flex flex-col gap-4 rounded-2xl border border-line bg-surface/60 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex-1 max-w-md">
                    <div className="flex items-center justify-between text-xs font-medium text-fg-muted mb-2">
                        <span className="flex items-center gap-1.5 text-fg font-semibold">
                            <HardDrive className="h-4 w-4 text-brand-400" />
                            Storage Quota
                        </span>
                        <span>
                            {formatBytes(storageUsage.usedBytes)} / {formatBytes(storageUsage.maxBytes)} ({usagePercent}%)
                        </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-surface-raised">
                        <div
                            className="h-full rounded-full bg-gradient-to-r from-brand-500 to-brand-500 transition-all duration-300"
                            style={{ width: `${usagePercent}%` }}
                        />
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <button
                        onClick={() => setShowCreateDirModal(true)}
                        className="flex items-center gap-2 rounded-xl border border-line-strong bg-surface-raised/90 px-4 py-2.5 text-sm font-semibold text-fg hover:bg-surface-hover transition-colors cursor-pointer"
                    >
                        <FolderPlus className="h-4 w-4 text-brand-400" />
                        New Folder
                    </button>

                    <label className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-brand-600 px-4 py-2.5 text-sm font-semibold text-fg shadow-md shadow-brand-600/20 hover:from-brand-500 hover:to-brand-500 transition-all cursor-pointer">
                        <Upload className="h-4 w-4" />
                        <span>{uploading ? `Uploading ${uploadProgress}%` : 'Upload File'}</span>
                        <input
                            ref={fileInputRef}
                            type="file"
                            className="hidden"
                            onChange={handleFileUpload}
                            disabled={uploading}
                        />
                    </label>
                </div>
            </div>

            {/* Upload Progress Bar */}
            {uploading && (
                <div className="mb-6 rounded-xl border border-brand-500/30 bg-brand-500/10 p-4">
                    <div className="flex items-center justify-between text-xs font-semibold text-brand-300 mb-2">
                        <span>Uploading file to DevDrive...</span>
                        <span>{uploadProgress}%</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-surface-raised">
                        <div
                            className="h-full bg-brand-500 transition-all duration-150"
                            style={{ width: `${uploadProgress}%` }}
                        />
                    </div>
                </div>
            )}

            {/* Error Banner */}
            {error && (
                <div className="mb-6 flex items-center justify-between rounded-xl border border-danger-500/40 bg-danger-500/10 px-4 py-3 text-sm text-danger-300">
                    <div className="flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 shrink-0 text-danger-400" />
                        <span>{error}</span>
                    </div>
                    <button onClick={() => setError(null)} className="text-danger-400 hover:text-fg">
                        <X className="h-4 w-4" />
                    </button>
                </div>
            )}

            {/* Breadcrumbs */}
            <nav className="mb-6 flex items-center gap-1.5 overflow-x-auto text-sm font-medium text-fg-muted">
                {breadcrumbs.map((crumb, idx) => (
                    <React.Fragment key={idx}>
                        {idx > 0 && <ChevronRight className="h-4 w-4 shrink-0 text-fg-subtle" />}
                        <button
                            onClick={() => handleBreadcrumbClick(idx)}
                            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 transition-colors cursor-pointer ${
                                idx === breadcrumbs.length - 1
                                    ? 'bg-surface-raised text-fg font-semibold'
                                    : 'hover:bg-surface hover:text-fg'
                            }`}
                        >
                            {idx === 0 && <Home className="h-3.5 w-3.5 text-brand-400" />}
                            <span>{crumb.name}</span>
                        </button>
                    </React.Fragment>
                ))}
            </nav>

            {loading ? (
                <div className="flex min-h-[40vh] items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
                </div>
            ) : (
                <>
                    {/* Folders Section */}
                    <section className="mb-10">
                        <h2 className="mb-4 text-xs font-bold uppercase tracking-wider text-fg-muted">
                            Folders ({directories.length})
                        </h2>
                        {directories.length === 0 ? (
                            <div className="rounded-xl border border-dashed border-line p-6 text-center text-sm text-fg-muted">
                                No subfolders in this directory.
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                                {directories.map((dir) => (
                                    <div
                                        key={dir._id}
                                        className="group flex items-center justify-between rounded-xl border border-line bg-surface/70 p-4 hover:border-brand-500/40 hover:bg-surface transition-all"
                                    >
                                        <button
                                            onClick={() => handleNavigateToFolder(dir)}
                                            className="flex flex-1 items-center gap-3 text-left overflow-hidden cursor-pointer"
                                        >
                                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-500/10 text-brand-400">
                                                <Folder className="h-5 w-5 fill-blue-400/20" />
                                            </div>
                                            <div className="truncate">
                                                <p className="truncate text-sm font-semibold text-fg group-hover:text-brand-400 transition-colors">
                                                    {dir.name}
                                                </p>
                                                <p className="text-xs text-fg-muted">
                                                    {formatBytes(dir.size || 0)}
                                                </p>
                                            </div>
                                        </button>

                                        <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100">
                                            <button
                                                onClick={() => {
                                                    setRenameTarget({
                                                        type: 'directory',
                                                        id: dir._id,
                                                        currentName: dir.name,
                                                    });
                                                    setRenameValue(dir.name);
                                                }}
                                                title="Rename Folder"
                                                className="rounded-lg p-1.5 text-fg-muted hover:bg-surface-raised hover:text-fg cursor-pointer"
                                            >
                                                <Edit3 className="h-4 w-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteDirectory(dir)}
                                                title="Delete Folder"
                                                className="rounded-lg p-1.5 text-fg-muted hover:bg-danger-500/15 hover:text-danger-400 cursor-pointer"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>

                    {/* Files Section */}
                    <section>
                        <h2 className="mb-4 text-xs font-bold uppercase tracking-wider text-fg-muted">
                            Files ({files.length})
                        </h2>
                        {files.length === 0 ? (
                            <div className="rounded-xl border border-dashed border-line p-10 text-center text-sm text-fg-muted">
                                No files uploaded in this folder yet. Click &ldquo;Upload File&rdquo; above to add files.
                            </div>
                        ) : (
                            <div className="overflow-hidden rounded-xl border border-line bg-surface/60">
                                <table className="w-full text-left text-sm">
                                    <thead className="border-b border-line bg-surface/90 text-xs uppercase text-fg-muted">
                                        <tr>
                                            <th className="px-4 py-3.5">File Name</th>
                                            <th className="px-4 py-3.5">Size</th>
                                            <th className="px-4 py-3.5 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-line/70">
                                        {files.map((file) => (
                                            <tr
                                                key={file._id}
                                                className="hover:bg-surface-raised/40 transition-colors"
                                            >
                                                <td className="px-4 py-3 font-medium text-fg">
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-500/10 text-brand-400">
                                                            <FileText className="h-4 w-4" />
                                                        </div>
                                                        <span className="truncate max-w-xs sm:max-w-md">
                                                            {file.name}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-fg-muted">
                                                    {formatBytes(file.size)}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <a
                                                            href={apiService.getFileUrl(file._id, 'open')}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            title="Open / Preview"
                                                            className="rounded-lg border border-line-strong bg-surface-raised px-2.5 py-1.5 text-xs font-medium text-fg hover:bg-surface-hover flex items-center gap-1"
                                                        >
                                                            <ExternalLink className="h-3.5 w-3.5" />
                                                            Open
                                                        </a>
                                                        <a
                                                            href={apiService.getFileUrl(file._id, 'download')}
                                                            title="Download File"
                                                            className="rounded-lg border border-brand-500/30 bg-brand-500/10 px-2.5 py-1.5 text-xs font-medium text-brand-400 hover:bg-brand-500/20 flex items-center gap-1"
                                                        >
                                                            <Download className="h-3.5 w-3.5" />
                                                            Download
                                                        </a>
                                                        <button
                                                            onClick={() => {
                                                                setRenameTarget({
                                                                    type: 'file',
                                                                    id: file._id,
                                                                    currentName: file.name,
                                                                });
                                                                setRenameValue(file.name);
                                                            }}
                                                            title="Rename File"
                                                            className="rounded-lg p-1.5 text-fg-muted hover:bg-surface-raised hover:text-fg cursor-pointer"
                                                        >
                                                            <Edit3 className="h-4 w-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteFile(file)}
                                                            title="Delete File"
                                                            className="rounded-lg p-1.5 text-fg-muted hover:bg-danger-500/15 hover:text-danger-400 cursor-pointer"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </section>
                </>
            )}

            {/* Create Folder Modal */}
            {showCreateDirModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs">
                    <div className="w-full max-w-md rounded-2xl border border-line bg-surface p-6 shadow-2xl">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-fg">Create New Folder</h3>
                            <button
                                onClick={() => setShowCreateDirModal(false)}
                                className="text-fg-muted hover:text-fg"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <form onSubmit={handleCreateDirectory} className="space-y-4">
                            <input
                                type="text"
                                placeholder="Enter folder name..."
                                value={newDirName}
                                onChange={(e) => setNewDirName(e.target.value)}
                                autoFocus
                                required
                                className="w-full rounded-xl border border-line-strong bg-canvas px-4 py-2.5 text-sm text-fg focus:border-brand-500 focus:outline-none"
                            />
                            <div className="flex justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateDirModal(false)}
                                    className="rounded-xl border border-line-strong px-4 py-2 text-sm font-medium text-fg hover:bg-surface-raised"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="rounded-xl bg-brand-600 px-5 py-2 text-sm font-semibold text-fg hover:bg-brand-500"
                                >
                                    Create
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Rename Modal */}
            {renameTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs">
                    <div className="w-full max-w-md rounded-2xl border border-line bg-surface p-6 shadow-2xl">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-fg">
                                Rename {renameTarget.type === 'directory' ? 'Folder' : 'File'}
                            </h3>
                            <button
                                onClick={() => setRenameTarget(null)}
                                className="text-fg-muted hover:text-fg"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <form onSubmit={handleRenameSubmit} className="space-y-4">
                            <input
                                type="text"
                                value={renameValue}
                                onChange={(e) => setRenameValue(e.target.value)}
                                autoFocus
                                required
                                className="w-full rounded-xl border border-line-strong bg-canvas px-4 py-2.5 text-sm text-fg focus:border-brand-500 focus:outline-none"
                            />
                            <div className="flex justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => setRenameTarget(null)}
                                    className="rounded-xl border border-line-strong px-4 py-2 text-sm font-medium text-fg hover:bg-surface-raised"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="rounded-xl bg-brand-600 px-5 py-2 text-sm font-semibold text-fg hover:bg-brand-500"
                                >
                                    Save Changes
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
