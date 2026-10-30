import { t } from "@shared/i18n";
import { Icon } from "../../../components";
import styles from "./image-error.module.css";

export const ImageError = () => (
	<div className={styles.imageError}>
		<Icon className={styles.icon} name="no-symbol" />
		<p className={styles.message}>{t("viewer@image_error")}</p>
	</div>
);
