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
import { faTools, faUser, faBasketShopping } from "@fortawesome/pro-solid-svg-icons";
import { Separator } from "@/components/ui/separator";

interface MenuProps {
  user: string;
  role: string;
}
export const UserProfile = (props: MenuProps) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="lg" variant="ghost">
          <FontAwesomeIcon icon={faUser} className="mr-2 h-4 w-4" />
          <span className="lg:block md:hidden block">{props.user}</span>
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
        {props.role === "ADMIN" && (
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
