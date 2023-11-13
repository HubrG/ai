
import { toast, ToastPosition, Theme } from 'react-toastify';

type Toast = {
	position?: ToastPosition;  // Utilisez ToastPosition ici
	value?: string;
	type?: string;
	theme?: Theme;
	autoClose?: number | false;
}

export const Toastify = ({ type = "default", value = "Il se passe quelque chose...", position = "bottom-center", theme = "colored", autoClose = 3000 } : Toast) => {
	if (type === "error") {
		return toast.error(value, {
			position: position,
			autoClose: autoClose,
			hideProgressBar: false,
			closeOnClick: true,
			pauseOnHover: true,
			draggable: true,
			progress: undefined,
			theme: theme,
		});
	} else if (type === "success") {
		return toast.success(value, {
			position: position,
			autoClose: autoClose,
			hideProgressBar: false,
			closeOnClick: true,
			pauseOnHover: true,
			draggable: true,
			progress: undefined,
			theme: theme,

		});
	} else if (type === "warning") {
		return toast.warning(value, {
			position: position,
			autoClose: autoClose,
			hideProgressBar: false,
			closeOnClick: true,
			pauseOnHover: true,
			draggable: true,
			progress: undefined,
			theme: theme,

		});
	} else if (type === "info") {
		return toast.info(value, {
			position: position,
			autoClose: autoClose,
			hideProgressBar: false,
			closeOnClick: true,
			pauseOnHover: true,
			draggable: true,
			progress: undefined,
			theme: theme,

		});
	}
	else if (type === "default") {
		return toast(value, {
			position: position,
			autoClose: autoClose,
			hideProgressBar: false,
			closeOnClick: true,
			pauseOnHover: true,
			draggable: true,
			progress: undefined,
			theme: theme,

		});
	}
 
}
