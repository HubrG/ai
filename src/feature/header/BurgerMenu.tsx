"use client";
import { Button } from "@/components/ui/button";
import { faBars } from "@fortawesome/pro-solid-svg-icons";
import React, { useState, Suspense } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LoginButton } from "@/src/feature/header/auth/LoginButton";
import { UserProfile } from "@/src/feature/header/auth/UserProfile";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { CreateNewPdfButton } from "../main-feature/ai-pdf-creator/components/CreateNewPdfButton";

interface Link {
  url: string;
  name: string;
}

interface MenuProps {
  links: Link[];
  user: any;
}

export default function BurgerMenu(props: MenuProps) {
  const pathname = usePathname();
  const { links, user } = props;
  const [display, setDisplay] = useState(false);

  return (
    <>
      <Button
        variant="ghost"
        onClick={() => {
          display ? setDisplay(false) : setDisplay(true);
        }}
        type="button"
        size="sm"
        className="inline-flex lg:hidden">
        <span className="sr-only">Ouvrir le menu principal</span>
        <FontAwesomeIcon icon={faBars} />
      </Button>
      <div className={`xl:block ${display ? "" : "hidden"} burger-menu`}>
        <ul>
          {links.map((link, index) => (
            <li key={index} className="">
              <Link
                onClick={() => {
                  setDisplay(false);
                }}
                href={link.url}
                className={` ${
                  pathname === link.url ? "burger-active" : "text-app-900"
                } nunderline`}>
                {link.name}
              </Link>
            </li>
          ))}
          <li
            className="sm:hidden flex w-full justify-center "
            onClick={() => {
              setDisplay(false);
            }}>
            {user ? (
              <UserProfile className="w-full" userInfo={user} />
            ) : (
              <LoginButton />
            )}
          </li>
          <li
            className="sm:hidden flex w-full justify-center "
            onClick={() => {
              setDisplay(false);
            }}>
            <CreateNewPdfButton className="w-full" user={user} />
          </li>
        </ul>
      </div>
    </>
  );
}
