// src/lib/services/auth.ts

import { API_CONFIG, setAuthToken, clearAuthToken, getAuthToken } from '$lib/services/api';

// --- Type Definitions ---

interface LoginResponse {
	access_token: string;
	token_type: string;
}

export interface UserDetails {
	email: string;
	name: string;
	id: string;
	coins: number;
	subscription_status: string;
	avatar?: string | null; // ✅ Ensure avatar is part of the type
}

// --- Service Functions ---

export const login = async (username: string, password: string): Promise<LoginResponse> => {
	const formData = new URLSearchParams();
	formData.append('username', username);
	formData.append('password', password);
	formData.append('grant_type', 'password');

	const response = await fetch(`${API_CONFIG.authBaseUrl}/api/v1/auth/token`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded'
		},
		body: formData
	});

	if (!response.ok) {
		const error = await response.json().catch(() => ({ detail: 'Login failed due to a network or server error.' }));
		throw new Error(error.detail || 'Invalid credentials');
	}

	const data: LoginResponse = await response.json();
	setAuthToken(data.access_token);
	return data;
};

export const getUserDetails = async (): Promise<UserDetails> => {
	const token = getAuthToken();
	if (!token) {
		throw new Error('No authentication token found. Please log in.');
	}

	const response = await fetch(`${API_CONFIG.authBaseUrl}/api/v1/users/me`, {
		headers: {
			Authorization: `Bearer ${token}`
		}
	});

	if (!response.ok) {
        // When the token is invalid or expired, the session should be cleared.
        clearAuthToken();
		throw new Error('Failed to fetch user details. Your session may be invalid.');
	}

	return response.json();
};

export const logout = () => {
	clearAuthToken();
};

// --- ✅ NEW: Function to update the user's avatar ---

/**
 * Uploads a new avatar for the currently authenticated user.
 * @param avatarFile The image File object to upload.
 * @returns A promise that resolves to the updated UserDetails object.
 */
export const updateUserAvatar = async (avatarFile: File): Promise<UserDetails> => {
	const token = getAuthToken();
	if (!token) {
		throw new Error('Authentication token not found.');
	}

	// For file uploads, we use FormData instead of JSON.
	const formData = new FormData();
	formData.append('avatar_file', avatarFile); // The field name must match the FastAPI endpoint

	const response = await fetch(`${API_CONFIG.authBaseUrl}/api/v1/users/me/avatar`, {
		method: 'POST',
		headers: {
			// 'Content-Type' is set automatically by the browser for FormData.
			// Do NOT set it manually.
			Authorization: `Bearer ${token}`
		},
		body: formData
	});

	if (!response.ok) {
		const errorData = await response.json().catch(() => null);
		const errorMessage = errorData?.detail || 'Failed to upload avatar. Please try again.';
		throw new Error(errorMessage);
	}

	return response.json();
};