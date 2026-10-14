"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { authClient } from "./auth-client";
import { deleteDraft, loadDraft, saveDraft } from "./local-store";

const SAVE_DELAY = 400;

/**
 * Unsent writing kept on the device (a Draft, spec §3): restored on the next visit, saved as the
 * Member types, offline included, and filed under the signed-in Member. `ready` turns true once
 * the stored Draft, if any, was read.
 */
export function useDraft<T>(key: string, initial: T) {
	const { data: session } = authClient.useSession();
	const memberId = session?.user.id ?? null;
	const [value, setValue] = useState<T>(initial);
	const [ready, setReady] = useState(false);
	const initialRef = useRef(initial);
	const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

	useEffect(() => {
		setReady(false);
		if (!memberId) {
			return;
		}
		let cancelled = false;
		void loadDraft<T>(memberId, key).then((stored) => {
			if (!cancelled) {
				setValue(stored ?? initialRef.current);
				setReady(true);
			}
		});
		return () => {
			cancelled = true;
		};
	}, [memberId, key]);

	const update = useCallback(
		(next: T) => {
			setValue(next);
			if (!memberId) {
				return;
			}
			clearTimeout(timer.current);
			timer.current = setTimeout(
				() => void saveDraft(memberId, key, next),
				SAVE_DELAY,
			);
		},
		[memberId, key],
	);

	const discard = useCallback(() => {
		clearTimeout(timer.current);
		setValue(initialRef.current);
		if (memberId) {
			void deleteDraft(memberId, key);
		}
	}, [memberId, key]);

	return { value, setValue: update, discard, ready };
}
