import type { AuthHooks } from "@codesphere/auth";
import {
	composeEmail,
	createEmailClient,
	type EmailEnv,
	localeFromAcceptLanguage,
} from "@codesphere/email";
import type { Logger } from "@codesphere/logger";

/**
 * The messages the API sends on its own initiative. The recipient address is never logged
 * (spec §4): a failed send is reported by status and message id only.
 */
export function createMailHooks(
	env: EmailEnv,
	logger: Pick<Logger, "warn" | "info">,
	development = false,
): AuthHooks {
	const mail = createEmailClient(env);
	return {
		async sendSignInOtp(email, otp, acceptLanguage) {
			const result = await mail.send({
				to: email,
				...composeEmail({
					kind: "sign-in-code",
					props: {
						code: otp,
						locale: localeFromAcceptLanguage(acceptLanguage),
					},
				}),
			});
			if (result.status === "failed") {
				logger.warn({ message: result.message }, "sign-in code not sent");
			}
			// Local development: the code is also in the server log, whatever the mail provider
			// says (no address, spec §4). Never outside development.
			if (development) {
				logger.info({ otp }, "sign-in code (development)");
			}
		},
		async onMemberCreated(member, acceptLanguage) {
			const result = await mail.send({
				to: member.email,
				// A retried hook never sends the welcome twice.
				idempotencyKey: `welcome/${member.id}`,
				...composeEmail({
					kind: "welcome",
					props: {
						name: member.name,
						locale: localeFromAcceptLanguage(acceptLanguage),
					},
				}),
			});
			if (result.status === "failed") {
				logger.warn({ message: result.message }, "welcome email not sent");
			}
		},
	};
}
