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