"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

import { isLocale, LOCALE_COOKIE } from "./config";

export async function setLocale(value: string) {
	if (!isLocale(value)) {
		return;
	}
	const cookieStore = await cookies();
	cookieStore.set(LOCALE_COOKIE, value, {
		path: "/",
		maxAge: 60 * 60 * 24 * 365,
		sameSite: "lax",
	});
	revalidatePath("/", "layout");
}
