import { t } from "@shared/i18n";
import { Icon } from "../icon";
import styles from "./media-error.module.css";

export const MediaError = () => (
	<div className={styles.mediaError}>
		<Icon className={styles.icon} name="no-symbol" />
		<p className={styles.message}>{t("viewer@load_error")}</p>
	</div>
);
