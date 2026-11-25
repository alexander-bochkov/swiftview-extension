import { type ChangeEvent, useEffect, useState } from "react";
import { videoOptions } from "@/shared/storage";
import type { VideoOptions } from "@/shared/types";
import styles from "./video.module.css";

export const Video = () => {
	const [options, setOptions] = useState<VideoOptions>();

	useEffect(() => {
		videoOptions.getValue().then(setOptions);
		return videoOptions.watch(setOptions);
	}, []);

	const handleChange = ({
		target: { checked, id },
	}: ChangeEvent<HTMLInputElement>): void => {
		if (!options) return;

		const nextOptions = { ...options, [id]: checked };

		// Updated before saving, so a quick second click builds on this change.
		setOptions(nextOptions);

		videoOptions.setValue(nextOptions).catch((error: unknown) => {
			console.error(error);
			// Restores the checkboxes to the saved options.
			videoOptions.getValue().then(setOptions);
		});
	};

	return (
		options && (
			<fieldset className={styles.video}>
				<legend>{browser.i18n.getMessage("options_video@title")}</legend>
				<div className={styles.option}>
					<input
						checked={options.autoplay}
						id="autoplay"
						onChange={handleChange}
						type="checkbox"
					/>
					<label htmlFor="autoplay">
						{browser.i18n.getMessage("options_video@autoplay")}
					</label>
				</div>
				<div className={styles.option}>
					<input
						checked={options.loop}
						id="loop"
						onChange={handleChange}
						type="checkbox"
					/>
					<label htmlFor="loop">
						{browser.i18n.getMessage("options_video@loop")}
					</label>
				</div>
				<div className={styles.option}>
					<input
						checked={options.muted}
						id="muted"
						onChange={handleChange}
						type="checkbox"
					/>
					<label htmlFor="muted">
						{browser.i18n.getMessage("options_video@muted")}
					</label>
				</div>
			</fieldset>
		)
	);
};
