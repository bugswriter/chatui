// src/lib/stores/settingsStore.ts

import { writable } from 'svelte/store';

// Define the shape of our settings, with theme removed.
type Settings = {
	showFilePreviews: boolean;
};

// --- Helper functions for localStorage ---
const getStoredSettings = (): Settings => {
	if (typeof window === 'undefined') {
		return { showFilePreviews: true };
	}
	const storedFilePreviews = localStorage.getItem('showFilePreviews');

	return {
		showFilePreviews: storedFilePreviews !== null ? storedFilePreviews === 'true' : true
	};
};

const saveSettings = (settings: Settings) => {
	if (typeof window !== 'undefined') {
		localStorage.setItem('showFilePreviews', String(settings.showFilePreviews));
	}
};

// --- Store Definition ---

function createSettingsStore() {
	// Initialize the store with values from localStorage
	const { subscribe, set, update } = writable<Settings>(getStoredSettings());

	subscribe((settings) => {
		saveSettings(settings);

		// Apply the single, static theme to the document for CSS to pick up.
		if (typeof document !== 'undefined') {
			document.documentElement.setAttribute('data-theme', 'light');
		}
	});

	return {
		subscribe,
		// Expose a method to change the specific setting
		toggleFilePreviews: () => update((s) => ({ ...s, showFilePreviews: !s.showFilePreviews }))
	};
}

export const settingsStore = createSettingsStore();