// src/lib/stores/settingsStore.ts

import { writable } from 'svelte/store';

// Define the shape of our settings
type Settings = {
	theme: 'light' | 'lain' | 'forest';
	showFilePreviews: boolean;
};

// --- Helper functions for localStorage ---
const getStoredSettings = (): Settings => {
	if (typeof window === 'undefined') {
		return { theme: 'light', showFilePreviews: true };
	}
	const storedTheme = localStorage.getItem('theme') as Settings['theme'];
	const storedFilePreviews = localStorage.getItem('showFilePreviews');

	return {
		theme: storedTheme || 'light',
		showFilePreviews: storedFilePreviews !== null ? storedFilePreviews === 'true' : true
	};
};

const saveSettings = (settings: Settings) => {
	if (typeof window !== 'undefined') {
		localStorage.setItem('theme', settings.theme);
		localStorage.setItem('showFilePreviews', String(settings.showFilePreviews));
	}
};

// --- Store Definition ---

function createSettingsStore() {
	// Initialize the store with values from localStorage
	const { subscribe, set, update } = writable<Settings>(getStoredSettings());

	// Svelte magic: whenever the store value changes, this subscription
	// will run and save the new value to localStorage.
	subscribe((settings) => {
		saveSettings(settings);

		// Also apply the theme to the document body for CSS to pick up
		if (typeof document !== 'undefined') {
			document.documentElement.setAttribute('data-theme', settings.theme);
		}
	});

	return {
		subscribe,
		// Expose methods to change specific settings
		setTheme: (theme: Settings['theme']) => update((s) => ({ ...s, theme })),
		toggleFilePreviews: () => update((s) => ({ ...s, showFilePreviews: !s.showFilePreviews }))
	};
}

export const settingsStore = createSettingsStore();