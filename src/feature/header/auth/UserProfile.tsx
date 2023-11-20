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

interface MenuProps {
  user: User;
}



export const UserProfile = ({ user }: MenuProps) => {
  console.log(user);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="flex flex-row items-center gap-2">
          <span className="flex flex-row items-center gap-2">
            <FontAwesomeIcon icon={faUser} className="mr-2 h-4 w-4" />
            <span className="lg:block md:hidden block font-bold text-base">
              {user.name}
            </span>
          </span>
          <span>
            <span className="lg:block md:hidden block font-bold text-base">
              Token restants : {user.tokenRemaining}
            </span>
          </span>
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
        {user.role === "ADMIN" && (
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
