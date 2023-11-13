"use client";

import { toast, ToastPosition, Theme } from 'react-toastify';
import { Toastify } from './Toastify';
import React, { useState, useEffect } from "react"

type Toast = {
	position?: ToastPosition;  // Utilisez ToastPosition ici
	value?: string;
	type?: string;
	theme?: Theme;
	autoClose?: number | false;
}

export const ToastDisplayOnSSR = ({ type = "default", value = "Il se passe quelque chose...", position = "bottom-center", theme = "colored", autoClose = 3000 } : Toast) => {
    const [isLoad, setIsLoad] = useState(false)
    
    useEffect(() => {
        if (isLoad === true) {
            Toastify({
                type: type,
                autoClose: 3000,
                value: value,
                position: position,
                theme: theme,
            });
        } else {
            setIsLoad(true);
        }
    },[isLoad, position, theme,autoClose,value,type])
return (<></>)
}
