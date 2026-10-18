import type {
    ApiResponse,
    BillingCycle,
    DirectoryContents,
    IDirectory,
    IFile,
    IPlan,
    ISubscription,
    IUser,
    PaymentProvider,
    PaymentType,
    UserRole,
} from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export class ApiService {
    public readonly baseUrl: string;

    constructor(baseUrl: string = API_BASE_URL) {
        this.baseUrl = baseUrl;
    }

    private async request<T>(path: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
        const res = await fetch(`${this.baseUrl}${path}`, {
            ...options,
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                ...(options.headers || {}),
            },
        });

        const data = await res.json().catch(() => ({
            success: false,
            message: `HTTP error ${res.status}`,
        }));

        if (!res.ok) {
            throw new Error(data.message || `Request failed with status ${res.status}`);
        }

        return data as ApiResponse<T>;
    }

    // ── Auth & OAuth (/api/auth/*) ───────────────────────────────────────────

    async loginWithGoogle(idToken: string): Promise<ApiResponse<IUser>> {
        return this.request<IUser>('/auth/google', {
            method: 'POST',
            body: JSON.stringify({ idToken }),
        });
    }

    getGithubOAuthUrl(): string {
        return `${this.baseUrl}/auth/github`;
    }

    async setSessionCookie(sessionId: string): Promise<ApiResponse> {
        return this.request('/auth/set-cookie', {
            method: 'POST',
            body: JSON.stringify({ sessionId }),
        });
    }

    // ── Users & Admin (/api/users/*) ─────────────────────────────────────────

    async register(payload: { name: string; email: string; password: string }): Promise<ApiResponse<IUser>> {
        return this.request<IUser>('/users/register', {
            method: 'POST',
            body: JSON.stringify(payload),
        });
    }

    async login(payload: { email: string; password: string }): Promise<ApiResponse<IUser>> {
        return this.request<IUser>('/users/login', {
            method: 'POST',
            body: JSON.stringify(payload),
        });
    }

    async logout(): Promise<ApiResponse> {
        return this.request('/users/logout', { method: 'POST' });
    }

    async logoutAllDevices(): Promise<ApiResponse> {
        return this.request('/users/logout/all-devices', { method: 'POST' });
    }

    async getProfile(): Promise<ApiResponse<IUser>> {
        return this.request<IUser>('/users/profile', { method: 'GET' });
    }

    async setPassword(password: string): Promise<ApiResponse> {
        return this.request('/users/set-password', {
            method: 'POST',
            body: JSON.stringify({ password }),
        });
    }

    async getAllUsers(): Promise<ApiResponse<IUser[]>> {
        return this.request<IUser[]>('/users/admin/all');
    }

    async getActiveUsers(): Promise<ApiResponse<IUser[]>> {
        return this.request<IUser[]>('/users/admin/active');
    }

    async getDisabledUsers(): Promise<ApiResponse<IUser[]>> {
        return this.request<IUser[]>('/users/admin/disabled');
    }

    async softDeleteUser(userId: string): Promise<ApiResponse<IUser>> {
        return this.request<IUser>(`/users/admin/${userId}`, { method: 'DELETE' });
    }

    async hardDeleteUser(userId: string): Promise<ApiResponse> {
        return this.request(`/users/admin/${userId}/hard`, { method: 'DELETE' });
    }

    async recoverUser(userId: string): Promise<ApiResponse<IUser>> {
        return this.request<IUser>(`/users/admin/${userId}/recover`, { method: 'PATCH' });
    }

    async updateUserRole(userId: string, role: UserRole): Promise<ApiResponse<IUser>> {
        return this.request<IUser>(`/users/admin/${userId}/role`, {
            method: 'PATCH',
            body: JSON.stringify({ role }),
        });
    }

    // ── OTP (/api/otp/*) ─────────────────────────────────────────────────────

    async sendOtp(email: string): Promise<ApiResponse> {
        return this.request('/otp/send-otp', {
            method: 'POST',
            body: JSON.stringify({ email }),
        });
    }

    async verifyOtp(email: string, otp: string): Promise<ApiResponse> {
        return this.request('/otp/verify-otp', {
            method: 'POST',
            body: JSON.stringify({ email, otp }),
        });
    }

    // ── Directories (/api/directory/*) ───────────────────────────────────────

    async getDirectoryContents(dirId?: string): Promise<ApiResponse<DirectoryContents>> {
        const endpoint = dirId ? `/directory/${dirId}` : '/directory';
        return this.request<DirectoryContents>(endpoint);
    }

    async createDirectory(name: string, parentDirId?: string | null): Promise<ApiResponse<IDirectory>> {
        return this.request<IDirectory>('/directory', {
            method: 'POST',
            body: JSON.stringify({ name, parentDirId: parentDirId || null }),
        });
    }

    async renameDirectory(dirId: string, name: string): Promise<ApiResponse<IDirectory>> {
        return this.request<IDirectory>(`/directory/${dirId}`, {
            method: 'PATCH',
            body: JSON.stringify({ name }),
        });
    }

    async deleteDirectory(dirId: string): Promise<ApiResponse<{ deletedDirectories: number; deletedFiles: number }>> {
        return this.request<{ deletedDirectories: number; deletedFiles: number }>(`/directory/${dirId}`, {
            method: 'DELETE',
        });
    }

    // ── Files (/api/files/*) ─────────────────────────────────────────────────

    getFileUrl(fileId: string, action?: 'download' | 'open'): string {
        const query = action === 'download' ? '?action=download' : '';
        return `${this.baseUrl}/files/${fileId}${query}`;
    }

    async getStorageUsage(): Promise<ApiResponse<{ usedBytes: number; maxBytes: number }>> {
        return this.request<{ usedBytes: number; maxBytes: number }>('/files/storage/usage');
    }

    uploadFileWithProgress(
        file: File,
        parentDirId: string | null,
        onProgress?: (percent: number) => void,
    ): Promise<ApiResponse<IFile>> {
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.withCredentials = true;
            xhr.open('POST', `${this.baseUrl}/files/upload-stream/${encodeURIComponent(file.name)}`, true);

            if (parentDirId) {
                xhr.setRequestHeader('parentdirid', parentDirId);
            }

            if (onProgress) {
                xhr.upload.addEventListener('progress', (event) => {
                    if (event.lengthComputable) {
                        const percent = Math.round((event.loaded / event.total) * 100);
                        onProgress(percent);
                    }
                });
            }

            xhr.addEventListener('load', () => {
                try {
                    const parsed = JSON.parse(xhr.responseText);
                    if (xhr.status >= 200 && xhr.status < 300) {
                        resolve(parsed);
                    } else {
                        reject(new Error(parsed.message || 'Upload failed'));
                    }
                } catch {
                    reject(new Error('Invalid response from server during file upload'));
                }
            });

            xhr.addEventListener('error', () => {
                reject(new Error('Network error while uploading file'));
            });

            xhr.send(file);
        });
    }

    async renameFile(fileId: string, name: string): Promise<ApiResponse<IFile>> {
        return this.request<IFile>(`/files/${fileId}`, {
            method: 'PATCH',
            body: JSON.stringify({ name }),
        });
    }

    async deleteFile(fileId: string): Promise<ApiResponse<IFile>> {
        return this.request<IFile>(`/files/${fileId}`, {
            method: 'DELETE',
        });
    }

    // ── Payments & Subscriptions (/api/payments/*) ───────────────────────────

    async getPlans(): Promise<ApiResponse<IPlan[]>> {
        return this.request<IPlan[]>('/payments/plans');
    }

    async getMySubscription(): Promise<ApiResponse<ISubscription | null>> {
        return this.request<ISubscription | null>('/payments/my-subscription');
    }

    async createSubscription(payload: {
        planId: string;
        paymentType: PaymentType;
        billingCycle: BillingCycle;
        provider: PaymentProvider;
    }): Promise<
        ApiResponse & {
            provider: PaymentProvider;
            flow: 'popup' | 'redirect';
            data: {
                url?: string;
                orderId?: string;
                subscriptionId?: string;
                checkoutSessionId?: string;
                type: PaymentType;
            };
        }
    > {
        return this.request('/payments/subscriptions', {
            method: 'POST',
            body: JSON.stringify(payload),
        }) as any;
    }
}

export const apiService = new ApiService();
