// src/lib/services/api.ts

export const API_CONFIG = {
	authBaseUrl: 'https://bugswriter.ai',
	apiBaseUrl: 'https://sys.bugswriter.ai'
};

const AUTH_TOKEN_KEY = 'authToken';

// Safely get the token from localStorage
export const getAuthToken = (): string | null => {
	// Check if we are in the browser environment
	if (typeof window !== 'undefined' && window.localStorage) {
		return localStorage.getItem(AUTH_TOKEN_KEY);
	}
	return null;
};

// Safely set the token in localStorage
export const setAuthToken = (token: string) => {
	if (typeof window !== 'undefined' && window.localStorage) {
		localStorage.setItem(AUTH_TOKEN_KEY, token);
	}
};

// Safely clear the token from localStorage
export const clearAuthToken = () => {
	if (typeof window !== 'undefined' && window.localStorage) {
		localStorage.removeItem(AUTH_TOKEN_KEY);
	}
};