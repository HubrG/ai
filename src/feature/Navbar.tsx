import { getAuthSession } from "@/lib/auth";
import { LoginButton } from "./header/auth/LoginButton";
import { UserProfile } from "./header/auth/UserProfile";
import { Button } from "@/components/ui/button";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGift, faSpinner } from "@fortawesome/pro-solid-svg-icons";
import Link from "next/link";
import MainMenu from "@/src/feature/header/MainMenu";
import BurgerMenu from "@/src/feature/header/BurgerMenu";
import { Suspense } from "react";
import { ThemeToggle } from "../theme/ThemeToggle";

export const Navbar = async () => {
  const session = await getAuthSession();
  //  Construction du menu
  const prefix = "/raconter-ses-memoires/";
  const links = [
    {
      url: prefix + "fonctionnement",
      name: "Fonctionnement",
    },
    { url: prefix + "tarifs", name: "Tarifs" },
    { url: prefix + "contact", name: "Contact" },
  ];
  //
  return (
    <header className=" z-20 w-full">
      <nav>
        <div>
          <Link href="/" className="logo mr-2">
            <span className="sm:text-xs">
              <span>e</span>
              <span>koseon</span>
            </span>
          </Link>
          <div className="flex gap-x-2 md:order-2 items-center lg:text-base">
            <div className="flex items-center gap-x-2">
              <Link href="/raconter-ses-memoires/tarifs">
                <Button size="lg" className="px-4" variant="ghost">
                  <FontAwesomeIcon icon={faGift} className="mr-2" />
                  Acheter
                </Button>
              </Link>
              <div className="md:block hidden">
                <Suspense fallback={<FontAwesomeIcon icon={faSpinner} />}>
                  {session?.user?.name && session.user.role ? <UserProfile user={session.user.name} role={session.user.role}  /> : <LoginButton />}
                </Suspense>
                </div>
              <ThemeToggle />
            </div>{" "}
            <BurgerMenu links={links} user={session?.user} />
          </div>
          <MainMenu links={links} />
        </div>
      </nav>
    </header>
  );
};