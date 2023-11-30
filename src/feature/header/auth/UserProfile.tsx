"use client";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import { DropdownMenuItemLogout } from "./LogoutButton";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTools,
  faUser,
  faBasketShopping,
} from "@fortawesome/pro-solid-svg-icons";
import { Separator } from "@/components/ui/separator";
import { User } from "@prisma/client";
import { useEffect, useState } from "react";
import { useGlobalContext } from "@/app/Context/store";
import { calculateTokenPercentage } from "@/src/function/tokenRemaining";
import Image from "next/image";
import { Tooltip } from "react-tooltip";

interface MenuProps {
  userInfo: User;
  className?: string;
}

export const UserProfile = ({ userInfo, className }: MenuProps) => {
  const { user, setUser } = useGlobalContext();
  const [tokenRemaining, setTokenRemaining] = useState<number>(
    userInfo?.tokenRemaining ?? user?.tokenRemaining
  );
  const [tokenByMonth, setTokenByMonth] = useState<number>(
    userInfo?.tokenByMonth ?? user?.tokenByMonth
  );
  useEffect(() => {
    if (userInfo && !user) {
      setUser(userInfo);
    }
  }, [userInfo, setUser, user]);

  useEffect(() => {
    if (user && user.tokenRemaining && user.tokenByMonth) {
      setTokenRemaining(user.tokenRemaining);
      setTokenByMonth(user.tokenByMonth);
    }
  }, [userInfo, user]);

  const tokenPercentage = calculateTokenPercentage(
    tokenRemaining,
    tokenByMonth
  );
  const tokenRemainingDisplay =
    user?.tokenRemaining ?? userInfo?.tokenRemaining;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild className={`flex flex-row w-full`}>
        <Button
          variant="ghost"
          className={`${
            className
              ? "flex flex-row " + className
              : "flex flex-row items-center gap-2 justify-center w-32 pr-5"
          }`}>
          <div className="w-10 h-10 p-0 userNavbarDiv">
            <div className="relative rounded-full w-full border-[3px] border-app-300 dark:border-app-950  p-0">
              {user?.image && (
                <Image
                  src={user.image}
                  alt="Profil picture"
                  fill
                  className="object-cover rounded-full w-20 h-20"
                />
              )}
            </div>
          </div>
          <div className="w-full userNavbarDiv">
            <div className="relative w-full" data-tooltip-id="remainingTooltip">
              <div
                className={`${
                  tokenPercentage <= 0
                    ? "progressTokenVoid"
                    : tokenPercentage < 10
                      ? "progressToken bg-red-500"
                      : "progressToken"
                }`}
                style={{
                  width: `${tokenPercentage}%`,
                }}>
                &nbsp;
              </div>
              <div className="progressTokenVoid"></div>
            </div>
            <Tooltip
              id="remainingTooltip"
              opacity={1}
              classNameArrow="hidden"
              variant="dark"
              className="tooltip flex flex-col">
              <span className="font-bold">
                Remaining credits :{" "}
                {tokenPercentage <= 0 ? 0 : tokenPercentage.toFixed(1)}%
              </span>
              <small>
                {tokenRemainingDisplay <= 0 ? 0 : tokenRemainingDisplay}
                &nbsp;/&nbsp;
                {user ? user.tokenByMonth : userInfo?.tokenByMonth}
              </small>
            </Tooltip>
          </div>
          {className && (
            <div className="ml-5">
             {tokenPercentage.toFixed(2)}%
            </div>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-full">
        <DropdownMenuItem className="w-full" asChild>
          <Link href="/profil/mon-compte" className="nunderline">
            <FontAwesomeIcon icon={faUser} className="mr-2 h-4 w-4" />
            Mon compte
          </Link>
        </DropdownMenuItem>
        <Separator className="my-2" />
        <DropdownMenuItem className="w-full" asChild>
          <Link href="/profil/mes-commandes" className="nunderline">
            <FontAwesomeIcon icon={faBasketShopping} className="mr-2 h-4 w-4" />
            Mes commandes
          </Link>
        </DropdownMenuItem>
        <Separator className="my-2" />

        {userInfo?.role === "ADMIN" && (
          <>
            <DropdownMenuItem className="w-full" asChild>
              <Link prefetch={false} href="/admin" className="nunderline">
                <FontAwesomeIcon icon={faTools} className="mr-2 h-4 w-4" />
                Admin
              </Link>
            </DropdownMenuItem>
            <Separator className="my-2" />
          </>
        )}
        <DropdownMenuItemLogout />
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
