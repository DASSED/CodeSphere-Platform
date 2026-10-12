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
	logger: Pick<Logger, "warn">,
): AuthHooks {
	const mail = createEmailClient(env);
	return {
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
