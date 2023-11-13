"use client";
import { Button } from "@/components/ui/button";
import { faBars } from "@fortawesome/pro-solid-svg-icons";
import React, { useState, Suspense } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LoginButton } from "@/src/feature/header/auth/LoginButton";
import { UserProfile } from "@/src/feature/header/auth/UserProfile";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {  faSpinner } from "@fortawesome/pro-solid-svg-icons";

interface Link {
  url: string;
  name: string;
}

interface MenuProps {
  links: Link[];
  user: any;
}

export default function BurgerMenu(props:MenuProps) {
  const pathname = usePathname();
  const { links, user } = props;
  const [display, setDisplay] = useState(false);

  return (
    <>
    <Button
      variant="ghost"
        onClick={() => { display ? setDisplay(false) : setDisplay(true) }}
      type="button"
      size="sm"
      className="inline-flex md:hidden"
      >
      <span className="sr-only">Ouvrir le menu principal</span>
      <FontAwesomeIcon icon={faBars} />
    </Button>
    <div className={`${display? "md:absolute" : "hidden"} burger-menu`}>
    <ul>
    {links.map((link, index) => (
          <li key={index} className="md:hidden">
            <Link
             onClick={() => { setDisplay(false) }}
              href={link.url}
              className={` ${
                pathname === link.url
                  ? "burger-active"
                  : "text-app-900"
              } nunderline`}>
              {link.name}
            </Link>
          </li>
        ))}
        <li onClick={() => { setDisplay(false) }}>
            <Suspense fallback={<FontAwesomeIcon icon={faSpinner} />}>
              {user?.name ? <UserProfile user={user.name} role={user.role} /> : <LoginButton />}
            </Suspense>
          </li>
        </ul>
      </div>
    </>
  );
}