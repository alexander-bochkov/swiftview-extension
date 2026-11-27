import { Icon } from "../icon";
import styles from "./load-error.module.css";

export const LoadError = () => (
	<div className={styles.loadError}>
		<Icon className={styles.icon} name="no-symbol" />
		<p className={styles.message}>{i18n.t("viewer.load_error")}</p>
	</div>
);
