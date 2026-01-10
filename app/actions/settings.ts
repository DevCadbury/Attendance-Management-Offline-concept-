'use server';

import { getSettings, saveSettings, Settings } from '@/lib/db';
import { revalidatePath } from 'next/cache';

export async function getSettingsAction() {
    return await getSettings();
}

export async function updateSettingsAction(settings: Settings) {
    await saveSettings(settings);
    revalidatePath('/admin');
    return { success: true };
}
