import { cookies } from "next/headers";
import { getRequestConfig } from "next-intl/server";

import { DEFAULT_LOCALE, isLocale, LOCALE_COOKIE } from "./config";

// No [locale] segment: the locale lives in a cookie, read once per request.
export default getRequestConfig(async () => {
	const cookieStore = await cookies();
	const cookieValue = cookieStore.get(LOCALE_COOKIE)?.value;
	const locale = isLocale(cookieValue) ? cookieValue : DEFAULT_LOCALE;

	return {
		locale,
		messages: (await import(`../../messages/${locale}.json`)).default,
	};
});
