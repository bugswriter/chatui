// src/lib/stores/authStore.ts

import { writable } from 'svelte/store';
import { getAuthToken, clearAuthToken } from '$lib/services/api';
import {
	login as apiLogin,
	logout as apiLogout,
	getUserDetails,
	type UserDetails
} from '$lib/services/auth';
import { chatStore } from './chatStore';
import { agentStore } from './agentStore'; // ✅ IMPORT the new agent store

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

		isLoading: true, // Start as true to check for existing token
		error: null
	});

	// --- Public Actions ---

	/**
	 * Checks for an existing auth token and tries to fetch user details.
	 * This should be called once when the app starts.
	 */
	async function initialize() {
		const token = getAuthToken();
		if (token) {
			try {
				const user = await getUserDetails();
				set({ isAuthenticated: true, user, isLoading: false, error: null });
				agentStore.initialize(); // ✅ INITIALIZE agents on successful session load
			} catch (error) {
				// Token is invalid or expired
				clearAuthToken();
				set({ isAuthenticated: false, user: null, isLoading: false, error: null });
			}
		} else {
			// No token, not logged in.
			set({ isAuthenticated: false, user: null, isLoading: false, error: null });
		}
	}

	/**
	 * Attempts to log in the user with the given credentials.
	 */
	async function login(username: string, password: string) {
		update((state) => ({ ...state, isLoading: true, error: null }));
		try {
			await apiLogin(username, password);

			const user = await getUserDetails();
			update((state) => ({ ...state, isAuthenticated: true, user, isLoading: false }));
			agentStore.initialize(); // ✅ INITIALIZE agents on successful login
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Login failed';
			update((state) => ({ ...state, isAuthenticated: false, error: errorMessage, isLoading: false }));
			// Re-throw the error so the component knows the login failed
			throw error;
		}
	}

	/**
	 * Logs out the current user.
	 */
	function logout() {
		apiLogout(); // Clears the token from localStorage
		chatStore.reset(); // Reset the chat history and session
		set({ isAuthenticated: false, user: null, isLoading: false, error: null });
		// We don't need to reset the agent store, it will just be re-initialized on next login.
	}

	return {
		subscribe,
		initialize,
		login,
		logout
	};
}

export const authStore = createAuthStore();