import { useEffect, useState } from "react";
import { videoOptions } from "@/shared/storage";
import type { VideoOptions } from "@/shared/types";
import styles from "./video.module.css";

const OPTION_KEYS = [
	"autoplay",
	"loop",
	"muted",
] as const satisfies ReadonlyArray<keyof VideoOptions>;

export const Video = () => {
	const [options, setOptions] = useState<VideoOptions>();

	useEffect(() => {
		videoOptions.getValue().then(setOptions, console.error);
		return videoOptions.watch(setOptions);
	}, []);

	const handleChange = (key: keyof VideoOptions, checked: boolean): void => {
		if (!options) return;

		const nextOptions: VideoOptions = { ...options, [key]: checked };

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
				{OPTION_KEYS.map((key) => (
					<div className={styles.option} key={key}>
						<input
							checked={options[key]}
							id={key}
							onChange={({ target }) => handleChange(key, target.checked)}
							type="checkbox"
						/>
						<label htmlFor={key}>
							{browser.i18n.getMessage(`options_video@${key}`)}
						</label>
					</div>
				))}
			</fieldset>
		)
	);
};
