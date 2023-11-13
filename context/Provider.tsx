"use client"
import { Session } from "next-auth"; // Importez le type Session

import { SessionProvider } from "next-auth/react";
type ProviderProps = {
    children: React.ReactNode;
    session: Session;
};

export default function Provider({ children, session }: ProviderProps) {

    return (
        <SessionProvider session={session}>
            {children}
        </SessionProvider>
    )
}