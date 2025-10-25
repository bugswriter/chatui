// src/lib/stores/authStore.ts

import { writable } from 'svelte/store';
import { getAuthToken, clearAuthToken } from '$lib/services/api';
import {
	login as apiLogin,
	logout as apiLogout,
	getUserDetails,
	updateUserAvatar as apiUpdateAvatar,
	type UserDetails
} from '$lib/services/auth';
import { chatStore } from './chatStore';
import { agentStore } from './agentStore';

// --- Type Definition for the store's state ---
type AuthState = {
	isAuthenticated: boolean;
	user: UserDetails | null;
	isLoading: boolean; // For login process or initial token check
	error: string | null;
};

function createAuthStore() {
	const { subscribe, set, update } = writable<AuthState>({
		isAuthenticated: false,
		user: null,
		isLoading: true,
		error: null
	});

	// --- Public Actions ---

	async function initialize() {
		const token = getAuthToken();
		if (token) {
			try {
				const user = await getUserDetails();
				set({ isAuthenticated: true, user, isLoading: false, error: null });
				agentStore.initialize();
			} catch (error) {
				clearAuthToken();
				set({ isAuthenticated: false, user: null, isLoading: false, error: null });
			}
		} else {
			set({ isAuthenticated: false, user: null, isLoading: false, error: null });
		}
	}

	async function login(username: string, password: string) {
		update((state) => ({ ...state, isLoading: true, error: null }));
		try {
			await apiLogin(username, password);
			const user = await getUserDetails();
			update((state) => ({ ...state, isAuthenticated: true, user, isLoading: false }));
			agentStore.initialize();
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Login failed';
			update((state) => ({ ...state, isAuthenticated: false, error: errorMessage, isLoading: false }));
			throw error;
		}
	}

	function logout() {
		apiLogout();
		chatStore.reset();
		set({ isAuthenticated: false, user: null, isLoading: false, error: null });
	}

	async function updateAvatar(avatarFile: File) {
		try {
			const updatedUser = await apiUpdateAvatar(avatarFile);
			update((state) => ({ ...state, user: updatedUser }));
		} catch (error) {
			console.error('Avatar update failed:', error);
			throw error;
		}
	}

	// --- ✅ NEW: Action to silently refresh user details ---
	/**
	 * Fetches the latest user details from the backend and updates the store.
	 * This is done silently without setting the main isLoading flag, so it
	 * can be called in the background without disrupting the UI.
	 */
	async function refreshUserDetails() {
		const token = getAuthToken();
		if (!token) return; // Can't refresh if not logged in

		try {
			const user = await getUserDetails();
			// Only update the user object, keeping other state as is
			update((state) => ({ ...state, user }));
		} catch (error) {
			// If fetching fails (e.g., token expired), log the user out.
			console.error('Failed to refresh user details, logging out:', error);
			logout();
		}
	}

	return {
		subscribe,
		initialize,
		login,
		logout,
		updateAvatar,
		refreshUserDetails // ✅ EXPORT the new action
	};
}

export const authStore = createAuthStore();